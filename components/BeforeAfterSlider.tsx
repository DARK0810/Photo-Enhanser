import React, { useState } from 'react';
import { SliderHandleIcon } from './icons/SliderHandleIcon';
import { useTranslation } from '../i18n/context';

interface BeforeAfterSliderProps {
    beforeImage: string;
    afterImage: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ beforeImage, afterImage }) => {
    const [sliderValue, setSliderValue] = useState(50);
    const { t, language } = useTranslation();

    const clipPath = language === 'ar' 
        ? `polygon(100% 0, ${100 - sliderValue}% 0, ${100 - sliderValue}% 100%, 100% 100%)`
        : `polygon(0 0, ${sliderValue}% 0, ${sliderValue}% 100%, 0 100%)`;
        
    const handleLeft = language === 'ar' ? `calc(${100 - sliderValue}% - 3px)` : `calc(${sliderValue}% - 3px)`;

    return (
        <div className="relative w-full aspect-square overflow-hidden rounded-xl shadow-2xl border-4 border-white select-none group">
            {/* After Image (Bottom Layer) */}
            <img 
                src={afterImage} 
                alt={t('after')} 
                className="absolute inset-0 w-full h-full object-cover" 
                draggable={false}
            />

            {/* Before Image (Top Layer, clipped) */}
            <div 
                className="absolute inset-0 w-full h-full" 
                style={{ clipPath: clipPath }}
            >
                <img 
                    src={beforeImage} 
                    alt={t('before')} 
                    className="absolute inset-0 w-full h-full object-cover" 
                    draggable={false}
                />
            </div>
            
            {/* Labels */}
            <div className="absolute top-2 start-2 px-3 py-1 bg-black bg-opacity-50 text-white text-sm font-bold rounded-full pointer-events-none">
                {t('before')}
            </div>
            <div className="absolute top-2 end-2 px-3 py-1 bg-black bg-opacity-50 text-white text-sm font-bold rounded-full pointer-events-none">
                {t('after')}
            </div>

            {/* Slider Control */}
            <input
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="absolute inset-0 w-full h-full m-0 p-0 opacity-0 cursor-ew-resize z-20"
                aria-label={t('before_after_slider_label')}
            />
            
            {/* Visual Slider Handle */}
            <div
                className="absolute top-0 bottom-0 w-1.5 bg-white pointer-events-none z-10 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                style={{ left: handleLeft }}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-500">
                   <SliderHandleIcon />
                </div>
            </div>
        </div>
    );
};