import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/Login';
import DashboardPage from './pages/dashboard/Dashboard';
import ClientsPage from './pages/clients/Clients';
import ClientDetailPage from './pages/clients/ClientDetail';
import LicensesPage from './pages/licenses/Licenses';
import PaymentsPage from './pages/payments/Payments';
import InvoicesPage from './pages/invoices/Invoices';
import ProductsPage from './pages/products/Products';
import VersionsPage from './pages/versions/Versions';
import ExpensesPage from './pages/expenses/Expenses';
import ReportsPage from './pages/reports/Reports';
import SettingsPage from './pages/settings/Settings';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:id" element={<ClientDetailPage />} />
          <Route path="licenses" element={<LicensesPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="versions" element={<VersionsPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
