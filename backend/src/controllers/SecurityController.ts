import { Request, Response } from 'express';

export class SecurityController {
  /**
   * Devuelve qué aplicación cliente hizo la petición (Lab 6).
   *
   * No vuelve a validar la API Key: se limita a leer req.apiClient, que el
   * middleware dejó en la petición al autenticar al cliente.
   */
  public static getClient(req: Request, res: Response): void {
    if (!req.apiClient) {
      res.status(401).json({ success: false, message: 'API Key requerida' });
      return;
    }
    res.status(200).json({
      success: true,
      message: 'Cliente autenticado',
      client: req.apiClient,
    });
  }
}
