'use client';

import { useState } from 'react';
import MediaPreviewModal from './media-preview-modal';

type VisitChemical = {
  chemical: string;
  amount: number;
  unit: string;
};

type VisitPhoto = {
  id: string;
  photo_type: string;
  storage_path: string;
};

type Visit = {
  id: string;
  visited_at: string;
  ph: number;
  chlorine: number;
  notes: string | null;
  status: string;
  visit_chemicals: VisitChemical[];
  visit_photos: VisitPhoto[];
};

type PoolHistoryClientProps = {
  visits: Visit[];
  photoUrls: Record<string, string>;
};

export default function PoolHistoryClient({ visits, photoUrls }: PoolHistoryClientProps) {
  const [activeMedia, setActiveMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  const isVideo = (path: string) => {
    const p = path.toLowerCase();
    return p.endsWith('.mp4') || p.endsWith('.mov') || p.endsWith('.webm');
  };

  const openPreview = (path: string) => {
    const url = photoUrls[path];
    if (!url) return;
    setActiveMedia({
      url,
      type: isVideo(path) ? 'video' : 'image',
    });
  };

  return (
    <div className="space-y-4">
      {visits.map(visit => (
        <div key={visit.id} className="rounded-2xl border border-[#d3e0eb] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-bold text-ink">
              {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(visit.visited_at))}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              visit.status === 'normal' ? 'bg-[#e3f7eb] text-[#1b9453]' : 
              visit.status === 'check' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
            }`}>
              {visit.status.toUpperCase()}
            </span>
          </div>

          <div className="mt-3 flex gap-4 text-sm border-b border-[#edf2f6] pb-3">
            <div><span className="text-[#5d7390]">pH:</span> <span className="font-bold">{visit.ph}</span></div>
            <div><span className="text-[#5d7390]">Cl:</span> <span className="font-bold">{visit.chlorine} ppm</span></div>
          </div>

          {/* Chemicals Section */}
          {visit.visit_chemicals.length > 0 && (
            <div className="mt-3">
              <span className="text-xs font-bold text-[#5d7390] uppercase tracking-wide">Chemicals Added:</span>
              <ul className="mt-1 space-y-1">
                {visit.visit_chemicals.map((chem, idx) => (
                  <li key={idx} className="text-sm font-semibold text-[#1e293b]">
                    ✓ {chem.chemical} — {chem.amount} {chem.unit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Photos/Videos Section */}
          {visit.visit_photos.length > 0 && (
            <div className="mt-4">
              <span className="text-xs font-bold text-[#5d7390] uppercase tracking-wide">Media Entries:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {visit.visit_photos.map(photo => {
                  const url = photoUrls[photo.storage_path];
                  if (!url) return <div key={photo.id} className="h-16 w-16 animate-pulse rounded-lg bg-[#edf2f6]" />;

                  const video = isVideo(photo.storage_path);

                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => openPreview(photo.storage_path)}
                      className="relative h-16 w-16 overflow-hidden rounded-lg border border-[#b9ccdc] bg-[#edf2f6] hover:opacity-85 transition-opacity"
                    >
                      {video ? (
                        <div className="relative h-full w-full">
                          <video src={url} className="h-full w-full object-cover" muted />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <span className="text-white text-xs">▶</span>
                          </div>
                        </div>
                      ) : (
                        <img src={url} alt={photo.photo_type} className="h-full w-full object-cover" />
                      )}
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 py-0.5 text-[8px] font-bold text-white uppercase text-center truncate">
                        {photo.photo_type.replace('_', ' ')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {visit.notes && (
            <div className="mt-4 border-t border-[#edf2f6] pt-3">
              <span className="text-xs font-bold text-[#5d7390] uppercase tracking-wide">Notes:</span>
              <p className="mt-1 text-sm text-[#334155] italic">"{visit.notes}"</p>
            </div>
          )}
        </div>
      ))}

      {activeMedia && (
        <MediaPreviewModal
          url={activeMedia.url}
          type={activeMedia.type}
          onClose={() => setActiveMedia(null)}
        />
      )}
    </div>
  );
}
