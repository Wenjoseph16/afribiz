'use client';

import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'buttons';
  className?: string;
}

const variants = {
  underline: {
    container: 'border-b border-gray-200 dark:border-gray-700 gap-0',
    tab: 'px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200',
    active: 'text-brand dark:text-brand-400 border-brand dark:border-brand-400 hover:border-brand dark:hover:border-brand-400',
  },
  pills: {
    container: 'gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl',
    tab: 'px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-lg transition-all duration-200',
    active: 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm',
  },
  buttons: {
    container: 'gap-2',
    tab: 'px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200',
    active: 'bg-brand text-white dark:text-white border-brand hover:bg-brand-700 hover:text-white dark:hover:text-white',
  },
};

export function Tabs({ tabs, activeTab, onChange, variant = 'underline', className }: TabsProps) {
  const style = variants[variant];

  return (
    <div className={cn('flex items-center', style.container, className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && onChange(tab.id)}
          disabled={tab.disabled}
          className={cn(
            'relative flex items-center gap-2 whitespace-nowrap',
            style.tab,
            activeTab === tab.id && style.active,
            tab.disabled && 'opacity-40 cursor-not-allowed'
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && (
            <span className={cn(
              'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold rounded-full',
              activeTab === tab.id
                ? 'bg-brand/15 text-brand dark:bg-brand-400/20 dark:text-brand-400'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            )}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
