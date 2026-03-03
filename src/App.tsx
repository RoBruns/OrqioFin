import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { FinanceProvider } from './context/FinanceContext';
import { MainLayout } from './components/layout/MainLayout';

export default function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <FinanceProvider>
          <MainLayout />
        </FinanceProvider>
      </ProtectedRoute>
    </AuthProvider>
  );
}
