import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PoolHistoryClient from '@/components/pool-history-client';

export default async function PoolDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch pool data
  const { data: pool, error: poolError } = await supabase
    .from('pools')
    .select('*')
    .eq('id', id)
    .single();

  if (poolError || !pool) {
    return notFound();
  }

  // Fetch visits with chemicals and photos
  const { data: visitsData, error: visitsError } = await supabase
    .from('visits')
    .select('*, visit_chemicals(chemical,amount,unit), visit_photos(id,photo_type,storage_path)')
    .eq('pool_id', id)
    .order('visited_at', { ascending: false });

  const visits = visitsData || [];

  // Generate signed URLs for all visit photos
  const photoUrls: Record<string, string> = {};
  const paths = visits.flatMap(visit => visit.visit_photos?.map((photo: any) => photo.storage_path) || []);
  
  if (paths.length > 0) {
    const { data: signed, error: signedError } = await supabase
      .storage
      .from('pool-photos')
      .createSignedUrls(paths, 3600);

    if (!signedError && signed) {
      signed.forEach((item, index) => {
        if (item.signedUrl) {
          photoUrls[paths[index]] = item.signedUrl;
        }
      });
    } else if (signedError) {
      console.error('Error generating signed URLs:', signedError);
    }
  }

  return (
    <main className="min-h-screen px-4 py-4 sm:py-8 bg-[#f7fafc]">
      <div className="mx-auto max-w-[620px]">
        <Link href="/" className="mb-4 inline-block text-sm font-bold text-blue hover:underline">
          &larr; Back to Dashboard
        </Link>
        
        {/* Premium Gradient Header with Bottom Wave Curve */}
        <header className="rounded-3xl bg-gradient-to-br from-[#0c243c] via-[#0f3d59] to-[#195a75] px-6 py-8 text-white shadow-soft relative overflow-hidden pb-14">
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue text-xl font-bold shadow-soft">≈</div>
            <span className="text-xl font-extrabold tracking-tight">{pool.name}</span>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {pool.owner_name && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm border border-white/10">
                👤 Owner: {pool.owner_name}
              </span>
            )}
            {pool.volume && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm border border-white/10">
                💧 Volume: {Number(pool.volume).toLocaleString()} Gal
              </span>
            )}
            {pool.address && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm border border-white/10">
                📍 {pool.address}
              </span>
            )}
          </div>

          {/* Dynamic Wave Shape Bottom */}
          <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0]">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block h-[22px] w-full fill-[#f7fafc]">
              <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" fill="#f7fafc"></path>
            </svg>
          </div>
        </header>

        <div className="mt-6">
          <Link href={`/pool/${pool.id}/visit`} className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-blue font-extrabold tracking-wide text-white shadow-soft hover:bg-blue/90 hover:scale-[1.01] active:scale-[0.99] transition-all text-base">
            + NEW VISIT
          </Link>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-black text-ink mb-4">Visit History</h2>
          {visits.length > 0 ? (
            <PoolHistoryClient visits={visits as any} photoUrls={photoUrls} />
          ) : (
            <div className="rounded-3xl border border-dashed border-[#a6bed0] p-10 text-center text-[#5d7390] bg-white">
              <div className="text-4xl mb-3">📋</div>
              <p className="font-semibold text-sm">No past visits found.</p>
              <p className="text-xs text-[#9aa5b5] mt-1">Tap '+ NEW VISIT' above to log your first visit!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
