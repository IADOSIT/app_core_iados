import { Request, Response } from 'express';
import { query } from '../config/database';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// ── Config ───────────────────────────────────────────────────────────────────
interface BackupConfig {
  fbHost: string;       // FileBrowser base URL, e.g. https://sftp.iados.online
  fbUser: string;
  fbPass: string;
  fbPath: string;       // remote directory, e.g. /backups/core_iados
  autoBackupEnabled: boolean;
  retentionDays: number;
}

const DEFAULT_CONFIG: BackupConfig = {
  fbHost: 'https://sftp.iados.online',
  fbUser: 'admin',
  fbPass: '2oYjsKtOzI7Y_Hmo',
  fbPath: '/backups/core_iados',
  autoBackupEnabled: false,
  retentionDays: 7,
};

// ── DB helpers ───────────────────────────────────────────────────────────────
async function getBackupConfig(): Promise<BackupConfig> {
  try {
    const res = await query(`SELECT value FROM system_settings WHERE key = 'backup_config'`);
    if (res.rows.length) return { ...DEFAULT_CONFIG, ...JSON.parse(res.rows[0].value) };
  } catch {}
  return DEFAULT_CONFIG;
}

async function saveBackupConfig(cfg: Partial<BackupConfig>) {
  const current = await getBackupConfig();
  const merged = { ...current, ...cfg };
  await query(`
    INSERT INTO system_settings (key, value) VALUES ('backup_config', $1)
    ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()
  `, [JSON.stringify(merged)]);
  return merged;
}

// ── FileBrowser REST client ───────────────────────────────────────────────────
// sftp.iados.online is FileBrowser (web file manager), NOT real SSH/SFTP.
// It uses a JWT REST API: POST /api/login → token, then X-Auth header.

const FB_TIMEOUT_MS = 30_000;

