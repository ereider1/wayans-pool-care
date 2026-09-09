'use client';

import { useState } from 'react';
import MediaPreviewModal from './media-preview-modal';
import * as htmlToImage from 'html-to-image';

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
  pools?: { name: string } | null;
  visit_chemicals: VisitChemical[];
  visit_photos: VisitPhoto[];
};

type PoolHistoryClientProps = {
  visits: Visit[];
  photoUrls: Record<string, string>;
  poolName?: string; // Optional parent pool name
};

export default function PoolHistoryClient({ visits, photoUrls, poolName }: PoolHistoryClientProps) {
  const [activeMedia, setActiveMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [generatedPngs, setGeneratedPngs] = useState<Record<string, string>>({});
  const [copyingId, setCopyingId] = useState<string | null>(null);

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

  const handleShare = async (visit: Visit) => {
    const finalPoolName = poolName || visit.pools?.name || 'Pool';
    const dateStr = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(visit.visited_at));
    const shareUrl = `${window.location.origin}/share/visit/${visit.id}`;
    const text = `≈ Wayan's Pool Care\n\nService report for ${finalPoolName} on ${dateStr}.\npH: ${visit.ph}\nChlorine: ${visit.chlorine} ppm\n\nView details and photos here: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pool Report - ${finalPoolName}`,
          text: text,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: Copy link and open WhatsApp
      await navigator.clipboard.writeText(shareUrl);
      const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    }
  };

  const handleExportPng = async (visit: Visit) => {
    const cardElement = document.getElementById(`export-card-${visit.id}`);
    if (!cardElement) return;

    setExportingId(visit.id);
    try {
      // Generate high-resolution PNG on-the-fly
      const dataUrl = await htmlToImage.toPng(cardElement, {
        backgroundColor: '#ffffff',
        style: {
          borderRadius: '0',
          padding: '24px',
        },
        pixelRatio: 2, // Double pixel ratio for retina-ready high quality!
        cacheBust: true,
      });

      setGeneratedPngs(prev => ({
        ...prev,
        [visit.id]: dataUrl
      }));
    } catch (err) {
      console.error('Error generating PNG image:', err);
      alert('Failed to generate PNG image. Please try again.');
    } finally {
      setExportingId(null);
    }
  };

  const handleCopyPng = async (visitId: string, dataUrl: string) => {
    setCopyingId(visitId);
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        })
      ]);
      alert('Success! Image copied to clipboard. You can now open WhatsApp and paste it directly into your chat.');
    } catch (err) {
      console.error('Error copying image to clipboard:', err);
      alert('Your browser or device does not support copying images directly from web canvas. Please use "Share / Save Image" or download instead!');
    } finally {
      setCopyingId(null);
    }
  };

  const handleSharePngFile = async (visit: Visit, dataUrl: string) => {
    const finalPoolName = poolName || visit.pools?.name || 'Pool';
    const dateStr = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(visit.visited_at));

    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `pool-report-${visit.id}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Pool Report - ${finalPoolName}`,
          text: `Service report for ${finalPoolName} on ${dateStr}`,
        });
      } else {
        // Fallback if files can't be shared via Web Share API
        const link = document.createElement('a');
        link.download = `pool-report-${finalPoolName.replace(/\s+/g, '-').toLowerCase()}-${visit.id.slice(0, 8)}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Error sharing PNG file:', err);
    }
  };

  return (
    <div className="space-y-6">
      {visits.map(visit => (
        <div key={visit.id} className="rounded-3xl border border-[#e2eaf1] bg-white shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
          
          {/* This wrapper div is exactly what gets captured by html-to-image */}
          <div id={`export-card-${visit.id}`} className="p-6 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-[#0f2942]">
                {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(visit.visited_at))}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                visit.status === 'normal' ? 'bg-[#e3f7eb] text-[#1b9453]' : 
                visit.status === 'check' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {visit.status.toUpperCase()}
              </span>
            </div>

            {/* High-fidelity side-by-side stats blocks */}
            <div className="mt-4 grid grid-cols-2 gap-3 border-b border-[#f2f6fa] pb-4">
              <div className="rounded-2xl bg-[#ebf5fe] p-3 text-center border border-[#d0e3fc]">
                <span className="block text-[10px] font-extrabold text-[#4c7397] uppercase tracking-wider">pH Level</span>
                <span className="text-2xl font-black text-blue">{visit.ph}</span>
                <span className="block text-[9px] font-bold text-[#5d7390] mt-0.5">
                  {visit.ph < 7.2 || visit.ph > 7.8 ? '⚠️ Out of Range' : '✨ Ideal Range'}
                </span>
              </div>
              <div className="rounded-2xl bg-[#e3f7eb] p-3 text-center border border-[#cbeedd]">
                <span className="block text-[10px] font-extrabold text-[#207a44] uppercase tracking-wider">Chlorine</span>
                <span className="text-2xl font-black text-[#1b9453]">{visit.chlorine} <span className="text-xs font-bold">ppm</span></span>
                <span className="block text-[9px] font-bold text-[#207a44]/85 mt-0.5">
                  {visit.chlorine < 1.0 || visit.chlorine > 3.0 ? '⚠️ Out of Range' : '✨ Ideal Range'}
                </span>
              </div>
            </div>

            {/* Chemicals Section */}
            {visit.visit_chemicals.length > 0 && (
              <div className="mt-4 border-b border-[#f2f6fa] pb-4">
                <span className="text-xs font-extrabold text-[#5d7390] uppercase tracking-wider">Chemicals Added</span>
                <ul className="mt-2 space-y-1.5">
                  {visit.visit_chemicals.map((chem, idx) => (
                    <li key={idx} className="inline-flex items-center gap-2 mr-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-1.5 text-xs font-bold text-[#1e293b]">
                      <span className="text-blue">✓</span> {chem.chemical} — {chem.amount} {chem.unit}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Photos/Videos Section */}
            {visit.visit_photos.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-extrabold text-[#5d7390] uppercase tracking-wider">Media Entries</span>
                <div className="mt-2 flex flex-wrap gap-2.5">
                  {visit.visit_photos.map(photo => {
                    const url = photoUrls[photo.storage_path];
                    if (!url) return <div key={photo.id} className="h-16 w-16 animate-pulse rounded-2xl bg-[#edf2f6]" />;

                    const video = isVideo(photo.storage_path);

                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => openPreview(photo.storage_path)}
                        className="relative h-16 w-16 overflow-hidden rounded-2xl border border-[#b9ccdc] bg-[#edf2f6] hover:opacity-85 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
                        data-html2canvas-ignore="true" // Optional instruction to hide interactive preview buttons in PNG captures
                      >
                        {video ? (
                          <div className="relative h-full w-full">
                            <video src={url} className="h-full w-full object-cover" muted />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <span className="text-white text-xs">▶</span>
                            </div>
                          </div>
                        ) : (
                          <img src={url} alt={photo.photo_type} crossOrigin="anonymous" className="h-full w-full object-cover" />
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
              <div className="mt-4 border-t border-[#f2f6fa] pt-3 pb-1">
                <span className="text-xs font-extrabold text-[#5d7390] uppercase tracking-wider">Notes</span>
                <p className="mt-1.5 text-sm text-[#475569] italic font-medium bg-slate-50/50 rounded-xl p-3 border border-slate-100/50">
                  "{visit.notes}"
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons Section (Excluded from PNG capture) */}
          <div className="p-5 border-t border-[#f2f6fa] bg-slate-50/15">
            <button 
              type="button"
              disabled={exportingId === visit.id}
              onClick={() => handleExportPng(visit)}
              className="flex w-full items-center justify-center text-[17px] font-bold text-white bg-[#4baa55] hover:bg-[#3e9347] px-5 py-4 rounded-2xl transition-colors duration-200 disabled:opacity-60 shadow-sm"
            >
              {exportingId === visit.id ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Preparing Report...
                </span>
              ) : (
                'Share Report'
              )}
            </button>
          </div>

          {/* Dynamic Generated PNG Preview & Download Area */}
          {generatedPngs[visit.id] && (
            <div className="m-5 mt-0 p-4 rounded-3xl bg-neutral-50 border border-dashed border-neutral-200 flex items-center gap-4 animate-fade-in">
              <div className="relative h-20 w-16 overflow-hidden rounded-2xl border border-neutral-200 bg-white flex-shrink-0">
                <img 
                  src={generatedPngs[visit.id]} 
                  alt="Generated report preview" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-neutral-800">PNG Ready!</p>
                <p className="text-[10px] text-[#5d7390] mt-0.5 truncate">Click below to save or share as an image file.</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleSharePngFile(visit, generatedPngs[visit.id])}
                    className="text-[10px] font-black bg-blue text-white px-3 py-2 rounded-xl hover:bg-blue/90"
                  >
                    Share / Save
                  </button>
                  <button
                    disabled={copyingId === visit.id}
                    onClick={() => handleCopyPng(visit.id, generatedPngs[visit.id])}
                    className="text-[10px] font-black bg-neutral-800 text-white px-3 py-2 rounded-xl hover:bg-neutral-900 disabled:opacity-65"
                  >
                    {copyingId === visit.id ? 'Copying...' : 'Copy Image 📋'}
                  </button>
                  <a
                    href={generatedPngs[visit.id]}
                    download={`pool-report-${(poolName || 'Pool').replace(/\s+/g, '-').toLowerCase()}-${visit.id.slice(0, 8)}.png`}
                    className="text-[10px] font-black bg-white border border-neutral-300 text-neutral-700 px-3 py-2 rounded-xl hover:bg-neutral-100 text-center"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => setGeneratedPngs(prev => {
                      const copy = { ...prev };
                      delete copy[visit.id];
                      return copy;
                    })}
                    className="text-[10px] font-bold text-neutral-500 hover:text-neutral-800 px-1.5"
                  >
                    × Close
                  </button>
                </div>
              </div>
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
