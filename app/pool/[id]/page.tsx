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
        
        <header className="rounded-2xl bg-navy px-5 py-5 text-white shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue text-xl font-bold">≈</div>
            <span className="text-lg font-bold">{pool.name}</span>
          </div>
          {pool.owner_name && <h1 className="mt-6 text-sm font-normal">Owner: {pool.owner_name}</h1>}
          {pool.address && <p className="mt-1 text-sm text-[#c9dfef]">{pool.address}</p>}
        </header>

        <div className="mt-6">
          <Link href={`/pool/${pool.id}/visit`} className="flex min-h-14 w-full items-center justify-center rounded-xl bg-blue font-bold tracking-wide text-white shadow-soft hover:bg-blue/90 transition-colors">
            + NEW VISIT
          </Link>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold text-ink mb-4">Visit History</h2>
          {visits.length > 0 ? (
            <PoolHistoryClient visits={visits as any} photoUrls={photoUrls} />
          ) : (
            <div className="rounded-2xl border border-dashed border-[#a6bed0] p-8 text-center text-[#5d7390]">
              <p>No past visits found for this pool.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
