'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/image';

type Chemical = { chemical: string; amount: string; unit: 'kg' | 'oz' | 'gal' | 'other' };
const initialChemical = (): Chemical => ({ chemical: '', amount: '', unit: 'kg' });

const today = new Intl.DateTimeFormat('en-US', { 
  weekday: 'long', 
  month: 'long', 
  day: 'numeric', 
  year: 'numeric' 
}).format(new Date());

type ChecklistItem = { id: string; label: string; emoji: string };

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'check_levels', label: 'Check Levels', emoji: '🧪' },
  { id: 'skim', label: 'Skim', emoji: '🕸️' },
  { id: 'vacuum', label: 'Vacuum', emoji: '🌀' },
  { id: 'brush', label: 'Brush', emoji: '🧹' },
  { id: 'empty_basket', label: 'Empty Basket', emoji: '🧺' },
  { id: 'backwash_filter', label: 'Backwash Filter', emoji: '🔄' },
  { id: 'added_chemicals', label: 'Added Chemicals', emoji: '⚡' },
];

function Section({ number, title, detail, children }: { number: string; title: string; detail?: string; children: React.ReactNode }) { 
  return (
    <section className="rounded-3xl border border-[#e2eaf1] bg-white p-6 shadow-[0_4px_12px_rgba(30,75,105,.02)] hover:shadow-[0_6px_18px_rgba(30,75,105,.04)] transition-shadow duration-300">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[17px] font-extrabold text-[#0f2942] flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue/10 text-xs font-black text-blue">{number}</span>
          {title}
        </h2>
        {detail && <span className="text-xs font-bold text-[#5d7390] uppercase tracking-wider">{detail}</span>}
      </div>
      {children}
    </section>
  ); 
}

function PhotoTile({ file, onRemove }: { file: File; onRemove: () => void }) { 
  const url = useMemo(() => URL.createObjectURL(file), [file]); 
  return (
    <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-[#b9ccdc] shadow-sm">
      {file.type.startsWith('video/') ? (
        <video src={url} aria-label="Selected pool service video" className="h-full w-full object-cover" muted playsInline />
      ) : (
        <img src={url} alt="Selected pool service photo" className="h-full w-full object-cover" />
      )}
      <button 
        type="button" 
        onClick={onRemove} 
        aria-label="Remove photo or video" 
        className="focus-ring absolute right-1.5 top-1.5 h-7 w-7 rounded-full bg-[#17233b]/80 backdrop-blur-sm text-sm text-white font-bold hover:bg-[#17233b] transition-colors"
      >
        ×
      </button>
    </div>
  ); 
}

export default function TechnicianForm({ poolId, poolName }: { poolId: string; poolName: string }) {
  const supabase = useMemo(() => createClient(), []); 
  const stripRef = useRef<HTMLInputElement>(null); 
  const generalRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => { 
    stripRef.current?.removeAttribute('capture'); 
  }, []);

  const [ph, setPh] = useState(''); 
  const [chlorine, setChlorine] = useState(''); 
  const [strip, setStrip] = useState<File | null>(null); 
  const [photos, setPhotos] = useState<File[]>([]); 
  const [chemicals, setChemicals] = useState<Chemical[]>([]); 
  const [notes, setNotes] = useState(''); 
  const [errors, setErrors] = useState<Record<string, string>>({}); 
  const [saving, setSaving] = useState(false); 
  const [saved, setSaved] = useState(false);

  // Checklist State
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    check_levels: false,
    skim: false,
    vacuum: false,
    brush: false,
    empty_basket: false,
    backwash_filter: false,
    added_chemicals: false,
  });

  const toggleChecklistItem = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const validate = () => { 
    const next: Record<string, string> = {}; 
    const p = Number(ph), c = Number(chlorine); 
    
    if (!ph || !Number.isFinite(p) || p < 0 || p > 14) {
      next.ph = 'Enter a pH between 0 and 14.'; 
    }
    if (!chlorine || !Number.isFinite(c) || c < 0) {
      next.chlorine = 'Enter a chlorine value of 0 or more.'; 
    }
    if (!strip) {
      next.strip = 'A test-strip photo is required.'; 
    }
    
    chemicals.forEach((item, i) => { 
      if ((item.chemical || item.amount) && (!item.chemical || !item.amount || Number(item.amount) < 0)) {
        next[`chemical-${i}`] = 'Add a name and valid amount.'; 
      }
    }); 

    // Checklist validation: Ensure all 7 checklist items are checked
    const allChecked = Object.values(checkedItems).every(val => val === true);
    if (!allChecked) {
      next.checklist = 'You must complete and check off all cleaning tasks before saving the visit.';
    }

    setErrors(next); 
    return Object.keys(next).length === 0; 
  };

  const handleStrip = async (file?: File) => { 
    if (file) setStrip(await compressImage(file)); 
  };

  const handleGeneral = async (files: FileList | null) => { 
    if (!files) return; 
    const media = await Promise.all(Array.from(files).map(file => compressImage(file))); 
    setPhotos(old => [...old, ...media]); 
  };

  const save = async () => { 
    if (!validate() || !strip) return; 
    setSaving(true); 
    setErrors({}); 
    let step = 'visit record'; 
    try {
      const status = Number(ph) < 7.2 || Number(ph) > 7.8 || Number(chlorine) < 1 || Number(chlorine) > 3 ? 'check' : 'normal';
      const visitId = crypto.randomUUID(); 
      
      const { error: visitError } = await supabase.from('visits').insert({ 
        id: visitId, 
        pool_id: poolId, 
        ph: Number(ph), 
        chlorine: Number(chlorine), 
        notes: notes.trim() || null, 
        status 
      }); 
      
      if (visitError) throw visitError;
      
      const all = [{ file: strip, type: 'test_strip' as const }, ...photos.map(file => ({ file, type: 'other' as const }))]; 
      const metadata: { visit_id: string; photo_type: string; storage_path: string }[] = [];
      
      step = 'photo upload';
      for (const { file, type } of all) { 
        const path = `${visitId}/${type}/${crypto.randomUUID()}.jpg`; 
        const { error } = await supabase.storage.from('pool-photos').upload(path, file, { 
          contentType: file.type || 'image/jpeg', 
          upsert: false 
        }); 
        if (error) throw error; 
        metadata.push({ visit_id: visitId, photo_type: type, storage_path: path }); 
      }
      
      step = 'photo record';
      if (metadata.length) { 
        const { error } = await supabase.from('visit_photos').insert(metadata); 
        if (error) throw error; 
      }
      
      step = 'chemical record';
      const validChemicals = chemicals.filter(item => item.chemical.trim() && item.amount); 
      if (validChemicals.length) { 
        const { error } = await supabase.from('visit_chemicals').insert(
          validChemicals.map(item => ({ 
            visit_id: visitId, 
            chemical: item.chemical.trim(), 
            amount: Number(item.amount), 
            unit: item.unit 
          }))
        ); 
        if (error) throw error; 
      }
      
      setSaved(true);
    } catch (error) { 
      console.error(error); 
      const detail = error instanceof Error ? error.message : (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string' ? error.message : 'Please try again.'); 
      setErrors({ form: `Could not save the ${step}. ${detail}` }); 
    } finally { 
      setSaving(false); 
    }
  };

  if (saved) {
    return (
      <main className="min-h-screen px-4 py-4 sm:py-8 bg-[#f7fafc]">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[620px] flex-col items-center justify-center rounded-3xl bg-white p-8 text-center shadow-soft border border-[#e2eaf1]">
          <div className="mb-6 flex h-18 w-16 items-center justify-center rounded-full bg-[#e3f7eb] text-4xl text-[#1b9453]">✓</div>
          <h1 className="text-3xl font-black text-ink">Visit Saved!</h1>
          <p className="mt-2 text-[#5d7390] font-semibold">Everything has been recorded successfully.</p>
          <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
            <a href={`/pool/${poolId}`} className="focus-ring flex min-h-14 items-center justify-center rounded-2xl bg-blue px-6 font-extrabold tracking-wide text-white shadow-soft hover:bg-blue/90 hover:scale-[1.01] active:scale-[0.99] transition-all">
              BACK TO POOL
            </a>
            <a href="/admin" className="focus-ring flex min-h-14 items-center justify-center rounded-2xl border border-[#c5d5e3] px-6 font-extrabold tracking-wide text-[#5d7390] hover:bg-[#f7fafc] transition-all">
              VIEW ALL VISITS (ADMIN)
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-4 sm:py-8 bg-[#f7fafc] pb-12">
      <div className="mx-auto max-w-[620px]">
        {/* Premium Gradient Header with Bottom Wave Curve */}
        <header className="rounded-3xl bg-gradient-to-br from-[#0c243c] via-[#0f3d59] to-[#195a75] px-6 py-8 text-white shadow-soft relative overflow-hidden pb-14">
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue text-xl font-bold shadow-soft">≈</div>
            <span className="text-xl font-extrabold tracking-tight">{poolName}</span>
          </div>
          
          <div className="mt-8">
            <span className="text-xs font-extrabold tracking-wider text-white/60 uppercase">Hello Wayan!</span>
            <p className="text-2xl font-black mt-1 leading-none tracking-tight">{today}</p>
          </div>

          {/* Dynamic Wave Shape Bottom */}
          <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0]">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block h-[22px] w-full fill-[#f7fafc]">
              <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" fill="#f7fafc"></path>
            </svg>
          </div>
        </header>

        <form onSubmit={e => { e.preventDefault(); void save(); }} className="mt-6 space-y-5">
          {/* Section 1: Water Test */}
          <Section number="1" title="Water Test">
            <div className="grid grid-cols-2 gap-2.5">
              <label className="rounded-2xl border border-[#c5d5e3] p-4 bg-slate-50/20 block cursor-pointer">
                <span className="block text-xs font-black text-[#5d7390] uppercase tracking-wider">pH</span>
                <input 
                  aria-label="pH" 
                  inputMode="decimal" 
                  type="number" 
                  min="0" 
                  max="14" 
                  step="0.1" 
                  value={ph} 
                  onChange={e => setPh(e.target.value)} 
                  className="focus-ring mt-2 w-full border-0 p-0 text-3xl font-extrabold text-ink bg-transparent outline-none" 
                  placeholder="7.4" 
                />
                <span className="mt-2 block text-[11px] font-bold text-[#5d7390]">Ideal 7.2 – 7.8</span>
              </label>
              
              <label className="rounded-2xl border border-[#c5d5e3] p-4 bg-slate-50/20 block cursor-pointer">
                <span className="block text-xs font-black text-[#5d7390] uppercase tracking-wider">Chlorine (ppm)</span>
                <input 
                  aria-label="Chlorine ppm" 
                  inputMode="decimal" 
                  type="number" 
                  min="0" 
                  step="0.1" 
                  value={chlorine} 
                  onChange={e => setChlorine(e.target.value)} 
                  className="focus-ring mt-2 w-full border-0 p-0 text-3xl font-extrabold text-ink bg-transparent outline-none" 
                  placeholder="2.0" 
                />
                <span className="mt-2 block text-[11px] font-bold text-[#5d7390]">Ideal 1.0 – 3.0</span>
              </label>
            </div>
            
            {(errors.ph || errors.chlorine) && (
              <p className="mt-3 text-sm font-bold text-red-600">{errors.ph || errors.chlorine}</p>
            )}
            
            <div className="mt-6 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#0f2942]">Test Results Photo</h3>
              <span className="text-[10px] font-extrabold text-[#5d7390] bg-[#edf2f6] px-2 py-0.5 rounded-full uppercase">required</span>
            </div>
            
            <input 
              ref={stripRef} 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              onChange={e => { void handleStrip(e.target.files?.[0]); }} 
            />
            
            {strip ? (
              <div className="relative mt-3 overflow-hidden rounded-2xl border border-[#a6bed0] shadow-sm">
                <img src={URL.createObjectURL(strip)} alt="Water test strip" className="h-48 w-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => setStrip(null)} 
                  className="absolute right-3 top-3 rounded-xl bg-[#17233b]/85 backdrop-blur-sm px-4 py-2 text-xs font-bold text-white hover:bg-[#17233b] transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button 
                type="button" 
                onClick={() => stripRef.current?.click()} 
                className="focus-ring mt-3 flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#91abc0] bg-[#f8fafc] hover:bg-[#edf3f8] transition-colors text-[#58758b]"
              >
                <span className="text-3xl">📷</span>
                <span className="mt-2 text-xs font-black uppercase tracking-wider">Take Test Strip Photo</span>
              </button>
            )}
            {errors.strip && <p className="mt-2 text-xs font-bold text-red-600">{errors.strip}</p>}
          </Section>

          {/* Section 2: Pool & Filter Photos */}
          <Section number="2" title="Pool & Filter Photos" detail={`${photos.length} ${photos.length === 1 ? 'item' : 'items'}`}>
            <input 
              ref={generalRef} 
              type="file" 
              accept="image/*,video/*" 
              capture="environment" 
              multiple 
              className="hidden" 
              onChange={e => { void handleGeneral(e.target.files); e.currentTarget.value = ''; }} 
            />
            
            {photos.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-3">
                {photos.map((file, i) => (
                  <PhotoTile 
                    key={`${file.name}-${i}`} 
                    file={file} 
                    onRemove={() => setPhotos(old => old.filter((_, index) => index !== i))} 
                  />
                ))}
              </div>
            )}
            
            <button 
              type="button" 
              onClick={() => generalRef.current?.click()} 
              className="focus-ring flex h-28 w-28 flex-col items-center justify-center rounded-2xl border border-dashed border-[#91abc0] bg-[#f8fafc] hover:bg-[#edf3f8] transition-colors text-[#58758b]"
            >
              <span className="text-3xl">⊙</span>
              <span className="mt-1 text-xs font-black uppercase tracking-wider">Add Media</span>
            </button>
            <p className="mt-3 text-xs text-[#5d7390] font-semibold">Take photos or videos of the pool, filters, or equipment.</p>
          </Section>

          {/* Section 3: Chemicals Added */}
          <Section number="3" title="Chemicals Added" detail="required">
            <div className="space-y-3">
              {chemicals.map((item, index) => (
                <div key={index} className="grid grid-cols-[minmax(0,110px)_minmax(0,1fr)_74px_32px] gap-2.5 sm:grid-cols-[minmax(0,1fr)_84px_84px_32px] items-center">
                  <input 
                    aria-label={`Chemical ${index + 1} name`} 
                    value={item.chemical} 
                    onChange={e => setChemicals(old => old.map((row, i) => i === index ? { ...row, chemical: e.target.value } : row))} 
                    placeholder="Chemical" 
                    className="focus-ring min-h-12 rounded-xl border border-[#c5d5e3] px-3 text-sm font-semibold text-ink outline-none" 
                  />
                  <input 
                    aria-label={`Chemical ${index + 1} amount`} 
                    type="number" 
                    min="0" 
                    step="0.1" 
                    value={item.amount} 
                    onChange={e => setChemicals(old => old.map((row, i) => i === index ? { ...row, amount: e.target.value } : row))} 
                    placeholder="Amount" 
                    className="focus-ring min-h-12 rounded-xl border border-[#c5d5e3] px-2 text-sm font-semibold text-ink outline-none" 
                  />
                  <select 
                    aria-label={`Chemical ${index + 1} unit`} 
                    value={item.unit} 
                    onChange={e => setChemicals(old => old.map((row, i) => i === index ? { ...row, unit: e.target.value as Chemical['unit'] } : row))} 
                    className="focus-ring min-h-12 rounded-xl border border-[#c5d5e3] bg-white px-2 text-sm font-bold text-ink outline-none"
                  >
                    <option>kg</option>
                    <option>oz</option>
                    <option>gal</option>
                    <option>other</option>
                  </select>
                  <button 
                    type="button" 
                    aria-label="Remove chemical" 
                    onClick={() => setChemicals(old => old.filter((_, i) => i !== index))} 
                    className="focus-ring text-2xl text-[#5d7390] font-bold hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                  {errors[`chemical-${index}`] && (
                    <p className="col-span-4 -mt-1.5 text-xs font-bold text-red-600">{errors[`chemical-${index}`]}</p>
                  )}
                </div>
              ))}
            </div>
            
            <button 
              type="button" 
              onClick={() => setChemicals(old => [...old, initialChemical()])} 
              className="focus-ring mt-4 min-h-10 font-extrabold text-blue text-sm hover:underline"
            >
              ＋ Add Chemical
            </button>
          </Section>

          {/* Section 4: Pool Cleaning Checklist (NEW SECTION) */}
          <Section number="4" title="Pool Cleaning" detail="Required checklist">
            <p className="text-xs text-[#5d7390] font-semibold mb-4">Select everything you did, then save.</p>
            <div className="space-y-2.5">
              {CHECKLIST_ITEMS.map(item => {
                const isChecked = checkedItems[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleChecklistItem(item.id)}
                    className="flex w-full items-center justify-between rounded-2xl border border-[#e2eaf1] bg-white p-4 shadow-sm hover:bg-slate-50/50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#ebf5fe] text-lg">
                        {item.emoji}
                      </div>
                      <span className="font-extrabold text-sm text-[#0f2942] group-hover:text-blue transition-colors">
                        {item.label}
                      </span>
                    </div>
                    
                    {/* Tick Circle Indicator */}
                    <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                      isChecked 
                        ? 'bg-[#52b197] border-[#52b197] text-white' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isChecked && (
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.checklist && (
              <p className="mt-3 text-xs font-bold text-red-600">{errors.checklist}</p>
            )}
          </Section>

          {/* Section 5: Additional Notes (Was 4) */}
          <Section number="5" title="Additional Notes" detail="optional">
            <textarea 
              aria-label="Additional notes" 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="Anything worth noting..." 
              rows={3} 
              className="focus-ring w-full resize-y rounded-2xl border border-[#c5d5e3] p-4 text-sm font-semibold outline-none" 
            />
          </Section>

          {errors.form && (
            <div role="alert" className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm font-bold text-red-700">
              {errors.form}
            </div>
          )}

          <button 
            type="submit" 
            disabled={saving} 
            className="focus-ring min-h-14 w-full rounded-2xl bg-blue font-extrabold tracking-wide text-white shadow-soft hover:bg-blue/90 disabled:cursor-wait disabled:opacity-60 hover:scale-[1.01] active:scale-[0.99] transition-all text-base"
          >
            {saving ? 'SAVING VISIT…' : 'SAVE VISIT'}
          </button>
        </form>
      </div>
    </main>
  );
}
