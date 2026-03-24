import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, Tag, ExternalLink, Key, Copy, Check, RefreshCw, Globe, Monitor, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi } from '../../services/api';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import ProductForm from './ProductForm';
import { formatCurrency } from '../../utils/format';
import type { Product } from '../../types';

const planTypeLabel: Record<string, string> = {
  permanente: 'Permanente', mensual: 'Mensual', por_implementacion: 'Implementación',
};
const planTypeBadge: Record<string, string> = {
  permanente: 'badge-green', mensual: 'badge-blue', por_implementacion: 'badge-yellow',
};

const VALIDATE_BASE = `${window.location.protocol}//${window.location.hostname}:4000/api/v1/public/licenses/validate`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="ml-1 p-0.5 rounded transition-colors" style={{ color: 'var(--text-muted)' }} title="Copiar">
      {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
    </button>
  );
}

function IntegrationCard({ product, onRegenerate }: { product: Product; onRegenerate: (id: string) => void }) {
  const [showSecret, setShowSecret] = useState(false);
  const validateUrl = `${VALIDATE_BASE}/{LICENSE_KEY}`;

  return (
    <div className="mt-3 rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
        <Key size={11} /> Integración API
      </p>

      {product.systemUrl && (
        <div className="flex items-center gap-1">
          <Globe size={10} style={{ color: 'var(--text-muted)' }} />
          <a href={product.systemUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs truncate hover:underline" style={{ color: 'var(--accent)' }}>
            {product.systemUrl}
          </a>
          <ExternalLink size={9} style={{ color: 'var(--text-muted)' }} />
        </div>
      )}

      {/* Endpoint de validación */}
      <div>
        <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Endpoint validación:</p>
        <div className="flex items-center gap-1 rounded-lg px-2 py-1" style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--border)' }}>
          <code className="text-xs truncate flex-1" style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>
            GET {validateUrl}
          </code>
          <CopyButton text={validateUrl} />
        </div>
      </div>

      {/* Header X-API-Key */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Header <code className="text-xs" style={{ color: 'var(--text-secondary)' }}>X-API-Key</code>:
          </p>
          <button
            onClick={() => onRegenerate(product.id)}
            className="text-xs flex items-center gap-0.5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Regenerar secret"
          >
            <RefreshCw size={9} /> Regenerar
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-lg px-2 py-1" style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--border)' }}>
          <code
            className="text-xs flex-1 truncate cursor-pointer"
            style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', letterSpacing: showSecret ? 0 : 2 }}
            onClick={() => setShowSecret(!showSecret)}
            title="Clic para mostrar/ocultar"
          >
            {showSecret ? product.apiSecret : '••••••••••••••••••••••••••••••••'}
          </code>
          {product.apiSecret && <CopyButton text={product.apiSecret} />}
        </div>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
          Clic en el campo para revelar
        </p>
      </div>

      {/* Heartbeat */}
      <div>
        <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Heartbeat (actualiza usuarios activos):</p>
        <div className="flex items-center gap-1 rounded-lg px-2 py-1" style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--border)' }}>
          <code className="text-xs truncate flex-1" style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            POST /api/v1/public/licenses/heartbeat
          </code>
          <CopyButton text="POST /api/v1/public/licenses/heartbeat" />
        </div>
      </div>
    </div>
  );
}

