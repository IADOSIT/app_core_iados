import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Package, Tag, ExternalLink, Key, Copy, Check, RefreshCw,
  Globe, Monitor, X, Lock, Eye, EyeOff, User, StickyNote, Trash2,
  Send, LogIn,
} from 'lucide-react';
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

// ── Helpers ─────────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="ml-1 p-0.5 rounded transition-colors" style={{ color: 'var(--text-muted)' }} title="Copiar">
      {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
    </button>
  );
}

// ── Vault ────────────────────────────────────────────────────────────────────
function VaultSection({ productId, adminUser, hasAdminPassword }: { productId: string; adminUser?: string; hasAdminPassword?: boolean }) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const reveal = useMutation({
    mutationFn: () => productsApi.revealPassword(productId),
    onSuccess: (res) => { setRevealed(res.data.password || ''); setShowPwd(true); },
    onError: () => toast.error('Error al obtener contraseña'),
  });

  if (!adminUser && !hasAdminPassword) return null;

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,193,7,0.05)', border: '1px solid rgba(255,193,7,0.15)' }}>
      <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#F59E0B' }}>
        <Lock size={11} /> Credenciales Admin (Vault)
      </p>
      {adminUser && (
        <div className="flex items-center gap-2">
          <User size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{adminUser}</span>
          <CopyButton text={adminUser} />
        </div>
      )}
      {hasAdminPassword && (
        <div className="flex items-center gap-2">
          <Key size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          {revealed !== null ? (
            <>
              <code className="text-xs font-mono flex-1" style={{ color: 'var(--text-secondary)' }}>
                {showPwd ? revealed : '••••••••••••'}
              </code>
              <button onClick={() => setShowPwd(!showPwd)} className="p-0.5" style={{ color: 'var(--text-muted)' }}>
                {showPwd ? <EyeOff size={11} /> : <Eye size={11} />}
              </button>
              <CopyButton text={revealed} />
            </>
          ) : (
            <button
              onClick={() => reveal.mutate()}
              disabled={reveal.isPending}
              className="text-xs flex items-center gap-1 transition-colors hover:underline"
              style={{ color: '#F59E0B' }}
            >
              <Eye size={11} /> {reveal.isPending ? 'Verificando...' : 'Revelar contraseña'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Notes ────────────────────────────────────────────────────────────────────
function NotesSection({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const [newNote, setNewNote] = useState('');
  const [expanded, setExpanded] = useState(false);

  const { data } = useQuery({
    queryKey: ['product-notes', productId],
    queryFn: () => productsApi.getNotes(productId),
    enabled: expanded,
  });

  const notes: { id: string; note: string; created_at: string; author?: string }[] = data?.data?.data || [];

  const addNote = useMutation({
    mutationFn: () => productsApi.addNote(productId, newNote),
    onSuccess: () => { setNewNote(''); qc.invalidateQueries({ queryKey: ['product-notes', productId] }); },
    onError: () => toast.error('Error al agregar nota'),
  });

  const delNote = useMutation({
    mutationFn: (noteId: string) => productsApi.deleteNote(productId, noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-notes', productId] }),
    onError: () => toast.error('Error al eliminar nota'),
  });

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-xs flex items-center justify-between px-3 py-2 rounded-xl transition-colors"
        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        <span className="flex items-center gap-1.5"><StickyNote size={11} /> Notas del sistema</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="space-y-2 rounded-xl p-3" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
          {/* Existing notes */}
          {notes.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {notes.map((n) => (
                <div key={n.id} className="flex items-start gap-2 group">
                  <div className="flex-1 rounded-lg px-2.5 py-2" style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--border)' }}>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{n.note}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                      {n.author && `${n.author} · `}{new Date(n.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={() => delNote.mutate(n.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded flex-shrink-0"
                    style={{ color: '#FF5252' }}
                    title="Eliminar nota"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>Sin notas aún</p>
          )}

          {/* Add note */}
          <div className="flex gap-2 pt-1">
            <textarea
              className="input resize-none flex-1 text-xs"
              rows={2}
              placeholder="Agregar nota..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey && newNote.trim()) addNote.mutate(); }}
            />
            <button
              onClick={() => addNote.mutate()}
              disabled={!newNote.trim() || addNote.isPending}
              className="btn-primary px-2 py-0 self-end mb-0.5"
              title="Agregar (Ctrl+Enter)"
            >
              <Send size={13} />
            </button>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>Ctrl+Enter para enviar</p>
        </div>
      )}
    </div>
  );
}

// ── Integration ──────────────────────────────────────────────────────────────
function IntegrationCard({ product, onRegenerate }: { product: Product; onRegenerate: (id: string) => void }) {
  const [showSecret, setShowSecret] = useState(false);
  const validateUrl = `${VALIDATE_BASE}/{LICENSE_KEY}`;
  return (
    <div className="mt-3 rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
        <Key size={11} /> Integración API
      </p>
      <div>
        <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Endpoint validación:</p>
        <div className="flex items-center gap-1 rounded-lg px-2 py-1" style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--border)' }}>
          <code className="text-xs truncate flex-1" style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>GET {validateUrl}</code>
          <CopyButton text={validateUrl} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Header <code className="text-xs" style={{ color: 'var(--text-secondary)' }}>X-API-Key</code>:</p>
          <button onClick={() => onRegenerate(product.id)} className="text-xs flex items-center gap-0.5 transition-colors" style={{ color: 'var(--text-muted)' }} title="Regenerar secret">
            <RefreshCw size={9} /> Regenerar
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-lg px-2 py-1" style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--border)' }}>
          <code className="text-xs flex-1 truncate cursor-pointer" style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', letterSpacing: showSecret ? 0 : 2 }}
            onClick={() => setShowSecret(!showSecret)} title="Clic para mostrar/ocultar">
            {showSecret ? product.apiSecret : '••••••••••••••••••••••••••••••••'}
          </code>
          {product.apiSecret && <CopyButton text={product.apiSecret} />}
        </div>
      </div>
    </div>
  );
}

// ── Preview iframe ───────────────────────────────────────────────────────────
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
          <iframe src={url} className="w-full h-full border-0" title="Sistema preview" sandbox="allow-same-origin allow-scripts allow-forms allow-popups" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ zIndex: -1 }}>
            <Globe size={48} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sort, setSort] = useState('created_at');
  const [dir, setDir] = useState('asc');

  const { data, isLoading } = useQuery({
    queryKey: ['products', sort, dir],
    queryFn: () => productsApi.getAll({ sort, dir }),
  });

  const invalidateProducts = () => qc.invalidateQueries({ queryKey: ['products'] });

  const regenerate = useMutation({
    mutationFn: (id: string) => productsApi.regenerateSecret(id),
    onSuccess: () => { invalidateProducts(); toast.success('API Secret regenerado'); },
    onError: () => toast.error('Error al regenerar secret'),
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => { invalidateProducts(); toast.success('Producto desactivado'); },
    onError: () => toast.error('Error al desactivar producto'),
  });

  const handleDeleteProduct = (product: Product) => {
    if (!window.confirm(`¿Desactivar "${product.name}"? Dejará de aparecer en la lista. Esta acción se puede revertir desde la base de datos.`)) return;
    deleteProduct.mutate(product.id);
  };

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

      {/* Sort controls */}
      <div className="card p-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Ordenar por:</span>
        {[
          { value: 'created_at', label: 'Fecha de registro' },
          { value: 'name', label: 'Nombre A-Z' },
          { value: 'base_price_mxn', label: 'Precio MXN' },
          { value: 'base_price_usd', label: 'Precio USD' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              if (sort === opt.value) setDir(d => d === 'asc' ? 'desc' : 'asc');
              else { setSort(opt.value); setDir('asc'); }
            }}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            style={{
              background: sort === opt.value ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--bg-hover)',
              color: sort === opt.value ? 'var(--accent)' : 'var(--text-muted)',
              border: `1px solid ${sort === opt.value ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'var(--border)'}`,
            }}
          >
            {opt.label}
            {sort === opt.value && <span>{dir === 'asc' ? ' ↑' : ' ↓'}</span>}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner /> : products.length === 0 ? (
        <div className="card">
          <EmptyState icon={Package} title="Sin productos" description="Agrega tu primer sistema o producto"
            action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={15} />Nuevo Sistema</button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="card p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}>
                    <Package size={18} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base leading-tight" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{product.description || 'Sin descripción'}</p>
                    {product.systemUrl && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <a href={product.systemUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 hover:underline" style={{ color: 'var(--accent)' }}>
                          <Globe size={10} /> {product.apiSlug || product.systemUrl} <ExternalLink size={9} />
                        </a>
                        <button onClick={() => setPreviewUrl(product.systemUrl!)}
                          className="text-xs flex items-center gap-0.5 px-1.5 py-0.5 rounded-md transition-colors"
                          style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}>
                          <Monitor size={9} /> Preview
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setEditProduct(product)} className="btn-ghost py-1 px-2 text-xs">Editar</button>
                  <button
                    onClick={() => handleDeleteProduct(product)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}
                    title="Desactivar producto"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Botón Acceder */}
              {((product as any).accessUrl || product.systemUrl) && (
                <a
                  href={(product as any).accessUrl || product.systemUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full justify-center no-underline"
                  style={{ display: 'flex', textDecoration: 'none' }}
                >
                  <LogIn size={14} /> Acceder al Sistema
                </a>
              )}

              {/* Vault */}
              <VaultSection
                productId={product.id}
                adminUser={(product as any).adminUser}
                hasAdminPassword={(product as any).hasAdminPassword}
              />

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

              {/* Notes */}
              <NotesSection productId={product.id} />

              {/* Toggle integración */}
              <button
                onClick={() => setExpandedIntegration(expandedIntegration === product.id ? null : product.id)}
                className="w-full text-xs flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors"
                style={{ color: expandedIntegration === product.id ? 'var(--accent)' : 'var(--text-muted)', background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
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
            onSuccess={() => { setShowForm(false); setEditProduct(null); invalidateProducts(); }}
            onCancel={() => { setShowForm(false); setEditProduct(null); }}
          />
        </Modal>
      )}

      {previewUrl && <SystemPreview url={previewUrl} onClose={() => setPreviewUrl(null)} />}
    </div>
  );
}
