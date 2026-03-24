import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Key, CreditCard, FileText,
  Package, GitBranch, TrendingDown, BarChart3, Settings,
  LogOut, ChevronLeft, ChevronRight, UserCog, Wrench,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clientes' },
  { to: '/licenses', icon: Key, label: 'Licencias' },
  { to: '/payments', icon: CreditCard, label: 'Pagos' },
  { to: '/invoices', icon: FileText, label: 'Facturas' },
  { to: '/products', icon: Package, label: 'Productos' },
  { to: '/versions', icon: GitBranch, label: 'Versiones' },
  { to: '/expenses', icon: TrendingDown, label: 'Gastos' },
  { to: '/reports', icon: BarChart3, label: 'Reportes' },
  { to: '/users', icon: UserCog, label: 'Usuarios' },
  { to: '/maintenance', icon: Wrench, label: 'Mantenimiento' },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } finally {
      logout();
      navigate('/login');
      toast.success('Sesión cerrada');
    }
  };

  return (
    <aside
      className="relative flex flex-col h-full transition-all duration-300"
      style={{
        width: collapsed ? '72px' : '240px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 mb-2" style={{ minHeight: '64px' }}>
        <div className="flex-shrink-0 w-9 h-9">
          <img src="/logos/logo_iados.svg" alt="iados" className="w-full h-full object-contain" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-bold text-base leading-tight text-gradient whitespace-nowrap">Core iados</div>
            <div className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>CRM Platform</div>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all"
        style={{
          background: 'var(--bg-surface-solid)',
          border: '1px solid var(--border-nav-active)',
          color: 'var(--accent)',
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-2 space-y-0.5" style={{ borderTop: '1px solid var(--border-divider)' }}>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
          }
          title={collapsed ? 'Configuración' : undefined}
        >
          <Settings size={18} className="flex-shrink-0" />
          {!collapsed && <span>Configuración</span>}
        </NavLink>

        {/* User info */}
        {!collapsed && user && (
          <div className="flex items-center gap-2 p-2 rounded-xl mt-1" style={{ background: 'var(--bg-hover)' }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'var(--accent-btn-text)' }}
            >
              {user.firstName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.firstName} {user.lastName}</div>
              <div className="text-xs truncate capitalize" style={{ color: 'var(--text-muted)' }}>{user.roleName}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-400 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}

        {collapsed && (
          <button
            onClick={handleLogout}
            className="nav-item justify-center w-full hover:text-red-400"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </aside>
  );
}
