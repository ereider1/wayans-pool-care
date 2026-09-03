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
    <div className="mx-auto max-w-[620px]">
      <header className="rounded-2xl bg-navy px-5 py-5 text-white shadow-soft relative">
        <button 
          onClick={handleLogout}
          className="absolute top-5 right-5 text-xs font-bold bg-[#1d3557] hover:bg-[#2c4c70] px-3 py-1.5 rounded-lg transition-colors"
        >
          Sign Out
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue text-xl font-bold">≈</div>
          <span className="text-lg font-bold">Wayan's Pool Care</span>
        </div>
        <h1 className="mt-6 text-sm font-normal">Dashboard</h1>
        <p className="mt-1 text-2xl text-[#c9dfef]">Your Pools</p>
      </header>

      <div className="mt-6 flex gap-3">
        <button
          onClick={openAddForm}
          className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-blue font-bold tracking-wide text-white shadow-soft transition-colors hover:bg-blue/90"
        >
          + ADD NEW POOL
        </button>
      </div>

      {isFormOpen && (
        <div className="mt-4 rounded-2xl border border-[#d3e0eb] bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink mb-4">
            {editingPool ? 'Edit Pool' : 'Add New Pool'}
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
                className="focus-ring mt-2 min-h-11 w-full rounded-lg border border-[#c5d5e3] px-3 font-normal text-sm"
              />
            </label>

            <label className="block text-sm font-bold">
              Owner Name
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                className="focus-ring mt-2 min-h-11 w-full rounded-lg border border-[#c5d5e3] px-3 font-normal text-sm"
              />
            </label>

            <label className="block text-sm font-bold">
              Address
              <input
                type="text"
                placeholder="e.g. Canggu, Bali"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="focus-ring mt-2 min-h-11 w-full rounded-lg border border-[#c5d5e3] px-3 font-normal text-sm"
              />
            </label>

            <label className="block text-sm font-bold">
              Volume (Liters / Gallons)
              <input
                type="number"
                placeholder="e.g. 50000"
                value={volume}
                onChange={e => setVolume(e.target.value)}
                className="focus-ring mt-2 min-h-11 w-full rounded-lg border border-[#c5d5e3] px-3 font-normal text-sm"
              />
            </label>

            {error && <p role="alert" className="text-sm text-red-600 font-medium">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className="flex h-11 flex-1 items-center justify-center rounded-lg border border-[#c5d5e3] font-bold text-[#5d7390] text-sm hover:bg-[#f7fafc]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex h-11 flex-1 items-center justify-center rounded-lg bg-blue font-bold text-white text-sm hover:bg-blue/90 disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Save Pool'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {pools.length > 0 ? (
          pools.map(pool => (
            <div 
              key={pool.id} 
              className="rounded-2xl border border-[#d3e0eb] bg-white p-5 shadow-sm hover:shadow-md transition-all flex justify-between items-start"
            >
              <Link href={`/pool/${pool.id}`} className="block flex-1 pr-4">
                <h2 className="text-lg font-bold text-ink hover:text-blue hover:underline">{pool.name}</h2>
                {pool.owner_name && <p className="text-sm text-[#5d7390] mt-1">Owner: {pool.owner_name}</p>}
                {pool.address && <p className="text-xs text-[#9aa5b5] mt-1">{pool.address}</p>}
                {pool.volume && <p className="text-xs text-[#9aa5b5] mt-0.5">Volume: {Number(pool.volume).toLocaleString()}</p>}
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditForm(pool)}
                  className="p-2 text-xs font-bold text-blue hover:bg-[#ebf3fc] rounded-lg transition-colors"
                  aria-label={`Edit ${pool.name}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => deletePool(pool.id, pool.name)}
                  className="p-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label={`Delete ${pool.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#a6bed0] p-8 text-center text-[#5d7390]">
            <p>No pools found. Tap '+ ADD NEW POOL' above to add your first pool!</p>
          </div>
        )}
      </div>
    </div>
  );
}
