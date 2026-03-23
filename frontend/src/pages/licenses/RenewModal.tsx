import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { licensesApi } from '../../services/api';
import type { License } from '../../types';
import { formatDate } from '../../utils/format';
import { RefreshCw } from 'lucide-react';

interface RenewModalProps {
  license: License;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RenewModal({ license, onSuccess, onCancel }: RenewModalProps) {
  const { register, handleSubmit } = useForm({
    defaultValues: { newEndDate: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: { newEndDate: string }) => licensesApi.renew(license.id, data),
    onSuccess: () => { toast.success('Licencia renovada exitosamente'); onSuccess(); },
    onError: () => toast.error('Error al renovar licencia'),
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div className="p-3 rounded-xl" style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.1)' }}>
        <p className="text-xs text-gray-400">Licencia actual</p>
        <p className="font-mono text-sm text-primary-300 mt-1">{license.licenseKey}</p>
        <p className="text-xs text-gray-500 mt-1">
          Vencimiento actual: {license.endDate ? formatDate(license.endDate) : 'N/A'}
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nueva Fecha de Vencimiento *</label>
        <input type="date" className="input" {...register('newEndDate', { required: true })} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={mutation.isPending}>
          <RefreshCw size={14} />
          {mutation.isPending ? 'Renovando...' : 'Renovar Licencia'}
        </button>
      </div>
    </form>
  );
}