async function fbLogin(cfg: BackupConfig): Promise<string> {
  const res = await fetch(`${cfg.fbHost}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: cfg.fbUser, password: cfg.fbPass }),
    signal: AbortSignal.timeout(FB_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`FileBrowser login failed: ${res.status} ${res.statusText}`);
  // FileBrowser returns JWT as plain text (not JSON)
  return res.text();
}

async function fbEnsureDir(cfg: BackupConfig, token: string): Promise<void> {
  // POST /api/resources/{path}/?override=true with empty body creates directory
  const url = `${cfg.fbHost}/api/resources${cfg.fbPath}/?override=true`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'X-Auth': token, 'Content-Type': 'application/json' },
    body: '',
    signal: AbortSignal.timeout(FB_TIMEOUT_MS),
  });
  // 200 = created, 409 = already exists — both are fine
  if (!res.ok && res.status !== 409) {
    // Non-fatal: directory may already exist with different behavior
    console.warn(`fbEnsureDir: ${res.status} ${res.statusText} — continuing`);
  }
}

async function fbUpload(cfg: BackupConfig, token: string, localPath: string): Promise<string> {
  const filename = path.basename(localPath);
  const remotePath = `${cfg.fbPath}/${filename}`;
  const url = `${cfg.fbHost}/api/resources${remotePath}?override=true`;
  const fileBuffer = fs.readFileSync(localPath);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Auth': token,
      'Content-Type': 'application/octet-stream',
    },
    body: fileBuffer,
    signal: AbortSignal.timeout(120_000), // 2 min for large files
  });
  if (!res.ok) throw new Error(`FileBrowser upload failed: ${res.status} ${res.statusText}`);
  return remotePath;
}

async function fbListAndPrune(cfg: BackupConfig, token: string): Promise<void> {
  if (cfg.retentionDays <= 0) return;
  try {
    const url = `${cfg.fbHost}/api/resources${cfg.fbPath}/`;
    const res = await fetch(url, {
      headers: { 'X-Auth': token },
      signal: AbortSignal.timeout(FB_TIMEOUT_MS),
    });
    if (!res.ok) return;
    const data = await res.json() as { items?: Array<{ name: string; type: string }> };
    const backups = (data.items || [])
      .filter((f) => f.type === 'file' && f.name.startsWith('core_iados_') && f.name.endsWith('.sql'))
      .map((f) => f.name)
      .sort();

    const toDelete = backups.slice(0, Math.max(0, backups.length - cfg.retentionDays));
    for (const name of toDelete) {
      await fetch(`${cfg.fbHost}/api/resources${cfg.fbPath}/${name}`, {
        method: 'DELETE',
        headers: { 'X-Auth': token },
        signal: AbortSignal.timeout(FB_TIMEOUT_MS),
      });
    }
  } catch (e) {
    console.warn('fbListAndPrune error (non-fatal):', e);
  }
}

async function uploadToFileBrowser(localPath: string): Promise<string> {
  const cfg = await getBackupConfig();
  const token = await fbLogin(cfg);
  await fbEnsureDir(cfg, token);
  const remotePath = await fbUpload(cfg, token, localPath);
  await fbListAndPrune(cfg, token);
  return remotePath;
}

// ── pg_dump ───────────────────────────────────────────────────────────────────
async function createBackupFile(): Promise<string> {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `core_iados_${ts}.sql`;
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const filepath = path.join(backupDir, filename);

  const pgdump = process.env.PGDUMP_PATH || 'pg_dump';
  const host = process.env.DB_HOST || 'pg.bodegadigital.com.mx';
  const port = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'core_iados';
  const dbUser = process.env.DB_USER || 'administrador';
  const dbPass = process.env.DB_PASSWORD || '';

  const env = { ...process.env, PGPASSWORD: dbPass };
  const cmd = `${pgdump} -h ${host} -p ${port} -U ${dbUser} -d ${dbName} -F p --no-owner --no-acl -f "${filepath}"`;
  await execAsync(cmd, { env });
  return filepath;
}

// ── Controllers ──────────────────────────────────────────────────────────────

export const getBackupSettings = async (_req: Request, res: Response) => {
  const cfg = await getBackupConfig();
  res.json({ success: true, data: { ...cfg, fbPass: cfg.fbPass ? '••••••••' : '' } });
};

export const updateBackupSettings = async (req: Request, res: Response) => {
  try {
    const incoming = req.body as Partial<BackupConfig>;
    if (incoming.fbPass === '••••••••') delete incoming.fbPass;
    const cfg = await saveBackupConfig(incoming);
    res.json({ success: true, message: 'Configuración guardada', data: { ...cfg, fbPass: '••••••••' } });
  } catch {
    res.status(500).json({ success: false, message: 'Error al guardar configuración' });
  }
};

export const testConnection = async (req: Request, res: Response) => {
  const body = req.body as Partial<BackupConfig>;
  const current = await getBackupConfig();
  const cfg = { ...current, ...body };
  if (!body.fbPass || body.fbPass === '••••••••') cfg.fbPass = current.fbPass;

  try {
    const token = await fbLogin(cfg);
    if (!token) throw new Error('Token vacío');
    res.json({ success: true, message: 'Conexión a FileBrowser exitosa ✓' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: `Error de conexión: ${err.message}` });
  }
};

export const runManualBackup = async (req: Request, res: Response) => {
  const { uploadToSftpFlag } = req.body as { uploadToSftpFlag?: boolean };
  try {
    const filepath = await createBackupFile();
    const size = fs.statSync(filepath).size;
    let remotePath: string | null = null;

    if (uploadToSftpFlag !== false) {
      try {
        remotePath = await uploadToFileBrowser(filepath);
      } catch (fbErr: any) {
        return res.json({
          success: true,
          message: `Backup creado localmente. Error FileBrowser: ${fbErr.message}`,
          data: { filename: path.basename(filepath), size, uploadedToSftp: false },
        });
      }
    }

    try { fs.unlinkSync(filepath); } catch {}

    res.json({
      success: true,
      message: remotePath ? 'Backup creado y enviado exitosamente' : 'Backup creado localmente',
      data: { filename: path.basename(filepath), size, uploadedToSftp: !!remotePath, remotePath },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Error al crear backup: ${err.message}` });
  }
};

