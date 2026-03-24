import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, UserPlus, Mail, Phone, Calendar, FileText,
  Pencil, Trash2, ChevronDown, ChevronUp, AlertCircle,
  TrendingUp, DollarSign, Clock, Tag,
} from 'lucide-react';
import { prospectsApi } from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import ProspectForm from './ProspectForm';
import QuoteForm from './QuoteForm';
import { formatDate } from '../../utils/format';

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
  createdAt: string;
}
interface Prospect {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  source: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  quotesCount: number;
  latestQuote?: Quote | null;
  quotes?: Quote[];
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  nuevo:       { label: 'Nuevo',       color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  contactado:  { label: 'Contactado',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  cotizado:    { label: 'Cotizado',    color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  negociacion: { label: 'Negociación', color: '#F97316', bg: 'rgba(249,115,22,0.12)' },
  ganado:      { label: 'Ganado',      color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  perdido:     { label: 'Perdido',     color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};
const SOURCE_LABELS: Record<string, string> = {
  directo: 'Directo', referido: 'Referido', web: 'Web',
  llamada: 'Llamada', evento: 'Evento', redes: 'Redes',
};
const QUOTE_STATUS_CFG: Record<string, { label: string; color: string }> = {
  borrador:  { label: 'Borrador',   color: '#6B7280' },
  enviada:   { label: 'Enviada',    color: '#3B82F6' },
  vista:     { label: 'Vista',      color: '#8B5CF6' },
  aceptada:  { label: 'Aceptada',  color: '#10B981' },
  rechazada: { label: 'Rechazada', color: '#EF4444' },
};

function fmt(n: number, cur = 'MXN') {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: cur, minimumFractionDigits: 0 }).format(n);
}

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status] || { label: status, color: '#6B7280', bg: 'rgba(107,114,128,0.12)' };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: c.color, background: c.bg }}>{c.label}</span>
  );
}

function QuoteStatusPill({ status }: { status: string }) {
  const c = QUOTE_STATUS_CFG[status] || { label: status, color: '#6B7280' };
  return <span className="text-xs font-medium" style={{ color: c.color }}>{c.label}</span>;
}

