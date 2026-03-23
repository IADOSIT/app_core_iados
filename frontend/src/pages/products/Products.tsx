import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, Tag } from 'lucide-react';
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

export default function ProductsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  });

  const products: Product[] = data?.data?.data || [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">{products.length} productos registrados</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Nuevo Producto
        </button>
      </div>

      {isLoading ? <LoadingSpinner /> : products.length === 0 ? (
        <div className="card">
          <EmptyState icon={Package} title="Sin productos" description="Agrega tu primer producto" action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={15} />Nuevo Producto</button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)' }}>
                    <Package size={18} style={{ color: '#00E676' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{product.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{product.description || 'Sin descripción'}</p>
                  </div>
                </div>
                <button onClick={() => setEditProduct(product)} className="btn-ghost py-1 px-2 text-xs">Editar</button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-gray-500">Precio MXN</p>
                  <p className="font-semibold text-white mt-0.5">{formatCurrency(product.basePriceMxn)}</p>
                </div>
                <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-gray-500">Precio USD</p>
                  <p className="font-semibold text-white mt-0.5">{formatCurrency(product.basePriceUsd, 'USD')}</p>
                </div>
              </div>

              {product.plans && product.plans.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Tag size={11} />Planes disponibles</p>
                  <div className="space-y-1.5">
                    {product.plans.map((plan) => (
                      <div key={plan.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${planTypeBadge[plan.type] || 'badge-gray'}`}>{planTypeLabel[plan.type]}</span>
                          <span className="text-xs text-gray-300">{plan.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-primary-300">{formatCurrency(plan.priceMxn)}</span>
                          {plan.maxUsers && <span className="block text-xs text-gray-500">{plan.maxUsers} usuarios</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(showForm || editProduct) && (
        <Modal title={editProduct ? 'Editar Producto' : 'Nuevo Producto'} onClose={() => { setShowForm(false); setEditProduct(null); }} size="lg">
          <ProductForm
            product={editProduct || undefined}
            onSuccess={() => { setShowForm(false); setEditProduct(null); qc.invalidateQueries({ queryKey: ['products'] }); }}
            onCancel={() => { setShowForm(false); setEditProduct(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
