import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Key, CreditCard, FileText,
  Package, GitBranch, TrendingDown, BarChart3, Settings,
  LogOut, ChevronLeft, ChevronRight, Bell,
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
        background: 'linear-gradient(180deg, #0D0D14 0%, #0A0A0F 100%)',
        borderRight: '1px solid rgba(0, 230, 118, 0.1)',
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
            <div className="text-xs text-gray-500 whitespace-nowrap">CRM Platform</div>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all"
        style={{
          background: '#1A1A24',
          border: '1px solid rgba(0,230,118,0.3)',
          color: '#00E676',
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
      <div className="p-2 border-t border-white/5 space-y-0.5">
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
          <div className="flex items-center gap-2 p-2 rounded-xl mt-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #00E676, #00C853)', color: '#0A0A0F' }}
            >
              {user.firstName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user.firstName} {user.lastName}</div>
              <div className="text-xs text-gray-500 truncate capitalize">{user.roleName}</div>
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
