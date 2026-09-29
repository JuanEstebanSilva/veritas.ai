import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { isSameCalendarDay, FREE_DAILY_LIMIT } from '../middleware/dailyLimitGuard';
import { validarPassword } from '../utils/passwordPolicy';
import { matchedData } from 'express-validator';
import usuariosService from '../services/usuarios.service';

export class AuthController {
  /**
   * Registro de nuevo usuario (Laboratorio 8 — Control de rol y defensa en profundidad)
   */
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      // 1. PRIMERA DEFENSA: Extraer únicamente campos validados y permitidos mediante matchedData()
      // Cualquier campo adicional (rol, activo, esSuperAdmin, id, etc.) es completamente descartado
      const datosFiltrados = matchedData(req, { locations: ['body'] }) as Record<string, any>;

      const rawName = datosFiltrados.name ?? datosFiltrados.nombre ?? req.body.name ?? req.body.nombre;
      const rawLastName = datosFiltrados.last_name ?? datosFiltrados.apellido ?? req.body.last_name ?? req.body.apellido ?? '';
      const rawEmail = datosFiltrados.email ?? req.body.email;
      const rawPassword = datosFiltrados.password ?? req.body.password;
      const rawConfirm = datosFiltrados.confirm_password ?? req.body.confirm_password ?? req.body.confirmPassword ?? rawPassword;

      // Validación de presencia y tipos
      if (!rawName || typeof rawName !== 'string' ||
          !rawEmail || typeof rawEmail !== 'string' ||
          !rawPassword || typeof rawPassword !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Todos los campos son obligatorios: Nombre, Email y Contraseña.',
          mensaje: 'Datos inválidos',
        });
        return;
      }

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

      if (rawPassword !== rawConfirm) {
        res.status(400).json({
          success: false,
          message: 'Las contraseñas no coinciden.',
          mensaje: 'Las contraseñas no coinciden.',
        });
        return;
      }

      const errorPassword = validarPassword(rawPassword);
      if (errorPassword) {
        res.status(400).json({ success: false, message: errorPassword, mensaje: errorPassword });
        return;
      }

      // Verificar si el email ya existe
      const existingUser = await usuariosService.obtenerUsuarioPorEmail(normalizedEmail);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'El correo electrónico ya está registrado. Inicia sesión en su lugar.',
          mensaje: 'Correo electrónico ya registrado',
        });
        return;
      }

      // 2. SEGUNDA DEFENSA: Delegar en el servicio, quien decide explícitamente qué valores
      // persistir (rol: Role.USER / "paciente", activo: true controlados por el servidor)
      const newUser = await usuariosService.crearUsuario({
        name: rawName,
        nombre: rawName,
        last_name: rawLastName,
        apellido: rawLastName,
        email: normalizedEmail,
        password: rawPassword,
      });

      // 3. Generación de Token JWT
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
          rol: newUser.role.toLowerCase(), // 'user' (rol asignado por el servidor)
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
   * Inicio de sesión para USER y ADMIN (Laboratorio 8)
   */
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const datosFiltrados = matchedData(req, { locations: ['body'] }) as { email?: string; password?: string };
      const email = datosFiltrados.email ?? req.body.email;
      const password = datosFiltrados.password ?? req.body.password;

      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Por favor, proporciona el correo electrónico y la contraseña.',
          mensaje: 'Datos inválidos',
        });
        return;
      }

      // Verificar credenciales usando el servicio de usuarios
      const user = await usuariosService.verificarCredenciales(email, password);

      if (!user) {
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
          rol: user.role.toLowerCase(), // 'user' o 'admin'
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
