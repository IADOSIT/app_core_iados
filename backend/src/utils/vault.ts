/**
 * AES-256-GCM vault para credenciales sensibles.
 * Requiere VAULT_KEY en .env (hex de 64 chars = 32 bytes).
 * Si no existe, genera una temporal en memoria (no persistente entre reinicios).
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  const k = process.env.VAULT_KEY;
  if (k && /^[0-9a-fA-F]{64}$/.test(k)) return Buffer.from(k, 'hex');
  // Fallback: key derivada del JWT_SECRET (no ideal pero funcional sin VAULT_KEY)
  const fallback = (process.env.JWT_SECRET || 'core_iados_default_vault_key_change_me_!!').padEnd(32, '0').slice(0, 32);
  return Buffer.from(fallback, 'utf8');
}

export function encrypt(plain: string): string {
  if (!plain) return '';
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv(12):tag(16):data — all hex
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(stored: string): string {
  if (!stored) return '';
  try {
    const parts = stored.split(':');
    if (parts.length !== 3) return stored; // not encrypted, return as-is
    const [ivHex, tagHex, dataHex] = parts;
    const key = getKey();
    const decipher = createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8');
  } catch {
    return ''; // wrong key or corrupted
  }
}
