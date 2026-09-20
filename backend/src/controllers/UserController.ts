import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { isSameCalendarDay } from '../middleware/dailyLimitGuard';
import { contarDependenciasUsuario } from '../services/referentialIntegrity.service';

export class UserController {
  /**
   * Obtener estadísticas globales para el Dashboard del Administrador
   */
  public static async getAdminStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const totalUsers = await prisma.user.count();
      const premiumUsers = await prisma.user.count({ where: { is_premium: true } });
      const freeUsers = totalUsers - premiumUsers;
      const totalAnalyses = await prisma.analysis.count();

      // Análisis realizados hoy
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const analysesToday = await prisma.analysis.count({
        where: {
          created_at: {
            gte: startOfToday,
          },
        },
      });

      // Últimos usuarios registrados
      const recentUsers = await prisma.user.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          last_name: true,
          email: true,
          role: true,
          is_premium: true,
          is_active: true,
          created_at: true,
        },
      });

      res.status(200).json({
        success: true,
        stats: {
          totalUsers,
          premiumUsers,
          freeUsers,
          totalAnalyses,
          analysesToday,
          recentUsers,
        },
      });
    } catch (error: any) {
      console.error('Error al obtener estadísticas de admin:', error);
      res.status(500).json({ success: false, message: 'Error al consultar estadísticas globales.' });
    }
  }

  /**
   * Listar todos los usuarios con resumen de análisis
   */
  public static async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          last_name: true,
          email: true,
          role: true,
          is_active: true,
          is_premium: true,
          premium_since: true,
          daily_analysis_count: true,
          last_analysis_date: true,
          created_at: true,
          _count: {
            select: { analyses: true },
          },
        },
      });

      const formattedUsers = users.map((u) => ({
        id: u.id,
        name: u.name,
        last_name: u.last_name,
        fullName: `${u.name} ${u.last_name}`,
        email: u.email,
        role: u.role,
        is_active: u.is_active,
        is_premium: u.is_premium,
        premium_since: u.premium_since,
        totalAnalyses: u._count.analyses,
        dailyAnalysisCount: u.daily_analysis_count,
        lastAccess: u.last_analysis_date,
        createdAt: u.created_at,
      }));

      res.status(200).json({
        success: true,
        users: formattedUsers,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Error al consultar lista de usuarios.' });
    }
  }

  /**
   * Consultar detalle de un usuario por ID
   */
  public static async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          analyses: {
            take: 10,
            orderBy: { created_at: 'desc' },
            select: {
              id: true,
              title_or_filename: true,
              type: true,
              ai_score: true,
              similarity_score: true,
              created_at: true,
            },
          },
          payments: {
            take: 5,
            orderBy: { created_at: 'desc' },
          },
          _count: {
            select: { analyses: true },
          },
        },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          is_premium: user.is_premium,
          premium_since: user.premium_since,
          daily_analysis_count: user.daily_analysis_count,
          last_analysis_date: user.last_analysis_date,
          created_at: user.created_at,
          totalAnalyses: user._count.analyses,
          recentAnalyses: user.analyses,
          payments: user.payments,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Error al consultar usuario.' });
    }
  }

  /**
   * Crear un nuevo usuario desde el panel de administración
   * (Regla estricta: NO se permite crear múltiples administradores desde la interfaz)
   */
  public static async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, last_name, email, password, is_premium } = req.body;

      if (!name || !last_name || !email || !password) {
        res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos: nombre, apellido, email y contraseña.',
        });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();

      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        res.status(409).json({ success: false, message: 'El correo electrónico ya existe.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          last_name: last_name.trim(),
          email: normalizedEmail,
          password_hash: passwordHash,
          role: Role.USER, // Siempre USER, regla de negocio: Administrador único
          is_active: true,
          is_premium: Boolean(is_premium),
          premium_since: is_premium ? new Date() : null,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente.',
        user: {
          id: user.id,
          name: user.name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          is_premium: user.is_premium,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Error al crear usuario.' });
    }
  }

  /**
   * Editar información de un usuario
   */
  public static async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { name, last_name, email, is_active, is_premium, password } = req.body;

      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        return;
      }

      // Si se desea actualizar contraseña
      let passwordHash = undefined;
      if (password && password.trim().length >= 8) {
        passwordHash = await bcrypt.hash(password.trim(), 12);
      }

      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(last_name && { last_name: last_name.trim() }),
          ...(email && { email: email.toLowerCase().trim() }),
          ...(is_active !== undefined && { is_active: Boolean(is_active) }),
          ...(is_premium !== undefined && {
            is_premium: Boolean(is_premium),
            premium_since: is_premium ? existing.premium_since || new Date() : null,
          }),
          ...(passwordHash && { password_hash: passwordHash }),
        },
      });

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado correctamente.',
        user: {
          id: updated.id,
          name: updated.name,
          last_name: updated.last_name,
          email: updated.email,
          role: updated.role,
          is_active: updated.is_active,
          is_premium: updated.is_premium,
          premium_since: updated.premium_since,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Error al actualizar usuario.' });
    }
  }

  /**
   * Activar o desactivar cuenta de usuario
   */
  public static async toggleActive(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      // Un admin no puede desactivarse a sí mismo
      if (req.user?.id === id) {
        res.status(400).json({
          success: false,
          message: 'No puedes desactivar tu propia cuenta de administrador.',
        });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        return;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { is_active: !user.is_active },
      });

      res.status(200).json({
        success: true,
        message: `Usuario ${updated.is_active ? 'activado' : 'desactivado'} correctamente.`,
        user: {
          id: updated.id,
          is_active: updated.is_active,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Error al cambiar estado del usuario.' });
    }
  }

  /**
   * Otorgar o revocar suscripción Premium administrativamente
   */
  public static async togglePremium(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        return;
      }

      const newPremiumState = !user.is_premium;
      const updated = await prisma.user.update({
        where: { id },
        data: {
          is_premium: newPremiumState,
          premium_since: newPremiumState ? new Date() : null,
        },
      });

      res.status(200).json({
        success: true,
        message: `Estado Premium ${updated.is_premium ? 'otorgado' : 'revocado'} correctamente.`,
        user: {
          id: updated.id,
          is_premium: updated.is_premium,
          premium_since: updated.premium_since,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Error al modificar estado Premium.' });
    }
  }

  /**
   * Eliminar usuario (Previene autoeliminación del admin)
   */
  public static async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      if (req.user?.id === id) {
        res.status(400).json({
          success: false,
          message: 'No puedes eliminar tu propia cuenta de administrador.',
        });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        return;
      }

      // No permitir eliminar a otro usuario con rol ADMIN si existiera
      if (user.role === Role.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'La cuenta de administrador no puede ser eliminada.',
        });
        return;
      }

      // Integridad Referencial (Lab 5 - BLOQUE 1)
      // Equivalente lógico de ON DELETE RESTRICT: la petición es válida y el
      // recurso existe, pero choca con el estado actual del sistema -> 409.
      const dependencias = await contarDependenciasUsuario(id);

      if (dependencias.tieneDependencias) {
        res.status(409).json({
          success: false,
          message: 'No se puede eliminar el usuario porque tiene análisis o pagos asociados',
          dependencias: { analisis: dependencias.analisis, pagos: dependencias.pagos },
        });
        return;
      }

      await prisma.user.delete({ where: { id } });

      res.status(200).json({
        success: true,
        message: 'Usuario eliminado correctamente.',
      });
    } catch (error: any) {
      // Red de seguridad: si la restricción ON DELETE RESTRICT de PostgreSQL
      // rechaza el borrado, se traduce a 409 y no a un 500 genérico.
      if (error?.code === 'P2003') {
        res.status(409).json({
          success: false,
          message: 'No se puede eliminar el usuario porque tiene registros dependientes asociados',
        });
        return;
      }
      res.status(500).json({ success: false, message: 'Error al eliminar usuario.' });
    }
  }
}
