import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function Dashboard() {
  const supabase = await createClient();

  const { data: pools, error } = await supabase
    .from('pools')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pools:', error);
  }

  return (
    <main className="min-h-screen px-4 py-4 sm:py-8 bg-[#f7fafc]">
      <div className="mx-auto max-w-[620px]">
        <header className="rounded-2xl bg-navy px-5 py-5 text-white shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue text-xl font-bold">≈</div>
            <span className="text-lg font-bold">Wayan's Pool Care</span>
          </div>
          <h1 className="mt-6 text-sm font-normal">Dashboard</h1>
          <p className="mt-1 text-2xl text-[#c9dfef]">Your Pools</p>
        </header>

        <div className="mt-6 space-y-4">
          {pools && pools.length > 0 ? (
            pools.map(pool => (
              <Link 
                key={pool.id} 
                href={`/pool/${pool.id}`}
                className="block rounded-2xl border border-[#d3e0eb] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <h2 className="text-lg font-bold text-ink">{pool.name}</h2>
                {pool.owner_name && <p className="text-sm text-[#5d7390] mt-1">{pool.owner_name}</p>}
                {pool.address && <p className="text-xs text-[#9aa5b5] mt-1">{pool.address}</p>}
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#a6bed0] p-8 text-center text-[#5d7390]">
              <p>No pools found. Please add a pool in the Supabase database.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
