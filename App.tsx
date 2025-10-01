import React, { useState } from 'react';
import { Header } from './components/Header';
import { EnhancerView } from './components/EnhancerView';
import { ImageConverterView } from './components/ImageConverterView';
import { useTranslation } from './i18n/context';

type View = 'enhancer' | 'converter';

function App() {
  const [currentView, setCurrentView] = useState<View>('enhancer');
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-gray-200">
          {currentView === 'enhancer' && <EnhancerView />}
          {currentView === 'converter' && <ImageConverterView />}
        </div>
      </main>
      <footer className="text-center py-6 text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} {t('footer_text')}</p>
      </footer>
    </div>
  );
}

export default App;