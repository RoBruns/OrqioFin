import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Option {
    value: string;
    label: string;
}

interface SelectProps {
    name?: string;
    options: Option[];
    value?: string;
    defaultValue?: string;
    onChange?: (val: string) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
}

export function Select({ name, options, value, defaultValue, onChange, placeholder = "Selecione...", required, className = "" }: SelectProps) {
    const [internalVal, setInternalVal] = useState(defaultValue || '');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalVal;

    const selectedOption = options.find(o => o.value === currentValue);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val: string) => {
        if (!isControlled) setInternalVal(val);
        if (onChange) onChange(val);
        setIsOpen(false);
    };

    return (
        <div className={`relative w-full ${className}`} ref={containerRef}>
            {name && (
                <input type="hidden" name={name} value={currentValue} required={required && !currentValue} />
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2.5 flex items-center justify-between text-sm border border-gray-200 rounded-lg hover:border-gray-300 focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none bg-white transition-all text-left"
            >
                <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto py-1"
                    >
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleSelect(opt.value)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${currentValue === opt.value ? 'bg-[#FF4D00]/10 text-[#FF4D00] font-medium' : 'text-gray-700'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                        {options.length === 0 && (
                            <div className="px-4 py-2 text-sm text-gray-400">Nenhum item</div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
