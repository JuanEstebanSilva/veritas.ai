import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Módulo Criptográfico de Ciberseguridad (CryptoVault)
 * 
 * Implementa cifrado simétrico autenticado AES-256-GCM para proteger
 * API Keys, credenciales y secretos contra accesos no autorizados e inspección de código.
 * 
 * Formato del secreto cifrado:
 * enc:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
export class CryptoVault {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12; // 96 bits recomendado para GCM
  private static readonly SALT = 'veritas_ai_vault_salt_2026_secure';
  /** Longitud completa del tag de autenticacion GCM (128 bits). Se fija de forma
   *  explicita para impedir que se acepte un tag mas corto de lo esperado. */
  private static readonly AUTH_TAG_LENGTH = 16;

  /**
   * Deriva la clave de 256 bits mediante scrypt a partir del secreto maestro
   */
  private static getMasterKey(): Buffer {
    const secret =
      process.env.SECRET_ENCRYPTION_KEY ||
      process.env.JWT_SECRET ||
      'veritas_ai_fallback_master_secret_key_8899';
    return crypto.scryptSync(secret, this.SALT, 32);
  }

  /**
   * Cifra un secreto en texto plano a formato seguro AES-256-GCM
   */
  public static encrypt(plainText: string): string {
    if (!plainText || typeof plainText !== 'string') return plainText;
    if (plainText.startsWith('enc:')) return plainText; // Ya se encuentra cifrado

    const key = this.getMasterKey();
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv, { authTagLength: this.AUTH_TAG_LENGTH });

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `enc:${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Descifra un secreto protegido en formato enc:...
   * Si el texto no está cifrado, lo retorna intacto (retrocompatibilidad transparente).
   */
  public static decrypt(cipherText: string): string {
    if (!cipherText || typeof cipherText !== 'string') return cipherText;
    if (!cipherText.startsWith('enc:')) return cipherText; // Texto plano tradicional

    const parts = cipherText.split(':');
    if (parts.length !== 4) return cipherText;

    const [, ivHex, authTagHex, encryptedHex] = parts;

    try {
      const key = this.getMasterKey();
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Se rechaza cualquier tag truncado antes de intentar descifrar: aceptar un
      // tag mas corto permitiria falsificar textos cifrados (hallazgo de Semgrep).
      if (authTag.length !== this.AUTH_TAG_LENGTH) {
        console.error('[CryptoVault] Tag de autenticacion GCM con longitud invalida.');
        return cipherText;
      }

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv, {
        authTagLength: this.AUTH_TAG_LENGTH,
      });

      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err: any) {
      console.error('[CryptoVault] Error de integridad o clave inválida al descifrar secreto.');
      return cipherText;
    }
  }

  /**
   * Enmascara una clave para visualización segura en interfaces o registros
   * Ejemplo: "9b4b...2766"
   */
  public static mask(key: string): string {
    if (!key) return '[NO DEFINIDA]';
    if (key.length <= 8) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }
}
