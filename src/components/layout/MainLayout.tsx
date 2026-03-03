import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { DashboardPage } from '@/pages/DashboardPage';
import { GeralPage } from '@/pages/GeralPage';
import { MensalPage } from '@/pages/MensalPage';
import { MetasPage } from '@/pages/MetasPage';
import { CalendarioPage } from '@/pages/CalendarioPage';
import { useFinance } from '@/context/FinanceContext';
import { MarketTicker } from '../MarketTicker';

export function MainLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isLoading } = useFinance();

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage />;
      case 'geral': return <GeralPage />;
      case 'mensal': return <MensalPage />;
      case 'metas': return <MetasPage />;
      case 'calendario': return <CalendarioPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-[#FF4D00]/20">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="ml-64 min-h-screen flex flex-col">
        {activeTab === 'metas' && <MarketTicker />}
        <div className="px-4 py-6 w-full flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-[70vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4D00]"></div>
            </div>
          ) : (
            renderPage()
          )}
        </div>
      </main>
    </div>
  );
}
