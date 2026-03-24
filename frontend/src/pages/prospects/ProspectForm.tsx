import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { prospectsApi } from '../../services/api';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Prospect {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  source: string;
  status: string;
  notes?: string;
}

interface Props {
  prospect?: Prospect | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProspectForm({ prospect, onSuccess, onCancel }: Props) {
  const isEdit = !!prospect;
  const [showQuote, setShowQuote] = useState(false);
  const lbl = { color: 'var(--text-muted)' };

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: prospect?.name || '',
      contactName: (prospect as any)?.contact_name || prospect?.contactName || '',
      email: prospect?.email || '',
      phone: prospect?.phone || '',
      source: prospect?.source || 'directo',
      status: prospect?.status || 'nuevo',
      notes: prospect?.notes || '',
      // Cotización inicial (solo en create)
      quoteNumber: '',
      productsDescription: '',
      implementationFee: '',
      licenseFee: '',
      monthlyFee: '',
      currency: 'MXN',
      validityDate: '',
      quoteStatus: 'borrador',
      quoteNotes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (raw: Record<string, unknown>) => {
      const data: Record<string, unknown> = {
        name: raw.name,
        contactName: raw.contactName || null,
        email: raw.email || null,
        phone: raw.phone || null,
        source: raw.source,
        status: raw.status,
        notes: raw.notes || null,
      };
      if (!isEdit && showQuote) {
        data.quote = {
          quoteNumber: raw.quoteNumber || null,
          productsDescription: raw.productsDescription || null,
          implementationFee: Number(raw.implementationFee) || 0,
          licenseFee: Number(raw.licenseFee) || 0,
          monthlyFee: Number(raw.monthlyFee) || 0,
          currency: raw.currency,
          validityDate: raw.validityDate || null,
          status: raw.quoteStatus,
          notes: raw.quoteNotes || null,
        };
      }
      return isEdit
        ? prospectsApi.update(prospect!.id, data)
        : prospectsApi.create(data);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Prospecto actualizado' : 'Prospecto creado');
      onSuccess();
    },
    onError: () => toast.error('Error al guardar'),
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d as Record<string, unknown>))} className="space-y-4">

      {/* Datos principales */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold mb-1.5" style={lbl}>Nombre / Empresa *</label>
          <input className={`input ${errors.name ? 'border-red-500/50' : ''}`}
            placeholder="Empresa XYZ o Juan García" {...register('name', { required: true })} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={lbl}>Contacto</label>
          <input className="input" placeholder="Nombre del contacto" {...register('contactName')} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={lbl}>Email</label>
          <input type="email" className="input" placeholder="correo@empresa.com" {...register('email')} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={lbl}>Teléfono</label>
          <input className="input" placeholder="+52 55 1234 5678" {...register('phone')} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={lbl}>Fuente</label>
          <select className="select" {...register('source')}>
            <option value="directo">Directo</option>
            <option value="referido">Referido</option>
            <option value="web">Web</option>
            <option value="llamada">Llamada</option>
            <option value="evento">Evento</option>
            <option value="redes">Redes sociales</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold mb-1.5" style={lbl}>Estado</label>
          <select className="select" {...register('status')}>
            <option value="nuevo">Nuevo</option>
            <option value="contactado">Contactado</option>
            <option value="cotizado">Cotizado</option>
            <option value="negociacion">Negociación</option>
            <option value="ganado">Ganado</option>
            <option value="perdido">Perdido</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold mb-1.5" style={lbl}>Notas</label>
          <textarea className="input resize-none" rows={2} placeholder="Necesidades, comentarios..." {...register('notes')} />
        </div>
      </div>

      {/* Cotización inicial (solo al crear) */}
      {!isEdit && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}>
          <button type="button" onClick={() => setShowQuote(!showQuote)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
            style={{ background: 'color-mix(in srgb, var(--accent) 6%, transparent)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
              + Agregar cotización inicial (opcional)
            </span>
            {showQuote ? <ChevronUp size={14} style={{ color: 'var(--accent)' }} /> : <ChevronDown size={14} style={{ color: 'var(--accent)' }} />}
          </button>

          {showQuote && (
            <div className="p-4 space-y-3">
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
                  <label className="block text-xs font-semibold mb-1.5" style={lbl}>Descripción de productos/servicios</label>
                  <textarea className="input resize-none" rows={2}
                    placeholder="Ej: Sistema de inventario + módulo de ventas..."
                    {...register('productsDescription')} />
                </div>
              </div>

              <div className="rounded-xl p-3 space-y-3" style={{ background: 'var(--bg-hover)' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Importes</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={lbl}>Implementación / Setup</label>
                    <input type="number" min="0" step="100" className="input" placeholder="0"
                      {...register('implementationFee')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={lbl}>Licencia única (one-time)</label>
                    <input type="number" min="0" step="100" className="input" placeholder="0"
                      {...register('licenseFee')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={lbl}>Mensualidad</label>
                    <input type="number" min="0" step="100" className="input" placeholder="0"
                      {...register('monthlyFee')} />
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={lbl}>Estado cotización</label>
                  <select className="select" {...register('quoteStatus')}>
                    <option value="borrador">Borrador</option>
                    <option value="enviada">Enviada</option>
                    <option value="vista">Vista por el cliente</option>
                    <option value="aceptada">Aceptada</option>
                    <option value="rechazada">Rechazada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={lbl}>Notas cotización</label>
                  <input className="input" placeholder="Descuentos, condiciones..." {...register('quoteNotes')} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Prospecto'}
        </button>
      </div>
    </form>
  );
}
