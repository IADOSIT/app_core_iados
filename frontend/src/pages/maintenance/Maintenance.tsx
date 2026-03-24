import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Database, Trash2, Upload, Settings, Wifi, WifiOff,
  CheckCircle, AlertTriangle, Clock, Shield, RefreshCw,
  HardDrive, Users, Key, CreditCard, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface BackupConfig {
  fbHost: string;
  fbUser: string;
  fbPass: string;
  fbPath: string;
  autoBackupEnabled: boolean;
  retentionDays: number;
}

interface SystemStats {
  clients: number;
  licenses: number;
  payments: number;
  invoices: number;
  expenses: number;
  versions: number;
}

export default function MaintenancePage() {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [backupLog, setBackupLog] = useState<string[]>([]);
  const [demoSections, setDemoSections] = useState({
    clients: true, licenses: true, payments: true,
    invoices: true, expenses: true, versions: false,
  });

  const isAdmin = currentUser?.roleName === 'admin';

  const { data: statsData } = useQuery({
    queryKey: ['maintenance-stats'],
    queryFn: () => api.get('/maintenance/stats'),
  });

  const { data: configData, refetch: refetchConfig } = useQuery({
    queryKey: ['backup-config'],
    queryFn: () => api.get('/maintenance/backup-config'),
  });

  const stats: SystemStats = statsData?.data?.data || {};
  const backupConfig: BackupConfig = configData?.data?.data || {
    fbHost: 'https://sftp.iados.online',
    fbUser: 'admin',
    fbPass: '',
    fbPath: '/backups/core_iados',
    autoBackupEnabled: false,
    retentionDays: 7,
  };

  const { register, handleSubmit, watch } = useForm<BackupConfig>({ values: backupConfig });

  const saveConfig = useMutation({
    mutationFn: (data: BackupConfig) => api.put('/maintenance/backup-config', data),
    onSuccess: () => { toast.success('Configuración guardada'); refetchConfig(); },
    onError: () => toast.error('Error al guardar configuración'),
  });

  const testConn = useMutation({
    mutationFn: (data: BackupConfig) => api.post('/maintenance/backup-config/test', data),
    onSuccess: () => toast.success('Conexión FileBrowser exitosa ✓'),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error de conexión'),
  });

  const runBackup = useMutation({
    mutationFn: () => api.post('/maintenance/backup', { uploadToSftpFlag: true }),
    onMutate: () => {
      setBackupLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Iniciando backup...`]);
    },
    onSuccess: (res) => {
      const d = res.data.data;
      setBackupLog(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ✓ ${res.data.message}`,
        `[${new Date().toLocaleTimeString()}] Archivo: ${d.filename} (${(d.size / 1024).toFixed(1)} KB)`,
        d.uploadedToSftp
          ? `[${new Date().toLocaleTimeString()}] ✓ Enviado a FileBrowser: ${d.remotePath}`
          : `[${new Date().toLocaleTimeString()}] ⚠ Solo guardado localmente`,
      ]);
      toast.success('Backup completado');
    },
    onError: (e: any) => {
      setBackupLog(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ✗ Error: ${e?.response?.data?.message || 'Error desconocido'}`,
      ]);
      toast.error(e?.response?.data?.message || 'Error al crear backup');
    },
  });

  const deleteDemo = useMutation({
    mutationFn: () => api.delete('/maintenance/demo-data', { data: demoSections }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Datos eliminados');
      setConfirmDelete(false);
      qc.invalidateQueries({ queryKey: ['maintenance-stats'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error al eliminar datos'),
  });

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Shield size={48} style={{ color: 'var(--text-muted)' }} />
        <p style={{ color: 'var(--text-muted)' }}>Solo administradores pueden acceder a esta sección</p>
      </div>
    );
  }

  const statItems = [
    { label: 'Clientes', value: stats.clients, icon: Users, color: '#2196F3' },
    { label: 'Licencias', value: stats.licenses, icon: Key, color: 'var(--accent)' },
    { label: 'Pagos', value: stats.payments, icon: CreditCard, color: '#FF9800' },
    { label: 'Facturas', value: stats.invoices, icon: FileText, color: '#9C27B0' },
    { label: 'Gastos', value: stats.expenses, icon: HardDrive, color: '#FF5252' },
    { label: 'Versiones', value: stats.versions, icon: RefreshCw, color: '#00BCD4' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mantenimiento del Sistema</h1>
          <p className="page-subtitle">Gestión de datos, backups y configuración avanzada</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {statItems.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 text-center">
            <Icon size={20} className="mx-auto mb-2" style={{ color }} />
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup manual */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,150,136,0.15)' }}>
              <Database size={18} style={{ color: '#009688' }} />
            </div>
            <div>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Backup de Base de Datos</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>pg_dump completo → FileBrowser (sftp.iados.online)</p>
            </div>
          </div>

          <button
            onClick={() => runBackup.mutate()}
            disabled={runBackup.isPending}
            className="btn-primary w-full justify-center"
          >
            <Upload size={16} />
            {runBackup.isPending ? 'Creando backup...' : 'Crear Backup Ahora'}
          </button>

          {backupLog.length > 0 && (
            <div
              className="rounded-xl p-3 font-mono text-xs space-y-1 max-h-40 overflow-y-auto"
              style={{ background: 'var(--bg-surface2)', border: '1px solid var(--border)' }}
            >
              {backupLog.map((line, i) => (
                <div
                  key={i}
                  style={{
                    color: line.includes('✓') ? 'var(--accent)'
                      : line.includes('✗') ? '#FF5252'
                      : 'var(--text-muted)',
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Limpiar datos demo */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,82,82,0.12)' }}>
              <Trash2 size={18} style={{ color: '#FF5252' }} />
            </div>
            <div>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Limpiar Datos de Demostración</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Elimina TODOS los registros de las secciones seleccionadas</p>
            </div>
          </div>

          {/* Section selector */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Seleccionar secciones a limpiar:</p>
            {([
              { key: 'clients', label: `Todos los clientes (${stats.clients ?? 0})` },
              { key: 'licenses', label: `Todas las licencias (${stats.licenses ?? 0})` },
              { key: 'payments', label: `Todos los pagos (${stats.payments ?? 0})` },
              { key: 'invoices', label: `Todas las facturas (${stats.invoices ?? 0})` },
              { key: 'expenses', label: `Todos los gastos (${stats.expenses ?? 0})` },
              { key: 'versions', label: `Todas las versiones (${stats.versions ?? 0})` },
            ] as const).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-primary-300"
                  checked={demoSections[key]}
                  onChange={(e) => setDemoSections(prev => ({ ...prev, [key]: e.target.checked }))}
                />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </label>
            ))}
          </div>

          <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.2)' }}>
            <AlertTriangle size={14} style={{ color: '#FFC107', flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs" style={{ color: '#E6A800' }}>
              ⚠ Acción irreversible. Se eliminarán <strong>TODOS</strong> los registros de las secciones marcadas, no solo los de demo.
            </p>
          </div>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={!Object.values(demoSections).some(Boolean)}
              className="btn-danger w-full justify-center"
            >
              <Trash2 size={16} />
              Eliminar Seleccionados
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-center" style={{ color: '#FF5252' }}>¿Confirmar eliminación?</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
                <button onClick={() => deleteDemo.mutate()} disabled={deleteDemo.isPending} className="btn-danger flex-1 justify-center">
                  {deleteDemo.isPending ? 'Eliminando...' : 'Sí, Eliminar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuración FileBrowser */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(33,150,243,0.12)' }}>
            <Settings size={18} style={{ color: '#2196F3' }} />
          </div>
          <div>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Configuración FileBrowser / Backup Automático</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Servidor de destino — usa FileBrowser REST API (no SSH/SFTP clásico)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit((d) => saveConfig.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>URL FileBrowser</label>
              <input className="input" placeholder="https://sftp.iados.online" {...register('fbHost')} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Ruta remota</label>
              <input className="input font-mono" placeholder="/backups/core_iados" {...register('fbPath')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Usuario</label>
              <input className="input" placeholder="admin" {...register('fbUser')} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Contraseña</label>
              <input type="password" className="input" placeholder="••••••••" {...register('fbPass')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Retención (días)</label>
              <input type="number" min="1" max="30" className="input" {...register('retentionDays', { valueAsNumber: true })} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-primary-300" {...register('autoBackupEnabled')} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Backup automático diario</span>
              </label>
            </div>
          </div>

          {watch('autoBackupEnabled') && (
            <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)' }}>
              <Clock size={14} style={{ color: 'var(--accent)' }} />
              <p className="text-xs" style={{ color: 'var(--accent)' }}>
                Backup automático diario a las 03:00 AM. Se conservarán los últimos {watch('retentionDays')} respaldos.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSubmit((d) => testConn.mutate(d))}
              disabled={testConn.isPending}
              className="btn-ghost flex items-center gap-2"
            >
              {testConn.isPending ? <WifiOff size={14} /> : <Wifi size={14} />}
              {testConn.isPending ? 'Probando...' : 'Probar Conexión'}
            </button>
            <button type="submit" disabled={saveConfig.isPending} className="btn-primary flex-1 justify-center">
              <CheckCircle size={14} />
              {saveConfig.isPending ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
