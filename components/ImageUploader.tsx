import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { StyleIcon } from './icons/StyleIcon';
import { useTranslation } from '../i18n/context';

interface ImageUploaderProps {
  title: string;
  onFileSelect: (file: File, dataUrl: string) => void;
  isStyleReference?: boolean;
  disabled?: boolean;
  required?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ title, onFileSelect, isStyleReference = false, disabled = false, required = false }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useTranslation();

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setPreview(dataUrl);
          onFileSelect(file, dataUrl);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled) {
        handleFileChange(e.dataTransfer.files);
    }
  }, [disabled]);


  const baseClasses = "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300";
  const idleClasses = "bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-brand-indigo-400";
  const draggingClasses = "bg-brand-indigo-50 border-brand-indigo-500";
  const disabledClasses = "bg-gray-200 border-gray-300 cursor-not-allowed";

  const getClassName = () => {
    if (disabled) return `${baseClasses} ${disabledClasses}`;
    if (isDragging) return `${baseClasses} ${draggingClasses}`;
    return `${baseClasses} ${idleClasses}`;
  }
  
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-600 mb-3">
        {title} {required && <span className="text-red-500">*</span>}
      </h3>
      <label 
        htmlFor={isStyleReference ? 'style-upload' : 'file-upload'} 
        className={getClassName()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="object-contain w-full h-full p-2 rounded-lg" />
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
            {isStyleReference ? <StyleIcon /> : <UploadIcon />}
            <p className="mb-2 text-sm font-semibold">
              <span className="text-brand-indigo-600">{t('uploader_click_to_upload')}</span> {t('uploader_drag_and_drop')}
            </p>
            <p className="text-xs">{t('uploader_file_types')}</p>
          </div>
        )}
        <input 
          id={isStyleReference ? 'style-upload' : 'file-upload'}
          type="file" 
          className="hidden" 
          accept="image/*"
          onChange={(e) => handleFileChange(e.target.files)}
          disabled={disabled}
        />
      </label>
    </div>
  );
};