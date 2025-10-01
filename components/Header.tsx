import React from 'react';
import { LazoraLogo } from './icons/LazoraLogo';
import { useTranslation } from '../i18n/context';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
  currentView: 'enhancer' | 'converter';
  onViewChange: (view: 'enhancer' | 'converter') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  const { t } = useTranslation();
  const navButtonClasses = "px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-indigo-400 focus:ring-offset-2";
  const activeClasses = "bg-brand-indigo-600 text-white shadow-sm";
  const inactiveClasses = "text-gray-500 hover:bg-gray-200 hover:text-gray-700";

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 text-brand-indigo-700">
            <LazoraLogo className="h-7 w-auto" />
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex items-center space-x-1 p-1 bg-gray-100 rounded-lg" role="navigation" aria-label="Main">
            <button
              onClick={() => onViewChange('enhancer')}
              className={`${navButtonClasses} ${currentView === 'enhancer' ? activeClasses : inactiveClasses}`}
              aria-current={currentView === 'enhancer' ? 'page' : undefined}
            >
              {t('photo_enhancer')}
            </button>
            <button
              onClick={() => onViewChange('converter')}
              className={`${navButtonClasses} ${currentView === 'converter' ? activeClasses : inactiveClasses}`}
              aria-current={currentView === 'converter' ? 'page' : undefined}
            >
              {t('image_converter')}
            </button>
          </nav>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};