// ---- Tarjeta de prospecto ----
function ProspectCard({ prospect, onEdit, onDelete, onAddQuote, onEditQuote, onDeleteQuote }: {
  prospect: Prospect;
  onEdit: () => void;
  onDelete: () => void;
  onAddQuote: () => void;
  onEditQuote: (q: Quote) => void;
  onDeleteQuote: (qid: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const q = prospect.latestQuote;
  const hasQuote = !!q;
  const totalOneTime = q ? q.implementationFee + q.licenseFee : 0;
  const totalMonthly = q ? q.monthlyFee : 0;

  const { data: detailData } = useQuery({
    queryKey: ['prospect', prospect.id],
    queryFn: () => prospectsApi.getOne(prospect.id),
    enabled: expanded,
  });
  const allQuotes: Quote[] = detailData?.data?.data?.quotes || [];

  return (
    <div className="card p-0 overflow-hidden" style={{ transition: 'box-shadow 0.2s' }}>
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {prospect.name}
              </h3>
              <StatusPill status={prospect.status} />
            </div>
            {prospect.contactName && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{prospect.contactName}</p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={onEdit} title="Editar" className="p-1.5 rounded-lg transition-opacity hover:opacity-60"
              style={{ color: 'var(--accent)' }}><Pencil size={13} /></button>
            <button onClick={onDelete} title="Eliminar" className="p-1.5 rounded-lg transition-opacity hover:opacity-60"
              style={{ color: '#EF4444' }}><Trash2 size={13} /></button>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          {prospect.email && (
            <a href={`mailto:${prospect.email}`} className="flex items-center gap-1 hover:underline" style={{ color: 'var(--accent)' }}>
              <Mail size={10} />{prospect.email}
            </a>
          )}
          {prospect.phone && <span className="flex items-center gap-1"><Phone size={10} />{prospect.phone}</span>}
          <span className="flex items-center gap-1"><Tag size={10} />{SOURCE_LABELS[prospect.source] || prospect.source}</span>
          <span className="flex items-center gap-1"><Clock size={10} />{formatDate(prospect.createdAt)}</span>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border-divider)' }} />

      {/* Cotización principal */}
      <div className="px-4 py-3">
        {hasQuote ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText size={12} style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {q.quoteNumber ? `# ${q.quoteNumber}` : 'Cotización reciente'}
                </span>
                <QuoteStatusPill status={q.status} />
              </div>
              {prospect.quotesCount > 0 && (
                <button onClick={() => setExpanded(!expanded)}
                  className="text-xs flex items-center gap-0.5 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-muted)' }}>
                  {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {prospect.quotesCount} cot{prospect.quotesCount !== 1 ? 's' : ''}.
                </button>
              )}
            </div>

            {/* Cifras clave */}
            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))' }}>
              {q.implementationFee > 0 && (
                <div className="rounded-lg p-2 text-center" style={{ background: 'var(--bg-hover)' }}>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Implementación</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{fmt(q.implementationFee, q.currency)}</div>
                </div>
              )}
              {q.licenseFee > 0 && (
                <div className="rounded-lg p-2 text-center" style={{ background: 'var(--bg-hover)' }}>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Licencia única</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{fmt(q.licenseFee, q.currency)}</div>
                </div>
              )}
              {q.monthlyFee > 0 && (
                <div className="rounded-lg p-2 text-center"
                  style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Mensualidad</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{fmt(q.monthlyFee, q.currency)}/mo</div>
                </div>
              )}
            </div>

            {q.productsDescription && (
              <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{q.productsDescription}</p>
            )}
            {q.validityDate && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Calendar size={10} />Vigente hasta {formatDate(q.validityDate)}
              </p>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Sin cotización aún</span>
          </div>
        )}
      </div>

      {/* Todas las cotizaciones (expandido) */}
      {expanded && allQuotes.length > 0 && (
        <>
          <div style={{ height: 1, background: 'var(--border-divider)' }} />
          <div className="px-4 py-3 space-y-1.5">
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Historial de cotizaciones</p>
            {allQuotes.map(aq => (
              <div key={aq.id} className="flex items-center justify-between rounded-lg px-3 py-2 gap-2"
                style={{ background: 'var(--bg-hover)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {aq.quoteNumber && <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>#{aq.quoteNumber}</span>}
                    <QuoteStatusPill status={aq.status} />
                  </div>
                  <div className="flex gap-2 text-xs mt-0.5 flex-wrap">
                    {aq.implementationFee > 0 && <span style={{ color: 'var(--text-secondary)' }}>Impl: {fmt(aq.implementationFee, aq.currency)}</span>}
                    {aq.licenseFee > 0 && <span style={{ color: 'var(--text-secondary)' }}>Lic: {fmt(aq.licenseFee, aq.currency)}</span>}
                    {aq.monthlyFee > 0 && <span style={{ color: 'var(--accent)' }}>{fmt(aq.monthlyFee, aq.currency)}/mo</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => onEditQuote(aq)} className="p-1 rounded hover:opacity-60" style={{ color: 'var(--accent)' }}>
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => onDeleteQuote(aq.id)} className="p-1 rounded hover:opacity-60" style={{ color: '#EF4444' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ height: 1, background: 'var(--border-divider)' }} />
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          {totalOneTime > 0 && (
            <span className="flex items-center gap-1">
              <DollarSign size={10} />Único: <strong style={{ color: 'var(--text-primary)' }}>{fmt(totalOneTime, q!.currency)}</strong>
            </span>
          )}
          {totalMonthly > 0 && (
            <span className="flex items-center gap-1">
              <TrendingUp size={10} />Recurrente: <strong style={{ color: 'var(--accent)' }}>{fmt(totalMonthly, q!.currency)}/mo</strong>
            </span>
          )}
          {!totalOneTime && !totalMonthly && (
            <span className="italic">Sin montos cotizados</span>
          )}
        </div>
        <button onClick={onAddQuote}
          className="text-xs font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
          style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
          <Plus size={11} />Cotización
        </button>
      </div>
    </div>
  );
}

// ---- Pipeline filtros ----
function StatusPipeline({ counts, current, onChange }: {
  counts: Record<string, number>; current: string; onChange: (s: string) => void;
}) {
  const statuses = ['nuevo', 'contactado', 'cotizado', 'negociacion', 'ganado', 'perdido'];
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button onClick={() => onChange('')}
        className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
        style={{
          background: current === '' ? 'var(--accent)' : 'var(--bg-surface)',
          color: current === '' ? 'var(--accent-btn-text)' : 'var(--text-secondary)',
          border: '1px solid var(--border)',
        }}>
        Todos {total > 0 ? `(${total})` : ''}
      </button>
      {statuses.map(s => {
        const c = STATUS_CFG[s];
        const active = current === s;
        const cnt = counts[s] || 0;
        return (
          <button key={s} onClick={() => onChange(s)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: active ? c.color : c.bg,
              color: active ? '#fff' : c.color,
              border: `1px solid ${c.color}40`,
            }}>
            {c.label}{cnt > 0 ? ` (${cnt})` : ''}
          </button>
        );
      })}
    </div>
  );
}

// ---- Página principal ----
export default function ProspectsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProspect, setEditProspect] = useState<Prospect | null>(null);
  const [quoteModal, setQuoteModal] = useState<{ prospectId: string; quote?: Quote } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'prospect' | 'quote'; id: string; prospectId?: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['prospects', search, statusFilter],
    queryFn: () => prospectsApi.getAll({ search: search || undefined, status: statusFilter || undefined }),
  });

  const prospects: Prospect[] = data?.data?.data || [];

  const counts = prospects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => prospectsApi.delete(id),
    onSuccess: () => { toast.success('Prospecto eliminado'); qc.invalidateQueries({ queryKey: ['prospects'] }); },
    onError: () => toast.error('Error al eliminar'),
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: ({ prospectId, qid }: { prospectId: string; qid: string }) =>
      prospectsApi.deleteQuote(prospectId, qid),
    onSuccess: (_, v) => {
      toast.success('Cotización eliminada');
      qc.invalidateQueries({ queryKey: ['prospects'] });
      qc.invalidateQueries({ queryKey: ['prospect', v.prospectId] });
    },
    onError: () => toast.error('Error al eliminar cotización'),
  });

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'prospect') {
      deleteMutation.mutate(confirmDelete.id);
    } else {
      deleteQuoteMutation.mutate({ prospectId: confirmDelete.prospectId!, qid: confirmDelete.id });
    }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Prospectos</h1>
          <p className="page-subtitle">Posibles clientes y cotizaciones en proceso</p>
        </div>
        <button onClick={() => { setEditProspect(null); setShowForm(true); }} className="btn-primary">
          <UserPlus size={16} />Nuevo Prospecto
        </button>
      </div>

      {/* Pipeline + búsqueda */}
      <div className="card p-4 space-y-3">
        <StatusPipeline counts={counts} current={statusFilter} onChange={setStatusFilter} />
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-9 max-w-sm" placeholder="Buscar por nombre, contacto o email..."
            value={search} onChange={e => { setSearch(e.target.value); }} />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <LoadingSpinner />
      ) : prospects.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Sin prospectos"
          description="Registra tu primer prospecto para empezar a hacer seguimiento de cotizaciones."
          action={
            <button onClick={() => { setEditProspect(null); setShowForm(true); }} className="btn-primary">
              <Plus size={15} className="mr-1" />Nuevo Prospecto
            </button>
          }
        />
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))' }}>
          {prospects.map(p => (
            <ProspectCard
              key={p.id}
              prospect={p}
              onEdit={() => { setEditProspect(p); setShowForm(true); }}
              onDelete={() => setConfirmDelete({ type: 'prospect', id: p.id })}
              onAddQuote={() => setQuoteModal({ prospectId: p.id })}
              onEditQuote={q => setQuoteModal({ prospectId: p.id, quote: q })}
              onDeleteQuote={qid => setConfirmDelete({ type: 'quote', id: qid, prospectId: p.id })}
            />
          ))}
        </div>
      )}

      {/* Modal prospecto */}
      {showForm && (
        <Modal title={editProspect ? 'Editar Prospecto' : 'Nuevo Prospecto'}
          onClose={() => { setShowForm(false); setEditProspect(null); }} size="lg">
          <ProspectForm
            prospect={editProspect}
            onSuccess={() => { setShowForm(false); setEditProspect(null); qc.invalidateQueries({ queryKey: ['prospects'] }); }}
            onCancel={() => { setShowForm(false); setEditProspect(null); }}
          />
        </Modal>
      )}

      {/* Modal cotización */}
      {quoteModal && (
        <Modal title={quoteModal.quote ? 'Editar Cotización' : 'Nueva Cotización'}
          onClose={() => setQuoteModal(null)} size="md">
          <QuoteForm
            prospectId={quoteModal.prospectId}
            quote={quoteModal.quote}
            onSuccess={() => {
              qc.invalidateQueries({ queryKey: ['prospects'] });
              qc.invalidateQueries({ queryKey: ['prospect', quoteModal.prospectId] });
              setQuoteModal(null);
            }}
            onCancel={() => setQuoteModal(null)}
          />
        </Modal>
      )}

      {/* Confirmar eliminar */}
      {confirmDelete && (
        <Modal title="Confirmar eliminación" onClose={() => setConfirmDelete(null)} size="sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)' }}>
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {confirmDelete.type === 'prospect'
                  ? '¿Eliminar este prospecto y todas sus cotizaciones? Esta acción no se puede deshacer.'
                  : '¿Eliminar esta cotización?'}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost flex-1 justify-center">Cancelar</button>
              <button onClick={handleConfirmDelete}
                className="flex-1 justify-center inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                style={{ background: '#EF4444', color: '#fff' }}>
                <Trash2 size={14} />Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
