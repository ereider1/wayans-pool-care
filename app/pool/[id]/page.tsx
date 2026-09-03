import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function PoolDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: pool, error: poolError } = await supabase
    .from('pools')
    .select('*')
    .eq('id', id)
    .single();

  if (poolError || !pool) {
    return notFound();
  }

  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('*')
    .eq('pool_id', id)
    .order('visited_at', { ascending: false });

  return (
    <main className="min-h-screen px-4 py-4 sm:py-8 bg-[#f7fafc]">
      <div className="mx-auto max-w-[620px]">
        <Link href="/" className="mb-4 inline-block text-sm font-bold text-blue hover:underline">
          &larr; Back to Dashboard
        </Link>
        
        <header className="rounded-2xl bg-navy px-5 py-5 text-white shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue text-xl font-bold">≈</div>
            <span className="text-lg font-bold">{pool.name}</span>
          </div>
          {pool.owner_name && <h1 className="mt-6 text-sm font-normal">Owner: {pool.owner_name}</h1>}
          {pool.address && <p className="mt-1 text-sm text-[#c9dfef]">{pool.address}</p>}
        </header>

        <div className="mt-6">
          <Link href={`/pool/${pool.id}/visit`} className="flex min-h-14 w-full items-center justify-center rounded-xl bg-blue font-bold tracking-wide text-white shadow-soft">
            + NEW VISIT
          </Link>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold text-ink mb-4">Visit History</h2>
          <div className="space-y-4">
            {visits && visits.length > 0 ? (
              visits.map(visit => (
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
                  <div className="mt-3 flex gap-4 text-sm">
                    <div><span className="text-[#5d7390]">pH:</span> <span className="font-bold">{visit.ph}</span></div>
                    <div><span className="text-[#5d7390]">Cl:</span> <span className="font-bold">{visit.chlorine} ppm</span></div>
                  </div>
                  {visit.notes && <p className="mt-3 text-sm text-[#5d7390]">{visit.notes}</p>}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#a6bed0] p-8 text-center text-[#5d7390]">
                <p>No past visits found for this pool.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
