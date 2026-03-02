import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { DashboardPage } from '@/pages/DashboardPage';
import { GeralPage } from '@/pages/GeralPage';
import { MensalPage } from '@/pages/MensalPage';
import { MetasPage } from '@/pages/MetasPage';
import { CalendarioPage } from '@/pages/CalendarioPage';

export function MainLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');

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
      <main className="ml-64 p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
