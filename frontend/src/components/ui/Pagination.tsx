import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, total, limit, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-xs text-gray-500">
        Mostrando {Math.min((page - 1) * limit + 1, total)} - {Math.min(page * limit, total)} de {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <ChevronLeft size={15} />
        </button>

        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let p = i + 1;
          if (totalPages > 5 && page > 3) p = page - 2 + i;
          if (p > totalPages) return null;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                p === page ? 'text-dark' : 'text-gray-400 hover:text-white'
              }`}
              style={p === page
                ? { background: 'linear-gradient(135deg,#00E676,#00C853)', color: '#0A0A0F' }
                : { background: 'rgba(255,255,255,0.05)' }
              }
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
