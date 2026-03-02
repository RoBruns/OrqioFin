import React from 'react';
import { LayoutDashboard, Wallet, CalendarDays, Target, Briefcase, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'geral', label: 'Geral', icon: Settings },
    { id: 'mensal', label: 'Mensal', icon: Wallet },
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'calendario', label: 'Calendário', icon: CalendarDays },
    { id: 'empresa', label: 'Empresa', icon: Briefcase, disabled: true },
  ];

  return (
    <aside className="w-64 h-screen bg-white/80 backdrop-blur-xl border-r border-gray-100 flex flex-col fixed left-0 top-0 z-10">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#FF4D00] flex items-center justify-center shadow-lg shadow-[#FF4D00]/30">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight text-gray-900">Oracle<span className="text-[#FF4D00]">Fin</span></span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && setActiveTab(item.id)}
              disabled={item.disabled}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
                isActive 
                  ? "bg-[#FF4D00]/10 text-[#FF4D00]" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-gray-500"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-[#FF4D00]" : "text-gray-400")} />
              {item.label}
              {item.disabled && (
                <span className="ml-auto text-[10px] uppercase tracking-wider bg-gray-100 px-2 py-1 rounded-md text-gray-400">Em breve</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium">
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
