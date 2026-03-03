import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MonthPickerProps {
    name?: string;
    defaultValue?: string; // YYYY-MM
    required?: boolean;
    className?: string;
    value?: string;
    onChange?: (val: string) => void;
}

const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril',
    'Maio', 'Junho', 'Julho', 'Agosto',
    'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function MonthPicker({ name, defaultValue, value, onChange, required, className = "" }: MonthPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const initialDate = (value || defaultValue) ? new Date(`${value || defaultValue}-01T12:00:00`) : new Date();

    const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth()); // 0-11
    const [viewYear, setViewYear] = useState(initialDate.getFullYear());

    const formattedValue = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const displayValue = `${months[selectedMonth]} de ${selectedYear}`;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectMonth = (mIndex: number) => {
        setSelectedMonth(mIndex);
        setSelectedYear(viewYear);
        const newVal = `${viewYear}-${String(mIndex + 1).padStart(2, '0')}`;
        if (onChange) onChange(newVal);
        setIsOpen(false);
    };

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
                <span className="flex items-center gap-2 text-gray-900 truncate">
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
                        className="absolute z-50 w-64 mt-2 p-3 bg-white border border-gray-100 rounded-xl shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-4 px-1">
                            <button
                                type="button"
                                onClick={() => setViewYear(y => y - 1)}
                                className="p-1 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="font-semibold text-gray-900">{viewYear}</span>
                            <button
                                type="button"
                                onClick={() => setViewYear(y => y + 1)}
                                className="p-1 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {months.map((m, idx) => {
                                const isSelected = selectedYear === viewYear && selectedMonth === idx;
                                return (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => handleSelectMonth(idx)}
                                        className={`py-2 px-1 text-xs rounded-lg transition-colors font-medium
                      ${isSelected
                                                ? 'bg-[#FF4D00] text-white shadow-sm hover:bg-[#FF4D00]/90'
                                                : 'text-gray-700 hover:bg-gray-100'
                                            }
                    `}
                                    >
                                        {m.substring(0, 3)}
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
