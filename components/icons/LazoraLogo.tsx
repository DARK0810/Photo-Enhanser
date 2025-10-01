import React from 'react';

export const LazoraLogo: React.FC<{ className?: string }> = ({ className = "h-8 w-auto" }) => (
    <svg className={className} viewBox="0 0 125 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="Lazora">
        <text x="0" y="25" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" fontSize="28" fontWeight="600" letterSpacing="0.5">
            Lazora
        </text>
    </svg>
);
