import { FinanceProvider } from './context/FinanceContext';
import { MainLayout } from './components/layout/MainLayout';

export default function App() {
  return (
    <FinanceProvider>
      <MainLayout />
    </FinanceProvider>
  );
}
