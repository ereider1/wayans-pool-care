'use client';

import { useState } from 'react';
import MediaPreviewModal from '@/components/media-preview-modal';

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
  pools: { name: string; owner_name: string | null; address: string | null } | null;
  visit_chemicals: VisitChemical[];
  visit_photos: VisitPhoto[];
};

type ShareVisitClientProps = {
  visit: Visit;
  photoUrls: Record<string, string>;
};

export default function ShareVisitClient({ visit, photoUrls }: ShareVisitClientProps) {
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

  // Range indicators
  const isPhIdeal = visit.ph >= 7.2 && visit.ph <= 7.8;
  const isChlorineIdeal = visit.chlorine >= 1.0 && visit.chlorine <= 3.0;

  return (
    <div className="mx-auto max-w-[620px] bg-white min-h-screen shadow-md rounded-b-3xl pb-12">
      {/* Header */}
      <header className="bg-navy px-6 py-8 text-white text-center rounded-b-3xl shadow-soft">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue text-2xl font-bold mx-auto mb-3">≈</div>
        <h1 className="text-xl font-bold tracking-wide">Wayan's Pool Care</h1>
        <p className="text-[#c9dfef] text-sm mt-1">Professional Pool Maintenance Service</p>
      </header>

      {/* Report Info */}
      <div className="px-6 py-6 border-b border-[#edf2f6]">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue bg-[#ebf3fc] px-2.5 py-1 rounded-full">
              Pool Report
            </span>
            <h2 className="text-2xl font-extrabold text-ink mt-2">
              {visit.pools?.name || 'Your Pool'}
            </h2>
            {visit.pools?.owner_name && (
              <p className="text-sm text-[#5d7390] mt-0.5">Valued Guest / Owner: {visit.pools.owner_name}</p>
            )}
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-ink">
              {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(visit.visited_at))}
            </span>
            <p className="text-xs text-[#5d7390] mt-0.5">
              {new Intl.DateTimeFormat('en-US', { timeStyle: 'short' }).format(new Date(visit.visited_at))}
            </p>
          </div>
        </div>
      </div>

      {/* Water Parameters */}
      <div className="px-6 py-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#5d7390] mb-4">Water Parameters</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-2xl border ${isPhIdeal ? 'bg-[#e3f7eb]/50 border-[#1b9453]/20' : 'bg-[#fff4d6]/50 border-yellow-200'}`}>
            <span className="text-xs font-bold text-[#5d7390] block">pH Level</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-ink">{visit.ph}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isPhIdeal ? 'bg-[#1b9453]/20 text-[#1b9453]' : 'bg-yellow-200 text-yellow-800'}`}>
                {isPhIdeal ? 'IDEAL' : 'ADJUSTED'}
              </span>
            </div>
            <span className="text-[10px] text-[#5d7390] mt-2 block">Ideal Range: 7.2 – 7.8</span>
          </div>

          <div className={`p-4 rounded-2xl border ${isChlorineIdeal ? 'bg-[#e3f7eb]/50 border-[#1b9453]/20' : 'bg-[#fff4d6]/50 border-yellow-200'}`}>
            <span className="text-xs font-bold text-[#5d7390] block">Chlorine Level</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-ink">{visit.chlorine}</span>
              <span className="text-sm font-bold text-[#5d7390]">ppm</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isChlorineIdeal ? 'bg-[#1b9453]/20 text-[#1b9453]' : 'bg-yellow-200 text-yellow-800'}`}>
                {isChlorineIdeal ? 'IDEAL' : 'ADJUSTED'}
              </span>
            </div>
            <span className="text-[10px] text-[#5d7390] mt-2 block">Ideal Range: 1.0 – 3.0</span>
          </div>
        </div>
      </div>

      {/* Chemicals Added */}
      {visit.visit_chemicals.length > 0 && (
        <div className="px-6 py-6 border-t border-[#edf2f6]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#5d7390] mb-3">Chemical Dosage Added</h3>
          <div className="space-y-2">
            {visit.visit_chemicals.map((chem, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[#f8fafc] px-4 py-3 rounded-xl border border-[#edf2f6]">
                <span className="font-semibold text-[#1e293b] text-sm">{chem.chemical}</span>
                <span className="font-black text-blue text-sm">{chem.amount} {chem.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {visit.notes && (
        <div className="px-6 py-6 border-t border-[#edf2f6]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#5d7390] mb-2">Service Technician Notes</h3>
          <p className="text-sm text-[#334155] leading-relaxed bg-[#f8fafc] p-4 rounded-xl border border-[#edf2f6] italic">
            "{visit.notes}"
          </p>
        </div>
      )}

      {/* Media Gallery */}
      {visit.visit_photos.length > 0 && (
        <div className="px-6 py-6 border-t border-[#edf2f6]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#5d7390] mb-3">Water & Pool Inspection Media</h3>
          <div className="grid grid-cols-2 gap-3">
            {visit.visit_photos.map(photo => {
              const url = photoUrls[photo.storage_path];
              if (!url) return <div key={photo.id} className="h-40 animate-pulse rounded-2xl bg-[#edf2f6]" />;

              const video = isVideo(photo.storage_path);

              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => openPreview(photo.storage_path)}
                  className="relative h-40 w-full overflow-hidden rounded-2xl border border-[#b9ccdc] bg-[#edf2f6] hover:opacity-90 transition-opacity"
                >
                  {video ? (
                    <div className="relative h-full w-full bg-black">
                      <video src={url} className="h-full w-full object-cover" muted />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="text-white text-3xl">▶</span>
                      </div>
                    </div>
                  ) : (
                    <img src={url} alt={photo.photo_type} className="h-full w-full object-cover" />
                  )}
                  <span className="absolute bottom-2 left-2 bg-black/75 px-3 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
                    {photo.photo_type.replace('_', ' ')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="mt-8 px-6 text-center">
        <div className="h-[1px] bg-[#edf2f6] w-full mb-6"></div>
        <p className="text-xs text-[#9aa5b5]">Thank you for choosing Wayan's Pool Care!</p>
        <p className="text-[10px] text-[#b9ccdc] mt-1">Report Generated Automatically • Secure & Private</p>
      </div>

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
