import React from 'react';
import { useTranslation } from '../i18n/context';

export const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useTranslation();

    const handleLanguageChange = (lang: 'en' | 'ar') => {
        setLanguage(lang);
    };
    
    const activeClasses = "bg-brand-indigo-600 text-white";
    const inactiveClasses = "text-gray-500 hover:bg-gray-200";

    return (
        <div className="flex items-center bg-gray-100 rounded-full p-1 text-sm font-medium">
            <button
                onClick={() => handleLanguageChange('ar')}
                className={`px-3 py-1 rounded-full transition-colors ${language === 'ar' ? activeClasses : inactiveClasses}`}
                aria-pressed={language === 'ar'}
            >
                العربية
            </button>
            <button
                onClick={() => handleLanguageChange('en')}
                className={`px-3 py-1 rounded-full transition-colors ${language === 'en' ? activeClasses : inactiveClasses}`}
                aria-pressed={language === 'en'}
            >
                English
            </button>
        </div>
    );
};