export const deleteDemoData = async (req: Request, res: Response) => {
  // sections: { clients, licenses, payments, invoices, expenses, versions }
  const sections = req.body as {
    clients?: boolean; licenses?: boolean; payments?: boolean;
    invoices?: boolean; expenses?: boolean; versions?: boolean;
  };
  const all = !Object.values(sections).some(Boolean);

  try {
    const deleted: string[] = [];

    // Demo client IDs pattern
    const demoPatterns = `email LIKE '%@nexuscorp.mx' OR email LIKE '%@elroble.mx'
      OR email LIKE '%@powerfit.mx' OR email LIKE '%@mramirez.mx'
      OR email LIKE '%@demo%' OR notes LIKE '%[DEMO]%' OR notes LIKE '%[SEED]%'`;

    const demoRes = await query(`SELECT id FROM clients WHERE ${demoPatterns}`);
    const demoIds = demoRes.rows.map((r: { id: string }) => r.id);
    const hasDemo = demoIds.length > 0;

    if ((all || sections.licenses) && hasDemo) {
      await query(`DELETE FROM licenses WHERE client_id = ANY($1::uuid[])`, [demoIds]);
      // Also delete orphan demo licenses (no client match but demo-flagged)
      await query(`DELETE FROM licenses WHERE notes LIKE '%[SEED]%' OR notes LIKE '%[DEMO]%'`);
      deleted.push('licencias');
    }
    if ((all || sections.payments) && hasDemo) {
      await query(`DELETE FROM payments WHERE client_id = ANY($1::uuid[])`, [demoIds]);
      deleted.push('pagos');
    }
    if ((all || sections.invoices) && hasDemo) {
      await query(`DELETE FROM invoices WHERE client_id = ANY($1::uuid[])`, [demoIds]);
      deleted.push('facturas');
    }
    if ((all || sections.clients) && hasDemo) {
      await query(`DELETE FROM client_contacts WHERE client_id = ANY($1::uuid[])`, [demoIds]);
      await query(`DELETE FROM clients WHERE id = ANY($1::uuid[])`, [demoIds]);
      deleted.push('clientes');
    }
    if (all || sections.versions) {
      await query(`DELETE FROM software_versions WHERE release_notes LIKE '%[SEED]%'`);
      deleted.push('versiones');
    }
    if (all || sections.expenses) {
      await query(`DELETE FROM expenses WHERE notes LIKE '%[SEED]%' OR notes LIKE '%[DEMO]%'`);
      deleted.push('gastos');
    }

    const msg = deleted.length
      ? `Eliminado: ${deleted.join(', ')}`
      : 'No se encontraron datos de demostración';
    res.json({ success: true, message: msg });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Error: ${err.message}` });
  }
};

export const getSystemStats = async (_req: Request, res: Response) => {
  try {
    const [clients, licenses, payments, invoices, expenses, versions] = await Promise.all([
      query('SELECT COUNT(*) FROM clients'),
      query('SELECT COUNT(*) FROM licenses'),
      query('SELECT COUNT(*) FROM payments'),
      query('SELECT COUNT(*) FROM invoices'),
      query('SELECT COUNT(*) FROM expenses'),
      query('SELECT COUNT(*) FROM software_versions'),
    ]);
    res.json({
      success: true,
      data: {
        clients: parseInt(clients.rows[0].count),
        licenses: parseInt(licenses.rows[0].count),
        payments: parseInt(payments.rows[0].count),
        invoices: parseInt(invoices.rows[0].count),
        expenses: parseInt(expenses.rows[0].count),
        versions: parseInt(versions.rows[0].count),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
