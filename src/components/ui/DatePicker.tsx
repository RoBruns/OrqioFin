import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DatePickerProps {
    name?: string;
    defaultValue?: string; // YYYY-MM-DD
    required?: boolean;
    className?: string;
    value?: string;
    onChange?: (val: string) => void;
}

export function DatePicker({ name, defaultValue, value, onChange, required, className = "" }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const initialDate = (value || defaultValue) ? new Date(`${value || defaultValue}T12:00:00`) : new Date();

    const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
    const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(initialDate));

    // Update internal state if value prop changes
    useEffect(() => {
        if (value) setSelectedDate(new Date(`${value}T12:00:00`));
    }, [value]);

    const formattedValue = format(selectedDate, 'yyyy-MM-dd');
    const displayValue = format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePrevMonth = () => setViewMonth(subMonths(viewMonth, 1));
    const handleNextMonth = () => setViewMonth(addMonths(viewMonth, 1));

    const handleSelectDate = (date: Date) => {
        setSelectedDate(date);
        setViewMonth(startOfMonth(date)); // recenter if picking outside
        if (onChange) onChange(format(date, 'yyyy-MM-dd'));
        setIsOpen(false);
    };

    const currentMonthDays = eachDayOfInterval({
        start: startOfMonth(viewMonth),
        end: endOfMonth(viewMonth)
    });

    const firstDayOfWeek = getDay(startOfMonth(viewMonth)); // 0 = Sunday
    const paddingDays = Array.from({ length: firstDayOfWeek });

    return (
        <div className={`relative w-full ${className}`} ref={containerRef}>
            {name && (
                <input type="hidden" name={name} value={formattedValue} required={required} />
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2.5 flex items-center justify-between text-sm border border-gray-200 rounded-lg hover:border-gray-300 focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none bg-white transition-all text-left"
            >
                <span className="flex items-center gap-2 text-gray-900 capitalize truncate">
                    <CalendarIcon className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="truncate">{displayValue}</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-[280px] mt-2 p-3 bg-white border border-gray-100 rounded-xl shadow-xl left-0"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="p-1 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="font-semibold text-gray-900 capitalize text-sm">
                                {format(viewMonth, "MMMM yyyy", { locale: ptBR })}
                            </span>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="p-1 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center mb-1">
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                                <span key={i} className="text-[10px] font-medium text-gray-400">
                                    {day}
                                </span>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {paddingDays.map((_, i) => (
                                <div key={`empty-${i}`} className="h-8" />
                            ))}

                            {currentMonthDays.map((day) => {
                                const isSelected = isSameDay(day, selectedDate);
                                const isToday = isSameDay(day, new Date());

                                return (
                                    <button
                                        key={day.toISOString()}
                                        type="button"
                                        onClick={() => handleSelectDate(day)}
                                        className={`w-8 h-8 rounded-full text-xs font-medium transition-all mx-auto flex items-center justify-center
                      ${isSelected
                                                ? 'bg-[#FF4D00] text-white shadow-sm hover:bg-[#FF4D00]/90'
                                                : isToday
                                                    ? 'bg-[#FF4D00]/10 text-[#FF4D00]'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }
                    `}
                                    >
                                        {format(day, 'd')}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
