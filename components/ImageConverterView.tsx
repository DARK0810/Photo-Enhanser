import React, { useState, useCallback } from 'react';
import { convertImage } from '../utils/imageConverter';
import { ConverterIcon } from './icons/ConverterIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { useTranslation } from '../i18n/context';

type Format = 'image/webp' | 'image/jpeg' | 'image/png';

interface ConvertedFile {
    blobUrl: string;
    name: string;
    originalSize: number;
    newSize: number;
}

export const ImageConverterView: React.FC = () => {
    const { t } = useTranslation();
    const [files, setFiles] = useState<File[]>([]);
    const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
    const [targetFormat, setTargetFormat] = useState<Format>('image/webp');
    const [isConverting, setIsConverting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (fileList: FileList | null) => {
        if (!fileList) return;
        const newFiles = Array.from(fileList).filter(file => file.type.startsWith('image/'));
        setFiles(prev => [...prev, ...newFiles]);
        setConvertedFiles([]); // Reset results when new files are added
        setError(null);
    };

    const handleConvert = async () => {
        if (files.length === 0) {
            setError(t('error_at_least_one_image'));
            return;
        }
        setIsConverting(true);
        setError(null);
        setConvertedFiles([]);

        try {
            const conversionPromises = files.map(async file => {
                const blob = await convertImage(file, { format: targetFormat, quality: 0.9 });
                const blobUrl = URL.createObjectURL(blob);
                const originalFileName = file.name.substring(0, file.name.lastIndexOf('.'));
                const newExtension = targetFormat.split('/')[1];

                return {
                    blobUrl,
                    name: `${originalFileName}.${newExtension}`,
                    originalSize: file.size,
                    newSize: blob.size,
                };
            });

            const results = await Promise.all(conversionPromises);
            setConvertedFiles(results);
            setFiles([]); // Clear the input files list after conversion
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : t('error_conversion'));
        } finally {
            setIsConverting(false);
        }
    };
    
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return `0 ${t('bytes')}`;
        const k = 1024;
        const sizes = [t('bytes'), 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); handleFileChange(e.dataTransfer.files); }, []);

    const uploaderBaseClasses = "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300";
    const uploaderIdleClasses = "bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-brand-indigo-400";
    const uploaderDraggingClasses = "bg-brand-indigo-50 border-brand-indigo-500";
    
    return (
        <div className="animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-700">{t('converter_title')}</h2>
                <p className="text-gray-500 mt-2">{t('converter_subtitle')}</p>
            </div>

            <label
                htmlFor="batch-file-upload"
                className={`${uploaderBaseClasses} ${isDragging ? uploaderDraggingClasses : uploaderIdleClasses}`}
                onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                    <ConverterIcon />
                    <p className="mb-2 text-sm font-semibold"><span className="text-brand-indigo-600">{t('uploader_click_to_upload')}</span> {t('uploader_drag_and_drop')}</p>
                    <p className="text-xs">{t('converter_uploader_subtitle')}</p>
                </div>
                <input id="batch-file-upload" type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleFileChange(e.target.files)} />
            </label>
            
            {files.length > 0 && (
                <div className="mt-6">
                    <h3 className="font-semibold text-gray-600 mb-2">{t('converter_files_to_convert', { count: files.length })}</h3>
                    <div className="max-h-32 overflow-y-auto bg-gray-50 p-3 rounded-lg border">
                        <ul className="space-y-2">
                            {files.map((file, index) => ( <li key={index} className="text-sm text-gray-800 truncate">{file.name} ({formatFileSize(file.size)})</li> ))}
                        </ul>
                    </div>
                </div>
            )}
            
            {error && <p className="text-red-500 text-center mt-6">{error}</p>}
            
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="w-full sm:w-auto">
                    <label htmlFor="format-select" className="sr-only">{t('converter_output_format')}</label>
                    <select
                        id="format-select"
                        value={targetFormat}
                        onChange={(e) => setTargetFormat(e.target.value as Format)}
                        disabled={isConverting}
                        className="block w-full px-4 py-3 text-base text-gray-700 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-brand-indigo-500 focus:border-brand-indigo-500"
                    >
                        <option value="image/webp">to WEBP</option>
                        <option value="image/jpeg">to JPEG</option>
                        <option value="image/png">to PNG</option>
                    </select>
                </div>
                <button
                    onClick={handleConvert}
                    disabled={files.length === 0 || isConverting}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 bg-brand-indigo-600 text-white font-bold text-lg rounded-full shadow-md hover:bg-brand-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-300 gap-2"
                >
                    {isConverting ? <><SpinnerIcon /> {t('converter_button_converting')}</> : t('converter_button_convert', { count: files.length })}
                </button>
            </div>

            {convertedFiles.length > 0 && (
                <div className="mt-10 border-t pt-8">
                    <h3 className="text-xl font-bold text-center text-gray-700 mb-6">{t('converter_complete_title')}</h3>
                    <div className="space-y-3">
                        {convertedFiles.map((file) => {
                            const sizeReduction = file.originalSize > file.newSize ? ((file.originalSize - file.newSize) / file.originalSize) * 100 : 0;
                            const sizeChangeColor = file.newSize < file.originalSize ? 'text-green-600' : 'text-red-600';
                            return (
                                <div key={file.blobUrl} className="bg-gray-50 p-4 rounded-lg flex items-center justify-between border border-gray-200">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 truncate">{file.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {formatFileSize(file.originalSize)} &rarr; {formatFileSize(file.newSize)}
                                            {sizeReduction > 0 && <span className={`ms-2 font-medium ${sizeChangeColor}`}>(-{sizeReduction.toFixed(1)}%)</span>}
                                        </p>
                                    </div>
                                    <a href={file.blobUrl} download={file.name} className="inline-flex items-center px-4 py-2 bg-white text-brand-indigo-700 font-semibold text-sm rounded-full shadow-sm hover:bg-gray-100 border border-gray-300 transition-colors gap-2 flex-shrink-0 ms-4">
                                        <DownloadIcon /> {t('result_download_button')}
                                    </a>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};