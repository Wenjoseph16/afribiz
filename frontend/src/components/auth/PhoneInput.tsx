'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sortedCountryCodes, CountryCode, getCountryByDial } from '@/constants/countryCodes';
import { Search, ChevronDown, Phone } from 'lucide-react';
import clsx from 'clsx';

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({ value = '', onChange, error, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentDial = value ? `+${value.replace(/^\+/, '').match(/^\d{1,4}/)?.[0] || ''}` : '+228';
  const selectedCountry = getCountryByDial(currentDial) || sortedCountryCodes[0];

  useEffect(() => {
    if (value) {
      const cleaned = value.replace(/^\+/, '');
      const match = cleaned.match(/^\d{1,4}/);
      if (match) {
        const dial = `+${match[0]}`;
        const rest = cleaned.slice(match[0].length);
        setPhoneNumber(rest);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectCountry = useCallback((country: CountryCode) => {
    const fullNumber = `${country.dial}${phoneNumber}`;
    onChange?.(fullNumber);
    setIsOpen(false);
    setSearch('');
  }, [phoneNumber, onChange]);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setPhoneNumber(raw);
    const dial = selectedCountry?.dial || '+228';
    const fullNumber = raw ? `${dial}${raw}` : '';
    onChange?.(fullNumber);
  }, [selectedCountry, onChange]);

  const filtered = search
    ? sortedCountryCodes.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
    : sortedCountryCodes;

  return (
    <div className="w-full" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <Phone className="w-4 h-4 inline mr-1 text-gray-400" />
        Téléphone
      </label>
      <div
        className={clsx(
          'flex rounded-lg border-2 overflow-hidden transition-colors',
          error ? 'border-red-500' : 'border-gray-200 focus-within:border-emerald-500',
          disabled && 'bg-gray-100 cursor-not-allowed'
        )}
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={clsx(
              'flex items-center gap-1.5 h-full px-3 py-2.5 text-sm font-medium text-gray-700',
              'hover:bg-gray-50 transition-colors border-r-2 border-gray-100',
              'min-w-[80px] sm:min-w-[90px]',
              disabled && 'cursor-not-allowed'
            )}
          >
            <span className="text-base leading-none">{selectedCountry?.flag}</span>
            <span className="hidden sm:inline">{selectedCountry?.dial}</span>
            <span className="sm:hidden">{selectedCountry?.dial}</span>
            <ChevronDown className={clsx('w-3.5 h-3.5 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
          </button>

          {isOpen && (
            <div className="fixed sm:absolute inset-x-0 bottom-0 sm:inset-auto sm:bottom-full sm:mb-1 sm:top-auto sm:left-0 sm:min-w-[280px] z-50 bg-white rounded-t-2xl sm:rounded-xl border border-gray-200 shadow-2xl shadow-black/20 sm:shadow-lg">
              <div className="sm:hidden flex items-center justify-between p-4 border-b border-gray-100">
                <span className="text-lg font-semibold text-gray-900">Code pays</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-medium text-emerald-700"
                >
                  Fermer
                </button>
              </div>

              <div className="p-2 sm:p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un pays ou indicatif..."
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="max-h-56 sm:max-h-64 overflow-y-auto overscroll-contain">
                {filtered.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">Aucun pays trouvé</div>
                ) : (
                  filtered.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => selectCountry(country)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left',
                        'hover:bg-emerald-50 active:bg-emerald-100',
                        selectedCountry?.code === country.code && 'bg-emerald-50 font-medium text-emerald-800'
                      )}
                    >
                      <span className="text-lg leading-none">{country.flag}</span>
                      <span className="text-gray-500 font-mono text-xs w-10">{country.dial}</span>
                      <span className="text-gray-800">{country.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder="90 00 00 00"
          disabled={disabled}
          inputMode="numeric"
          autoComplete="tel-national"
          className={clsx(
            'flex-1 px-3 py-2.5 text-gray-900 placeholder:text-gray-400 text-base sm:text-sm',
            'focus:outline-none bg-transparent',
            'disabled:cursor-not-allowed'
          )}
        />
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};
