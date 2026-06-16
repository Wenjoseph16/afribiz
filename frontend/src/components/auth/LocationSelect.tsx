'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapPin, ChevronDown, Search, Globe, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Country, State, City } from 'country-state-city';

interface CountryItem {
  isoCode: string;
  name: string;
  phonecode: string;
  flag: string;
}

interface StateItem {
  isoCode: string;
  name: string;
  countryCode: string;
}

interface CityItem {
  name: string;
  countryCode: string;
  stateCode: string;
}

interface LocationSelectProps {
  country: string;
  region: string;
  city: string;
  neighborhood: string;
  onCountryChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onNeighborhoodChange: (value: string) => void;
  errors?: {
    country?: string;
    region?: string;
    city?: string;
    neighborhood?: string;
  };
  onCountryCodeChange?: (phonecode: string) => void;
  /** 'all': tout le formulaire, 'country': seulement le pays, 'location': région+ville+quartier */
  showFields?: 'all' | 'country' | 'location';
}

const inputBase =
  'w-full h-11 px-4 text-sm rounded-xl border bg-white dark:bg-gray-950/90 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ' +
  'transition-all duration-200 ease-smooth outline-none ' +
  'border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 ' +
  'focus:border-brand focus:shadow-[0_0_0_2px_rgba(5,150,105,0.12)] dark:focus:shadow-[0_0_0_2px_rgba(5,150,105,0.25)] cursor-pointer';

