'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type Pool = {
  id: string;
  name: string;
  owner_name: string | null;
  address: string | null;
  volume: number | null;
  created_at: string;
};

export default function DashboardClient({ initialPools }: { initialPools: Pool[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [pools, setPools] = useState<Pool[]>(initialPools);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPool, setEditingPool] = useState<Pool | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [address, setAddress] = useState('');
  const [volume, setVolume] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const openAddForm = () => {
    setEditingPool(null);
    setName('');
    setOwnerName('');
    setAddress('');
    setVolume('');
    setError('');
    setIsFormOpen(true);
  };

  const openEditForm = (pool: Pool) => {
    setEditingPool(pool);
    setName(pool.name);
    setOwnerName(pool.owner_name || '');
    setAddress(pool.address || '');
    setVolume(pool.volume?.toString() || '');
    setError('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingPool(null);
  };

  const savePool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Pool name is required.');
      return;
    }

    setLoading(true);
    setError('');

    const poolData = {
      name: name.trim(),
      owner_name: ownerName.trim() || null,
      address: address.trim() || null,
      volume: volume ? Number(volume) : null,
    };

    try {
      if (editingPool) {
        // Update
        const { data, error } = await supabase
          .from('pools')
          .update(poolData)
          .eq('id', editingPool.id)
          .select()
          .single();

        if (error) throw error;
        setPools(prev => prev.map(p => (p.id === editingPool.id ? data : p)));
      } else {
        // Insert
        const { data, error } = await supabase
          .from('pools')
          .insert(poolData)
          .select()
          .single();

        if (error) throw error;
        setPools(prev => [data, ...prev]);
      }
      closeForm();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to save pool.');
    } finally {
      setLoading(false);
    }
  };

  const deletePool = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all visit records for this pool.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pools')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPools(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to delete pool.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-[620px] pb-12">
      {/* Premium Gradient Header with Bottom Wave Curve */}
      <header className="rounded-3xl bg-gradient-to-br from-[#0c243c] via-[#0f3d59] to-[#195a75] px-6 py-8 text-white shadow-soft relative overflow-hidden pb-14">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <button 
          onClick={handleLogout}
          className="absolute top-6 right-6 text-xs font-bold bg-[#14364e] hover:bg-[#1b4b6b] px-3.5 py-2 rounded-xl transition-all border border-white/10"
        >
          Sign Out
        </button>
        
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue text-xl font-bold shadow-soft">≈</div>
          <span className="text-xl font-extrabold tracking-tight">Wayan's Pool Care</span>
        </div>
        
        <div className="mt-8">
          <span className="text-xs font-extrabold tracking-wider text-white/60 uppercase">Overview</span>
          <h1 className="text-3xl font-black mt-1 leading-none tracking-tight">Your Pools</h1>
        </div>

        {/* Dynamic Wave Shape Bottom */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block h-[22px] w-full fill-[#f7fafc]">
            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" fill="#f7fafc"></path>
          </svg>
        </div>
      </header>

      {/* Visual highlights inspired by reference style */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Streak card (Mint green) */}
        <div className="bg-[#e2f3ec] text-[#1b9453] rounded-3xl p-5 shadow-sm border border-[#c3ebdb] relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#12723c] opacity-80">STREAK</span>
              <span className="text-[9px] bg-[#1b9453] text-white px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
            </div>
            <h3 className="font-black text-lg mt-2 text-[#0f6838]">5 Pools on Streak!</h3>
            <p className="text-xs mt-1 text-[#1c7b46] font-semibold leading-relaxed">Great job! Test all pools to maintain your perfect streak.</p>
          </div>
          <div className="absolute right-3 bottom-1 text-5xl opacity-20 pointer-events-none">🎉</div>
        </div>

        {/* Info/Warning card (Soft amber) */}
        <div className="bg-[#fff4e0] text-[#b45309] rounded-3xl p-5 shadow-sm border border-[#ffe6ca] relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#b45309] opacity-80">FORECAST</span>
              <span className="text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">WEATHER</span>
            </div>
            <h3 className="font-black text-lg mt-2 text-[#78350f]">85° & Sunny</h3>
            <p className="text-xs mt-1 text-[#9a3412] font-semibold leading-relaxed">Perfect weather for pool service. UV levels are moderate today.</p>
          </div>
          <div className="absolute right-3 bottom-1 text-5xl opacity-20 pointer-events-none">☀️</div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={openAddForm}
          className="flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-blue font-extrabold tracking-wide text-white shadow-soft transition-all hover:bg-blue/90 hover:scale-[1.01] active:scale-[0.99] text-base"
        >
          + ADD NEW POOL
        </button>
      </div>

      {isFormOpen && (
        <div className="mt-4 rounded-3xl border border-[#d3e0eb] bg-white p-6 shadow-soft animate-fade-in">
          <h2 className="text-lg font-black text-ink mb-4">
            {editingPool ? '✏️ Edit Pool Details' : '🏊 Add New Pool'}
          </h2>
          <form onSubmit={savePool} className="space-y-4">
            <label className="block text-sm font-bold">
              Pool Name *
              <input
                required
                type="text"
                placeholder="e.g. Villa Asri Pool"
                value={name}
                onChange={e => setName(e.target.value)}
                className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-[#c5d5e3] px-3 font-normal text-sm"
              />
            </label>

            <label className="block text-sm font-bold">
              Owner Name
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-[#c5d5e3] px-3 font-normal text-sm"
              />
            </label>

            <label className="block text-sm font-bold">
              Address
              <input
                type="text"
                placeholder="e.g. Canggu, Bali"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-[#c5d5e3] px-3 font-normal text-sm"
              />
            </label>

            <label className="block text-sm font-bold">
              Volume (Liters / Gallons)
              <input
                type="number"
                placeholder="e.g. 50000"
                value={volume}
                onChange={e => setVolume(e.target.value)}
                className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-[#c5d5e3] px-3 font-normal text-sm"
              />
            </label>

            {error && <p role="alert" className="text-sm text-red-600 font-medium">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className="flex h-12 flex-1 items-center justify-center rounded-xl border border-[#c5d5e3] font-bold text-[#5d7390] text-sm hover:bg-[#f7fafc]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 flex-1 items-center justify-center rounded-xl bg-blue font-bold text-white text-sm hover:bg-blue/90 disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Save Pool'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pools List styled like tasks from reference screen */}
      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-black text-ink mb-2">Registered Pools</h2>
        {pools.length > 0 ? (
          pools.map(pool => (
            <div 
              key={pool.id} 
              className="rounded-3xl border border-[#e2eaf1] bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 relative overflow-hidden"
            >
              {/* Cute Ripple Logo Circle on the Left */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#ebf5fe] text-blue text-xl font-extrabold shadow-inner">
                ≈
              </div>

              {/* Pool details / metadata */}
              <div className="flex-1 min-w-0">
                <Link href={`/pool/${pool.id}`} className="block group">
                  <h3 className="text-[17px] font-extrabold text-[#0f2942] group-hover:text-blue group-hover:underline leading-snug">
                    {pool.name}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {pool.owner_name && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[10px] font-bold text-[#475569]">
                        👤 {pool.owner_name}
                      </span>
                    )}
                    {pool.volume && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#ebf5fe] px-2.5 py-0.5 text-[10px] font-bold text-blue">
                        💧 {Number(pool.volume).toLocaleString()} Gal
                      </span>
                    )}
                    {pool.address && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf2f2] px-2.5 py-0.5 text-[10px] font-bold text-red-600 truncate max-w-[160px]" title={pool.address}>
                        📍 {pool.address.split(',')[0]}
                      </span>
                    )}
                  </div>
                </Link>
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => openEditForm(pool)}
                  className="flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold text-blue hover:bg-[#ebf3fc] border border-transparent hover:border-[#b9ccdc] transition-all"
                  aria-label={`Edit ${pool.name}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => deletePool(pool.id, pool.name)}
                  className="flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                  aria-label={`Delete ${pool.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-[#a6bed0] p-10 text-center text-[#5d7390] bg-white">
            <div className="text-4xl mb-3">🏊‍♂️</div>
            <p className="font-medium text-sm">No pools found.</p>
            <p className="text-xs text-[#9aa5b5] mt-1">Tap '+ ADD NEW POOL' above to add your first pool!</p>
          </div>
        )}
      </div>
    </div>
  );
}
