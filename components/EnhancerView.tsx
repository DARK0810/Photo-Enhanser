import React, { useState, useCallback } from 'react';
import { ImageUploader } from './ImageUploader';
import { ResultViewer } from './ResultViewer';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { ProcessingState } from '../types';
import { enhanceImage, applyStyleFromReference, upscaleImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { useTranslation } from '../i18n/context';

export const EnhancerView: React.FC = () => {
    const { t } = useTranslation();
    const [productImage, setProductImage] = useState<File | null>(null);
    const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
    const [styleReferenceImage, setStyleReferenceImage] = useState<File | null>(null);
    const [processingState, setProcessingState] = useState<ProcessingState>(ProcessingState.Idle);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const [reusableBackground, setReusableBackground] = useState<string | null>(null);
    const [isReusingBackground, setIsReusingBackground] = useState<boolean>(false);
  
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
  
      try {
        const productImageData = await fileToBase64(productImage);
        let finalBase64Image: string | null = null;
        
        if (styleReferenceImage) {
          const styleReferenceImageData = await fileToBase64(styleReferenceImage);
          const { base64Image } = await applyStyleFromReference(productImageData, styleReferenceImageData);
          finalBase64Image = base64Image;
        } else if (isReusingBackground && reusableBackground) {
          const parts = reusableBackground.split(',');
          const mimeTypeMatch = parts[0].match(/:(.*?);/);
          if (!mimeTypeMatch || !parts[1]) {
            throw new Error("Invalid reusable background format.");
          }
          const styleReferenceData = { base64: parts[1], mimeType: mimeTypeMatch[1] };
          
          const { base64Image } = await applyStyleFromReference(productImageData, styleReferenceData);
          finalBase64Image = base64Image;
        } else {
          const { finalImage } = await enhanceImage(productImageData);
          finalBase64Image = finalImage;
        }
  
        if (finalBase64Image) {
          const finalImageSrc = `data:image/jpeg;base64,${finalBase64Image}`;
          setResultImage(finalImageSrc);
          
          if (!isReusingBackground && !styleReferenceImage) {
            setReusableBackground(finalImageSrc);
          }
          
          setProcessingState(ProcessingState.Success);
        } else {
          throw new Error(t('error_no_image_from_ai'));
        }
  
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : t('error_unknown'));
        setProcessingState(ProcessingState.Error);
      }
    }, [productImage, styleReferenceImage, isReusingBackground, reusableBackground, t]);
  
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
      setStyleReferenceImage(null);
      setProcessingState(ProcessingState.Idle);
      setResultImage(null);
      setError(null);
      setReusableBackground(null);
      setIsReusingBackground(false);
      setIsUpscaled(false);
      setIsUpscaling(false);
    };
    
    const handleUseThisBackground = () => {
      setIsReusingBackground(true);
      setProductImage(null);
      setOriginalImageSrc(null);
      setStyleReferenceImage(null);
      setResultImage(null);
      setError(null);
      setProcessingState(ProcessingState.Idle);
      setIsUpscaled(false);
      setIsUpscaling(false);
    };
    
    const handleCancelReuse = () => {
      setIsReusingBackground(false);
    };
  
    const isProcessing = processingState === ProcessingState.Processing;
    
    const getButtonText = () => {
      if (isReusingBackground) return t('enhancer_button_apply_background');
      if (styleReferenceImage) return t('enhancer_button_apply_style');
      return t('enhancer_button_enhance');
    };
  
    return (
        <>
            {processingState !== ProcessingState.Success && (
                <>
                <div className="text-center mb-8">
                    {isReusingBackground ? (
                    <>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-700">{t('enhancer_reuse_title')}</h2>
                        <p className="text-gray-500 mt-2">{t('enhancer_reuse_subtitle')}</p>
                        <button onClick={handleCancelReuse} className="text-sm text-brand-indigo-600 hover:underline mt-2">
                        {t('enhancer_reuse_cancel')}
                        </button>
                    </>
                    ) : (
                    <>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-700">{t('enhancer_title')}</h2>
                        <p className="text-gray-500 mt-2">{t('enhancer_subtitle')}</p>
                    </>
                    )}
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-start">
                    <ImageUploader 
                    title={isReusingBackground ? t('enhancer_uploader_new_product') : t('enhancer_uploader_product')}
                    onFileSelect={handleProductImageSelect}
                    disabled={isProcessing}
                    required
                    />
                    <ImageUploader 
                    title={t('enhancer_uploader_style_reference')}
                    onFileSelect={(file) => setStyleReferenceImage(file)}
                    isStyleReference
                    disabled={isProcessing || isReusingBackground}
                    />
                </div>

                {error && <p className="text-red-500 text-center mt-6">{error}</p>}
                
                <div className="mt-10 text-center">
                    <button 
                    onClick={handleEnhanceClick}
                    disabled={!productImage || isProcessing}
                    className="w-full max-w-sm inline-flex items-center justify-center px-8 py-4 bg-brand-indigo-600 text-white font-bold text-lg rounded-full shadow-md hover:bg-brand-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-indigo-300 gap-2"
                    >
                    {isProcessing ? (
                        <>
                        <SpinnerIcon />
                        {t('enhancer_button_processing')}
                        </>
                    ) : (
                        getButtonText()
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
                onUseBackground={handleUseThisBackground}
                canReuse={!!reusableBackground}
                onUpscale={handleUpscaleClick}
                isUpscaling={isUpscaling}
                isUpscaled={isUpscaled}
                error={error}
                />
            )}
        </>
    );
};