function SelectDropdown<T extends { isoCode?: string; name: string }>({
  items,
  value,
  onChange,
  placeholder,
  icon: Icon,
  label,
  error,
  searchable = false,
  disabled = false,
  itemDisabled,
  renderItem,
}: {
  items: T[];
  value: string;
  onChange: (item: T) => void;
  placeholder: string;
  icon: React.ElementType;
  label: string;
  error?: string;
  searchable?: boolean;
  disabled?: boolean;
  itemDisabled?: (item: T) => boolean;
  renderItem?: (item: T, isDisabled: boolean) => React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedItem = items.find((i) => i.name === value);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="relative space-y-1.5" ref={ref}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} <span className="text-red-400">*</span>
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none z-10">
          <Icon className="w-4 h-4" />
        </div>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={clsx(
            inputBase,
            'pl-10 pr-10 text-left truncate',
            !selectedItem && 'text-gray-400 dark:text-gray-500',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {selectedItem ? selectedItem.name : placeholder}
        </button>
        <ChevronDown
          className={clsx(
            'absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5 mt-1"
        >
          <span className="w-1 h-1 rounded-full bg-red-500 dark:bg-red-400 shrink-0" />
          {error}
        </motion.p>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full min-w-[220px] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl shadow-black/10 dark:shadow-black/30"
          >
            {searchable && (
              <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}
            <div className="max-h-56 overflow-y-auto overscroll-contain p-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-gray-400">Aucun résultat</div>
              ) : (
                filtered.map((item) => {
                  const isDisabled = itemDisabled?.(item) ?? false;
                  return (
                    <button
                      key={item.isoCode || item.name}
                      type="button"
                      onClick={() => {
                        if (isDisabled) return;
                        onChange(item);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={clsx(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all text-left',
                        isDisabled
                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'hover:bg-brand/5 active:bg-brand/10',
                        value === item.name && !isDisabled
                          ? 'bg-brand/10 text-brand font-medium'
                          : isDisabled
                            ? 'text-gray-300 dark:text-gray-600'
                            : 'text-gray-700 dark:text-gray-300'
                      )}
                      disabled={isDisabled}
                    >
                      {renderItem ? (
                        renderItem(item, isDisabled)
                      ) : (
                        <>
                          <span>{item.name}</span>
                          {isDisabled && (
                            <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                              Bientôt
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LocationSelect({
  country,
  region,
  city,
  neighborhood,
  onCountryChange,
  onRegionChange,
  onCityChange,
  onNeighborhoodChange,
  errors = {},
  onCountryCodeChange,
  showFields = 'all',
}: LocationSelectProps) {
  // === COUNTRY: only African countries, only Togo selectable ===
  const countries = useMemo(() => {
    const raw = Country.getAllCountries();
    const africanCodes = new Set([
      'TG', 'BJ', 'SN', 'CI', 'GH', 'NG', 'BF', 'ML', 'NE', 'GN',
      'CM', 'CD', 'KE', 'ET', 'ZA', 'MA', 'DZ', 'TN', 'EG',
      'AO', 'MZ', 'MG', 'RW', 'UG', 'TZ', 'ZM', 'ZW', 'MW',
      'SL', 'LR', 'CF', 'GA', 'CG', 'GQ', 'TD', 'BI', 'SO', 'SS', 'SD',
      'GM', 'GW', 'CV', 'ST', 'KM', 'SC', 'MU', 'MR', 'DJ', 'ER',
      'LS', 'BW', 'NA', 'SZ',
    ]);
    return raw
      .filter((c: any) => africanCodes.has(c.isoCode))
      .map((c: any) => ({
        isoCode: c.isoCode,
        name: c.name,
        phonecode: c.phonecode,
        flag: c.flag || '',
      }));
  }, []);

  const selectedCountry = useMemo(
    () => countries.find((c) => c.name === country),
    [countries, country]
  );

  // === REGIONS / STATES (depend on country) ===
  const states = useMemo(() => {
    if (!selectedCountry) return [];
    const raw = State.getStatesOfCountry(selectedCountry.isoCode) || [];
    return raw.map((s: any) => ({
      isoCode: s.isoCode,
      name: s.name,
      countryCode: s.countryCode,
    }));
  }, [selectedCountry]);

  const selectedState = useMemo(
    () => states.find((s) => s.name === region),
    [states, region]
  );

  // === CITIES (depend on region) ===
  const cities = useMemo(() => {
    if (!selectedCountry || !selectedState) return [];
    const raw = City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode) || [];
    return raw.map((c: any) => ({
      name: c.name,
      countryCode: c.countryCode,
      stateCode: c.stateCode,
    }));
  }, [selectedCountry, selectedState]);

  // === HANDLERS ===
  const handleCountryChange = useCallback(
    (item: CountryItem) => {
      onCountryChange(item.name);
      onRegionChange('');
      onCityChange('');
      onCountryCodeChange?.(item.phonecode);
    },
    [onCountryChange, onRegionChange, onCityChange, onCountryCodeChange]
  );

  const handleRegionChange = useCallback(
    (item: StateItem) => {
      onRegionChange(item.name);
      onCityChange('');
    },
    [onRegionChange, onCityChange]
  );

  // Only Togo is selectable
  const isCountryDisabled = useCallback(
    (item: CountryItem) => item.isoCode !== 'TG',
    []
  );

  const renderCountryItem = useCallback(
    (item: CountryItem, isDisabled: boolean) => (
      <div className="flex items-center gap-2 w-full">
        <span className="text-lg leading-none">{item.flag}</span>
        <span className="flex-1">{item.name}</span>
        {isDisabled ? (
          <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            Bientôt
          </span>
        ) : (
          <span className="text-[10px] text-brand bg-brand-50 dark:bg-brand-900/30 px-1.5 py-0.5 rounded-full">
            Disponible
          </span>
        )}
      </div>
    ),
    []
  );

  const shouldShowCountry = showFields === 'all' || showFields === 'country';
  const shouldShowLocation = showFields === 'all' || showFields === 'location';

  return (
    <div className="space-y-4">
      {/* ── COUNTRY (standalone, only Togo selectable) ── */}
      {shouldShowCountry && (
        <SelectDropdown<CountryItem>
          items={countries}
          value={country}
          onChange={handleCountryChange}
          placeholder="Sélectionnez votre pays"
          icon={Globe}
          label="Pays"
          error={errors.country}
          searchable
          itemDisabled={isCountryDisabled}
          renderItem={renderCountryItem}
        />
      )}

      {/* ── REGION + CITY (depend on country) ── */}
      {shouldShowLocation && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectDropdown<StateItem>
              items={states}
              value={region}
              onChange={handleRegionChange}
              placeholder={country ? 'Sélectionnez une région' : "Choisissez un pays d'abord"}
              icon={MapPin}
              label="Région"
              error={errors.region}
              disabled={!country}
              searchable
            />
            <SelectDropdown<CityItem>
              items={cities}
              value={city}
              onChange={(item) => onCityChange(item.name)}
              placeholder={region ? 'Sélectionnez une ville' : "Choisissez une région d'abord"}
              icon={MapPin}
              label="Ville"
              error={errors.city}
              disabled={!region}
              searchable
            />
          </div>

          {/* ── NEIGHBORHOOD (free text) ── */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Quartier
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Adidogomé, Agoè, Tokoin..."
                value={neighborhood}
                onChange={(e) => onNeighborhoodChange(e.target.value)}
                className={`${inputBase} pl-10`}
              />
            </div>
            {errors.neighborhood && (
              <motion.p
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5 mt-1"
              >
                <span className="w-1 h-1 rounded-full bg-red-500 dark:bg-red-400 shrink-0" />
                {errors.neighborhood}
              </motion.p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
