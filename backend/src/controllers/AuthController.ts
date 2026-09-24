import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { isSameCalendarDay, FREE_DAILY_LIMIT } from '../middleware/dailyLimitGuard';
import { validarPassword, generarPasswordHash, verificarPassword } from '../utils/passwordPolicy';

export class AuthController {
  /**
   * Registro de nuevo usuario (rol USER únicamente)
   */
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const rawName = req.body.name ?? req.body.nombre;
      const rawLastName = req.body.last_name ?? req.body.apellido ?? (rawName ? 'Usuario' : '');
      const rawEmail = req.body.email;
      const rawPassword = req.body.password;
      const rawConfirm = req.body.confirm_password ?? req.body.confirmPassword ?? rawPassword;

      // 1. Validaciones de presencia y de tipo (un número u objeto no es un correo)
      if (!rawName || typeof rawName !== 'string' ||
          !rawLastName || typeof rawLastName !== 'string' ||
          !rawEmail || typeof rawEmail !== 'string' ||
          !rawPassword || typeof rawPassword !== 'string' ||
          typeof rawConfirm !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Todos los campos son obligatorios: Nombre, Apellido, Email y Contraseñas.',
          mensaje: 'Datos inválidos',
        });
        return;
      }

      const name = rawName.trim();
      const last_name = rawLastName.trim();

      // 2. Validación de formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const normalizedEmail = rawEmail.toLowerCase().trim();
      if (!emailRegex.test(normalizedEmail)) {
        res.status(400).json({
          success: false,
          message: 'Por favor, proporciona un correo electrónico válido.',
          mensaje: 'Debe proporcionar un correo electrónico válido',
        });
        return;
      }

      // 3. Validación de coincidencia de contraseña
      if (rawPassword !== rawConfirm) {
        res.status(400).json({
          success: false,
          message: 'Las contraseñas no coinciden.',
          mensaje: 'Las contraseñas no coinciden.',
        });
        return;
      }

      // 4. Política de contraseñas (Lab 7): entre 10 y 72 caracteres, máximo 72 bytes
      const errorPassword = validarPassword(rawPassword);
      if (errorPassword) {
        res.status(400).json({ success: false, message: errorPassword, mensaje: errorPassword });
        return;
      }

      // 5. Verificar si el email ya se encuentra registrado
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'El correo electrónico ya está registrado. Inicia sesión en su lugar.',
          mensaje: 'Ya existe un usuario con ese correo electrónico',
        });
        return;
      }

      // 6. Hash con bcrypt: salt aleatorio incluido en el propio hash y coste 12
      const passwordHash = await generarPasswordHash(rawPassword);

      // 7. Creación de usuario (rol estricto USER, sin posibilidad de escalada)
      const newUser = await prisma.user.create({
        data: {
          name,
          last_name,
          email: normalizedEmail,
          password_hash: passwordHash,
          role: Role.USER, // Siempre USER en registro público
          is_active: true,
          is_premium: false,
          daily_analysis_count: 0,
        },
      });

      // 8. Generación de Token JWT
      const token = jwt.sign(
        {
          userId: newUser.id,
          email: newUser.email,
          role: newUser.role,
        },
        ENV.JWT_SECRET,
        { expiresIn: ENV.JWT_EXPIRES_IN as any }
      );

      res.status(201).json({
        success: true,
        message: '¡Registro exitoso! Bienvenido a Plagelio.',
        mensaje: 'Usuario registrado correctamente',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          last_name: newUser.last_name,
          email: newUser.email,
          role: newUser.role,
          is_premium: newUser.is_premium,
          daily_analysis_count: newUser.daily_analysis_count,
        },
        usuario: {
          id: newUser.id,
          nombre: `${newUser.name} ${newUser.last_name}`.trim(),
          email: newUser.email,
          rol: newUser.role.toLowerCase(),
          activo: newUser.is_active,
        },
      });
    } catch (error: any) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Ocurrió un error al procesar el registro.',
      });
    }
  }

  /**
   * Inicio de sesión para USER y ADMIN
   */
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Por favor, proporciona el correo electrónico y la contraseña.',
        });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();

      let user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      // Compatibilidad y transición transparente entre @plagelio.com y @veritas.ai
      if (!user) {
        if (normalizedEmail.endsWith('@plagelio.com')) {
          const legacyEmail = normalizedEmail.replace('@plagelio.com', '@veritas.ai');
          user = await prisma.user.findUnique({ where: { email: legacyEmail } });
        } else if (normalizedEmail.endsWith('@veritas.ai')) {
          const newEmail = normalizedEmail.replace('@veritas.ai', '@plagelio.com');
          user = await prisma.user.findUnique({ where: { email: newEmail } });
        }
      }

      // bcrypt se ejecuta SIEMPRE, exista o no la cuenta (Lab 7). Si el correo no
      // existe se compara contra un hash ficticio del mismo coste: así ambos caminos
      // tardan lo mismo y el tiempo de respuesta no revela qué correos están
      // registrados. Tampoco se crean cuentas desde aquí: el login ya no da de alta
      // usuarios con contraseñas escritas en el código.
      const passwordValida = await verificarPassword(password, user?.password_hash);

      if (!user || !passwordValida) {
        res.status(401).json({
          success: false,
          message: 'Credenciales inválidas. Verifica tu correo y contraseña.',
          mensaje: 'Credenciales inválidas',
        });
        return;
      }

      // El estado de la cuenta solo se revela a quien demuestra conocer la contraseña
      if (!user.is_active) {
        res.status(403).json({
          success: false,
          message: 'Esta cuenta ha sido desactivada. Por favor contacta al administrador.',
          mensaje: 'Usuario deshabilitado',
        });
        return;
      }

      // Reiniciar contador diario si comenzó un nuevo día
      const now = new Date();
      let dailyCount = user.daily_analysis_count;
      if (!isSameCalendarDay(now, new Date(user.last_analysis_date))) {
        dailyCount = 0;
        await prisma.user.update({
          where: { id: user.id },
          data: { daily_analysis_count: 0, last_analysis_date: now },
        });
      }

      // Generación de Token JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        ENV.JWT_SECRET,
        { expiresIn: ENV.JWT_EXPIRES_IN as any }
      );

      res.status(200).json({
        success: true,
        message: 'Sesión iniciada correctamente.',
        mensaje: 'Autenticación correcta',
        token,
        user: {
          id: user.id,
          name: user.name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          is_premium: user.is_premium,
          premium_since: user.premium_since,
          daily_analysis_count: dailyCount,
        },
        usuario: {
          id: user.id,
          nombre: `${user.name} ${user.last_name}`.trim(),
          email: user.email,
          rol: user.role.toLowerCase(),
        },
      });
    } catch (error: any) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Ocurrió un error al procesar el inicio de sesión.',
      });
    }
  }

  /**
   * Obtiene el perfil del usuario autenticado con estadísticas actualizadas
   */
  public static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          _count: {
            select: { analyses: true },
          },
        },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        return;
      }

      const now = new Date();
      let dailyCount = user.daily_analysis_count;
      if (!isSameCalendarDay(now, new Date(user.last_analysis_date))) {
        dailyCount = 0;
        await prisma.user.update({
          where: { id: user.id },
          data: { daily_analysis_count: 0, last_analysis_date: now },
        });
      }

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          is_premium: user.is_premium,
          premium_since: user.premium_since,
          daily_analysis_count: dailyCount,
          total_analyses: user._count.analyses,
          available_today: user.is_premium ? 'Ilimitados' : Math.max(0, FREE_DAILY_LIMIT - dailyCount),
          created_at: user.created_at,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Error al consultar perfil.' });
    }
  }

  /**
   * Actualiza datos básicos de perfil (nombre y apellido)
   */
  public static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'No autenticado.' });
        return;
      }

      const { name, last_name } = req.body;

      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(name && { name: name.trim() }),
          ...(last_name && { last_name: last_name.trim() }),
        },
      });

      res.status(200).json({
        success: true,
        message: 'Perfil actualizado.',
        user: {
          id: updated.id,
          name: updated.name,
          last_name: updated.last_name,
          email: updated.email,
          role: updated.role,
          is_premium: updated.is_premium,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Error al actualizar perfil.' });
    }
  }
}
