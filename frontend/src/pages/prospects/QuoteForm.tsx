import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload, FileText, Image, X, Eye } from 'lucide-react';
import { prospectsApi, BACKEND_URL } from '../../services/api';

interface Quote {
  id: string;
  quoteNumber?: string;
  productsDescription?: string;
  implementationFee: number;
  licenseFee: number;
  monthlyFee: number;
  currency: string;
  validityDate?: string;
  status: string;
  notes?: string;
  fileUrl?: string | null;
}

interface Props {
  prospectId: string;
  quote?: Quote;
  onSuccess: () => void;
  onCancel: () => void;
}

function getFileUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BACKEND_URL}${path}`;
}

function isImage(url: string) {
  return /\.(jpe?g|png|webp|gif)$/i.test(url);
}
function isPdf(url: string) {
  return /\.pdf$/i.test(url);
}

export default function QuoteForm({ prospectId, quote, onSuccess, onCancel }: Props) {
  const isEdit = !!quote;
  const lbl = { color: 'var(--text-muted)' };

  const existingFileUrl = (quote as any)?.file_url || quote?.fileUrl || null;
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(existingFileUrl);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      quoteNumber: (quote as any)?.quote_number || quote?.quoteNumber || '',
      productsDescription: (quote as any)?.products_description || quote?.productsDescription || '',
      implementationFee: quote?.implementationFee ?? 0,
      licenseFee: quote?.licenseFee ?? 0,
      monthlyFee: quote?.monthlyFee ?? 0,
      currency: quote?.currency || 'MXN',
      validityDate: (quote?.validityDate || '').slice(0, 10),
      status: quote?.status || 'borrador',
      notes: quote?.notes || '',
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await prospectsApi.uploadQuoteFile(file);
      const url: string = res.data?.url;
      setUploadedUrl(url);
      setShowPreview(false);
      toast.success('Archivo subido');
    } catch {
      toast.error('Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

  const mutation = useMutation({
    mutationFn: (raw: Record<string, unknown>) => {
      const data = {
        quoteNumber: raw.quoteNumber || null,
        productsDescription: raw.productsDescription || null,
        implementationFee: Number(raw.implementationFee) || 0,
        licenseFee: Number(raw.licenseFee) || 0,
        monthlyFee: Number(raw.monthlyFee) || 0,
        currency: raw.currency,
        validityDate: raw.validityDate || null,
        status: raw.status,
        notes: raw.notes || null,
        fileUrl: uploadedUrl || null,
      };
      return isEdit
        ? prospectsApi.updateQuote(prospectId, quote!.id, data)
        : prospectsApi.addQuote(prospectId, data);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Cotización actualizada' : 'Cotización agregada');
      onSuccess();
    },
    onError: () => toast.error('Error al guardar cotización'),
  });

  const fullUrl = getFileUrl(uploadedUrl);

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d as Record<string, unknown>))} className="space-y-4">

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={lbl}>No. Cotización</label>
          <input className="input" placeholder="COT-2024-001" {...register('quoteNumber')} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={lbl}>Vigencia hasta</label>
          <input type="date" className="input" {...register('validityDate')} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold mb-1.5" style={lbl}>Descripción de productos / servicios</label>
          <textarea className="input resize-none" rows={3}
            placeholder="Ej: Sistema de inventario + módulo de ventas, implementación y soporte..."
            {...register('productsDescription')} />
        </div>
      </div>

      {/* Importes */}
      <div className="rounded-xl p-3 space-y-3" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Importes de la cotización</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={lbl}>Implementación / Setup</label>
            <input type="number" min="0" step="100" className="input" placeholder="0"
              {...register('implementationFee')} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Costo único de arranque</p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={lbl}>Licencia única (one-time)</label>
            <input type="number" min="0" step="100" className="input" placeholder="0"
              {...register('licenseFee')} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Pago único por licencia perpetua</p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={lbl}>Mensualidad</label>
            <input type="number" min="0" step="100" className="input" placeholder="0"
              {...register('monthlyFee')} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Cobro recurrente mensual</p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={lbl}>Moneda</label>
            <select className="select" {...register('currency')}>
              <option value="MXN">MXN — Pesos mexicanos</option>
              <option value="USD">USD — Dólares</option>
            </select>
          </div>
        </div>
      </div>

      {/* Archivo de cotización */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={lbl}>Archivo de cotización (PDF o imagen)</label>
        {uploadedUrl ? (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {/* barra de archivo */}
            <div className="flex items-center justify-between px-3 py-2" style={{ background: 'var(--bg-hover)' }}>
              <div className="flex items-center gap-2 min-w-0">
                {fullUrl && isPdf(fullUrl)
                  ? <FileText size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  : <Image size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                }
                <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                  {uploadedUrl.split('/').pop()}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button type="button" onClick={() => setShowPreview(v => !v)}
                  className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                  title={showPreview ? 'Ocultar vista previa' : 'Ver archivo'}
                  style={{ color: 'var(--accent)' }}>
                  <Eye size={14} />
                </button>
                <label className="p-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-70"
                  title="Reemplazar archivo" style={{ color: 'var(--text-muted)' }}>
                  <Upload size={14} />
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange} disabled={uploading} />
                </label>
                <button type="button" onClick={() => { setUploadedUrl(null); setShowPreview(false); }}
                  className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                  title="Quitar archivo" style={{ color: '#EF4444' }}>
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Vista previa inline */}
            {showPreview && fullUrl && (
              <div style={{ background: '#000', maxHeight: 480, overflow: 'hidden' }}>
                {isPdf(fullUrl) ? (
                  <iframe
                    src={fullUrl}
                    title="Vista previa cotización"
                    className="w-full"
                    style={{ height: 480, border: 'none', display: 'block' }}
                  />
                ) : (
                  <img
                    src={fullUrl}
                    alt="Vista previa cotización"
                    className="w-full object-contain"
                    style={{ maxHeight: 480, display: 'block' }}
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center gap-2 py-6 rounded-xl cursor-pointer transition-all ${uploading ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-80'}`}
            style={{ border: '2px dashed var(--border)', background: 'var(--bg-hover)' }}>
            <Upload size={20} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {uploading ? 'Subiendo archivo...' : 'Haz clic para subir PDF o imagen de la cotización'}
            </span>
            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange} disabled={uploading} />
          </label>
        )}
      </div>

      {/* Estado y notas */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={lbl}>Estado</label>
          <select className="select" {...register('status')}>
            <option value="borrador">Borrador</option>
            <option value="enviada">Enviada al cliente</option>
            <option value="vista">Vista por el cliente</option>
            <option value="aceptada">Aceptada ✓</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={lbl}>Notas / Condiciones</label>
          <input className="input" placeholder="Descuentos, tiempo de entrega..."
            {...register('notes')} />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={mutation.isPending || uploading}>
          {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar Cotización' : 'Guardar Cotización'}
        </button>
      </div>
    </form>
  );
}