function SystemPreview({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-5xl h-[80vh] flex flex-col rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--border-surface)' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-divider)' }}>
          <div className="flex items-center gap-2">
            <Monitor size={14} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-medium truncate max-w-lg" style={{ color: 'var(--text-primary)' }}>{url}</span>
          </div>
          <div className="flex items-center gap-2">
            <a href={url} target="_blank" rel="noopener noreferrer" className="btn-ghost py-1 px-2 text-xs">
              <ExternalLink size={12} /> Abrir en nueva pestaña
            </a>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="flex-1 relative">
          <iframe
            src={url}
            className="w-full h-full border-0"
            title="Sistema preview"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ zIndex: -1 }}>
            <Globe size={48} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>Cargando sistema...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  });

  const regenerate = useMutation({
    mutationFn: (id: string) => productsApi.regenerateSecret(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('API Secret regenerado');
    },
    onError: () => toast.error('Error al regenerar secret'),
  });

  const products: Product[] = data?.data?.data || [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Productos / Sistemas</h1>
          <p className="page-subtitle">{products.length} sistemas registrados</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Nuevo Sistema
        </button>
      </div>

      {isLoading ? <LoadingSpinner /> : products.length === 0 ? (
        <div className="card">
          <EmptyState icon={Package} title="Sin productos" description="Agrega tu primer sistema o producto"
            action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={15} />Nuevo Sistema</button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="card p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}
                  >
                    <Package size={18} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{product.description || 'Sin descripción'}</p>
                    {product.systemUrl && (
                      <div className="flex items-center gap-2 mt-1">
                        <a href={product.systemUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 hover:underline"
                          style={{ color: 'var(--accent)' }}>
                          <Globe size={10} /> {product.apiSlug || product.systemUrl}
                          <ExternalLink size={9} />
                        </a>
                        <button
                          onClick={() => setPreviewUrl(product.systemUrl!)}
                          className="text-xs flex items-center gap-0.5 px-1.5 py-0.5 rounded-md transition-colors"
                          style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}
                          title="Vista previa del sistema"
                        >
                          <Monitor size={9} /> Preview
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setEditProduct(product)} className="btn-ghost py-1 px-2 text-xs flex-shrink-0">Editar</button>
              </div>

              {/* Precios */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg p-2" style={{ background: 'var(--bg-hover)' }}>
                  <p style={{ color: 'var(--text-muted)' }}>Precio base MXN</p>
                  <p className="font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{formatCurrency(product.basePriceMxn)}</p>
                </div>
                <div className="rounded-lg p-2" style={{ background: 'var(--bg-hover)' }}>
                  <p style={{ color: 'var(--text-muted)' }}>Precio base USD</p>
                  <p className="font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{formatCurrency(product.basePriceUsd, 'USD')}</p>
                </div>
              </div>

              {/* Planes */}
              {product.plans && product.plans.length > 0 && (
                <div>
                  <p className="text-xs mb-2 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Tag size={11} /> {product.plans.length} plan{product.plans.length !== 1 ? 'es' : ''}
                  </p>
                  <div className="space-y-1.5">
                    {product.plans.map((plan) => (
                      <div key={plan.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`badge ${planTypeBadge[plan.type] || 'badge-gray'} flex-shrink-0`}>{planTypeLabel[plan.type]}</span>
                          <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{plan.name}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{formatCurrency(plan.priceMxn)}</span>
                          {plan.maxUsers && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{plan.maxUsers} usr</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Toggle integración */}
              <button
                onClick={() => setExpandedIntegration(expandedIntegration === product.id ? null : product.id)}
                className="w-full text-xs flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors"
                style={{
                  color: expandedIntegration === product.id ? 'var(--accent)' : 'var(--text-muted)',
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border)',
                }}
              >
                <Key size={11} />
                {expandedIntegration === product.id ? 'Ocultar integración API' : 'Ver integración API'}
              </button>

              {expandedIntegration === product.id && (
                <IntegrationCard product={product} onRegenerate={(id) => regenerate.mutate(id)} />
              )}
            </div>
          ))}
        </div>
      )}

      {(showForm || editProduct) && (
        <Modal title={editProduct ? 'Editar Sistema' : 'Nuevo Sistema'} onClose={() => { setShowForm(false); setEditProduct(null); }} size="lg">
          <ProductForm
            product={editProduct || undefined}
            onSuccess={() => { setShowForm(false); setEditProduct(null); qc.invalidateQueries({ queryKey: ['products'] }); }}
            onCancel={() => { setShowForm(false); setEditProduct(null); }}
          />
        </Modal>
      )}

      {previewUrl && <SystemPreview url={previewUrl} onClose={() => setPreviewUrl(null)} />}
    </div>
  );
}
