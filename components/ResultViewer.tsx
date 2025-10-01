import React from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { ReuseIcon } from './icons/ReuseIcon';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { UpscaleIcon } from './icons/UpscaleIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { useTranslation } from '../i18n/context';

interface ResultViewerProps {
  originalImage: string;
  resultImage: string;
  onStartOver: () => void;
  onUseBackground: () => void;
  canReuse: boolean;
  onUpscale: () => void;
  isUpscaling: boolean;
  isUpscaled: boolean;
  error: string | null;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ originalImage, resultImage, onStartOver, onUseBackground, canReuse, onUpscale, isUpscaling, isUpscaled, error }) => {
  const { t } = useTranslation();
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'enhanced-product-image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="text-center animate-fade-in">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-700">{t('result_title')}</h2>
      <p className="text-gray-500 mt-2 mb-8">{t('result_subtitle')}</p>
      
      <div className="max-w-lg mx-auto mb-8">
        <BeforeAfterSlider 
          beforeImage={originalImage}
          afterImage={resultImage}
        />
      </div>

      {error && <p className="text-red-500 text-center my-4 font-medium">{error}</p>}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
        <button 
          onClick={handleDownload}
          className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 bg-brand-indigo-600 text-white font-bold text-lg rounded-full shadow-md hover:bg-brand-indigo-700 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-indigo-300 gap-2"
        >
          <DownloadIcon />
          {t('result_download_button')}
        </button>
        {!isUpscaled && (
          <button
            onClick={onUpscale}
            disabled={isUpscaling}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 bg-indigo-50 text-indigo-700 font-bold text-lg rounded-full shadow-md hover:bg-indigo-100 border border-indigo-200 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-wait gap-2"
          >
            {isUpscaling ? (
              <>
                <SpinnerIcon />
                {t('result_upscaling_button')}
              </>
            ) : (
              <>
                <UpscaleIcon />
                {t('result_upscale_button')}
              </>
            )}
          </button>
        )}
        {canReuse && (
          <button 
            onClick={onUseBackground}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 bg-teal-50 text-teal-700 font-bold text-lg rounded-full shadow-md hover:bg-teal-100 border border-teal-200 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-teal-200 gap-2"
          >
            <ReuseIcon />
            {t('result_reuse_button')}
          </button>
        )}
        <button 
          onClick={onStartOver}
          className="w-full sm:w-auto px-8 py-3 bg-white text-gray-700 font-bold text-lg rounded-full shadow-md hover:bg-gray-100 border border-gray-300 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-200"
        >
          {t('result_start_over_button')}
        </button>
      </div>
    </div>
  );
};