import React, { useState, useCallback } from 'react';
import { ImageUploader } from './ImageUploader';
import { ResultViewer } from './ResultViewer';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { ProcessingState } from '../types';
import { enhanceImage, upscaleImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { useTranslation } from '../i18n/context';

export const EnhancerView: React.FC = () => {
    const { t } = useTranslation();
    const [productImage, setProductImage] = useState<File | null>(null);
    const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
    const [processingState, setProcessingState] = useState<ProcessingState>(ProcessingState.Idle);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
  
    const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
    const [isUpscaled, setIsUpscaled] = useState<boolean>(false);
  
    const handleProductImageSelect = (file: File, dataUrl: string) => {
      setProductImage(file);
      setOriginalImageSrc(dataUrl);
    };
  
    const handleEnhanceClick = useCallback(async () => {
      if (!productImage) {
        setError(t('error_product_image_required'));
        return;
      }
  
      setProcessingState(ProcessingState.Processing);
      setError(null);
      setResultImage(null);
      setIsUpscaled(false);
      setLoadingMessage(t('enhancer_processing_removing_bg'));
  
      try {
        const productImageData = await fileToBase64(productImage);
        
        // Simulate progress updates
        setTimeout(() => {
          if (processingState === ProcessingState.Processing) {
            setLoadingMessage(t('enhancer_processing_generating_bg'));
          }
        }, 2000);
        
        const { finalImage, retries } = await enhanceImage(
          productImageData,
          3,
          (attempt, maxRetries) => {
            // Retry callback
            setLoadingMessage(
              t('enhancer_retry_attempt', { current: attempt, max: maxRetries })
            );
          }
        );
  
        setLoadingMessage(t('enhancer_processing_finalizing'));
  
        if (finalImage) {
          const finalImageSrc = `data:image/jpeg;base64,${finalImage}`;
          setResultImage(finalImageSrc);
          setProcessingState(ProcessingState.Success);
        } else {
          throw new Error(t('error_ai_text_only', { max: retries }));
        }
  
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : t('error_unknown'));
        setProcessingState(ProcessingState.Error);
      } finally {
        setLoadingMessage('');
      }
    }, [productImage, t, processingState]);
  
    const handleUpscaleClick = async () => {
      if (!resultImage) return;
  
      setIsUpscaling(true);
      setError(null);
  
      try {
          const parts = resultImage.split(',');
          const mimeTypeMatch = parts[0].match(/:(.*?);/);
          if (!mimeTypeMatch || !parts[1]) {
            throw new Error("Invalid result image format for upscaling.");
          }
          const currentImage = { base64: parts[1], mimeType: mimeTypeMatch[1] };
  
          const { upscaledImage: upscaledImageData } = await upscaleImage(currentImage);
  
          if (upscaledImageData) {
              const newImageSrc = `data:${currentImage.mimeType};base64,${upscaledImageData}`;
              setResultImage(newImageSrc);
              setIsUpscaled(true);
          } else {
              throw new Error(t('error_no_upscaled_image_from_ai'));
          }
      } catch (err) {
          console.error(err);
          setError(err instanceof Error ? err.message : t('error_upscaling'));
      } finally {
          setIsUpscaling(false);
      }
    };
  
    const handleReset = () => {
      setProductImage(null);
      setOriginalImageSrc(null);
      setProcessingState(ProcessingState.Idle);
      setResultImage(null);
      setError(null);
      setIsUpscaled(false);
      setIsUpscaling(false);
      setLoadingMessage('');
    };
  
    const isProcessing = processingState === ProcessingState.Processing;

    return (
        <>
            {processingState !== ProcessingState.Success && (
                <>
                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-700">{t('enhancer_title')}</h2>
                    <p className="text-gray-500 mt-2">{t('enhancer_subtitle')}</p>
                </div>
                
                <div className="max-w-lg mx-auto">
                    <ImageUploader 
                      title={t('enhancer_uploader_product')}
                      onFileSelect={handleProductImageSelect}
                      disabled={isProcessing}
                      required
                    />
                </div>

                {error && (
                  <div className="max-w-lg mx-auto mt-6">
                    <p className="text-red-500 text-center font-medium">{error}</p>
                  </div>
                )}
                
                <div className="mt-10 text-center">
                    <button 
                      onClick={handleEnhanceClick}
                      disabled={!productImage || isProcessing}
                      className="w-full max-w-sm inline-flex items-center justify-center px-8 py-4 bg-brand-indigo-600 text-white font-bold text-lg rounded-full shadow-md hover:bg-brand-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-indigo-300 gap-2"
                      aria-label={isProcessing ? loadingMessage : t('enhancer_button_enhance')}
                    >
                      {isProcessing ? (
                          <>
                            <SpinnerIcon />
                            <span className="animate-pulse">{loadingMessage || t('enhancer_button_processing')}</span>
                          </>
                      ) : (
                          t('enhancer_button_enhance')
                      )}
                    </button>
                </div>
                </>
            )}

            {processingState === ProcessingState.Success && resultImage && originalImageSrc && (
                <ResultViewer 
                  originalImage={originalImageSrc}
                  resultImage={resultImage}
                  onStartOver={handleReset}
                  onUpscale={handleUpscaleClick}
                  isUpscaling={isUpscaling}
                  isUpscaled={isUpscaled}
                  error={error}
                />
            )}
        </>
    );
};
