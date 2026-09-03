'use client';

import { useState } from 'react';

type MediaPreviewModalProps = {
  url: string;
  type: string; // 'image' or 'video'
  onClose: () => void;
};

export default function MediaPreviewModal({ url, type, onClose }: MediaPreviewModalProps) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 transition-opacity animate-fade-in"
      onClick={onClose}
    >
      <button 
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white text-2xl hover:bg-white/20 transition-colors"
        aria-label="Close preview"
      >
        ×
      </button>

      <div 
        className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl bg-neutral-900"
        onClick={e => e.stopPropagation()}
      >
        {type === 'video' ? (
          <video 
            src={url} 
            controls 
            autoPlay 
            className="max-h-[85vh] max-w-full object-contain mx-auto"
          />
        ) : (
          <img 
            src={url} 
            alt="Large preview" 
            className="max-h-[85vh] max-w-full object-contain mx-auto"
          />
        )}
      </div>
    </div>
  );
}
