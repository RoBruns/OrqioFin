import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useFinance } from '@/context/FinanceContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function CalendarioPage() {
  const { transactions, creditCards, recurringIncomes, fixedExpenses } = useFinance();
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = monthStart;
  const endDate = monthEnd;

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const startDayOfWeek = getDay(monthStart);

  // Mock events based on context data
  const getEventsForDay = (day: Date) => {
    const dayNumber = day.getDate();
    const events = [];

    // Incomes
    recurringIncomes.forEach(inc => {
      if (inc.day === dayNumber) {
        events.push({ type: 'income', title: inc.description, amount: inc.amount, icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-100' });
      }
    });

    // Expenses
    fixedExpenses.forEach(exp => {
      if (exp.day === dayNumber) {
        events.push({ type: 'expense', title: exp.description, amount: exp.amount, icon: ArrowDownRight, color: 'text-red-600', bg: 'bg-red-100' });
      }
    });

    // Credit Cards
    creditCards.forEach(card => {
      if (card.dueDay === dayNumber) {
        events.push({ type: 'card', title: `Fatura ${card.name}`, amount: card.currentInvoice, icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100' });
      }
    });

    return events;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Calendário</h1>
          <p className="text-gray-500 mt-1">Visualize seus compromissos financeiros do mês.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
          <span className="font-semibold text-gray-900 min-w-[150px] text-center capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
        </div>
      </div>

      <Card className="overflow-hidden border border-gray-100 shadow-sm">
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-fr">
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[120px] p-2 border-b border-r border-gray-100 bg-gray-50/30" />
            ))}
            
            {days.map((day, idx) => {
              const events = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div 
                  key={day.toString()} 
                  className={`min-h-[120px] p-2 border-b border-r border-gray-100 transition-colors hover:bg-gray-50/50 ${isToday ? 'bg-orange-50/30' : 'bg-white'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-[#FF4D00] text-white shadow-md shadow-[#FF4D00]/20' : 'text-gray-700'}`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {events.map((event, i) => {
                      const Icon = event.icon;
                      return (
                        <div 
                          key={i} 
                          className={`flex items-center justify-between p-1.5 rounded-md ${event.bg} cursor-pointer hover:opacity-80 transition-opacity`}
                          title={`${event.title}: R$ ${event.amount}`}
                        >
                          <div className="flex items-center gap-1 overflow-hidden">
                            <Icon className={`w-3 h-3 flex-shrink-0 ${event.color}`} />
                            <span className={`text-[10px] font-bold truncate ${event.color}`}>{event.title}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legenda */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-gray-600 font-medium">Recebimentos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600 font-medium">Pagamentos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-gray-600 font-medium">Cartões</span>
        </div>
      </div>
    </motion.div>
  );
}
