import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { isSameCalendarDay, FREE_DAILY_LIMIT } from '../middleware/dailyLimitGuard';

export class AuthController {
  /**
   * Registro de nuevo usuario (rol USER únicamente)
   */
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, last_name, email, password, confirm_password } = req.body;

      // 1. Validaciones de presencia
      if (!name || !last_name || !email || !password || !confirm_password) {
        res.status(400).json({
          success: false,
          message: 'Todos los campos son obligatorios: Nombre, Apellido, Email y Contraseñas.',
        });
        return;
      }

      // 2. Validación de formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const normalizedEmail = email.toLowerCase().trim();
      if (!emailRegex.test(normalizedEmail)) {
        res.status(400).json({
          success: false,
          message: 'Por favor, proporciona un correo electrónico válido.',
        });
        return;
      }

      // 3. Validación de coincidencia de contraseña
      if (password !== confirm_password) {
        res.status(400).json({
          success: false,
          message: 'Las contraseñas no coinciden.',
        });
        return;
      }

      // 4. Validación de seguridad de contraseña
      if (password.length < 8) {
        res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 8 caracteres.',
        });
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
        });
        return;
      }

      // 6. Hasheo seguro de contraseña
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      // 7. Creación de usuario (rol estricto USER, sin posibilidad de escalada)
      const newUser = await prisma.user.create({
        data: {
          name: name.trim(),
          last_name: last_name.trim(),
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
        message: '¡Registro exitoso! Bienvenido a Veritas AI.',
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

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Por favor, proporciona el correo electrónico y la contraseña.',
        });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Credenciales inválidas. Verifica tu correo y contraseña.',
        });
        return;
      }

      if (!user.is_active) {
        res.status(403).json({
          success: false,
          message: 'Esta cuenta ha sido desactivada. Por favor contacta al administrador.',
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Credenciales inválidas. Verifica tu correo y contraseña.',
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
