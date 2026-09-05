import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ShareVisitClient from '@/components/share-visit-client';

export default async function SharedVisitReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch visit along with pool, chemicals, and photos
  const { data: visit, error } = await supabase
    .from('visits')
    .select('*, pools(name, owner_name, address), visit_chemicals(chemical,amount,unit), visit_photos(id,photo_type,storage_path)')
    .eq('id', id)
    .single();

  if (error || !visit) {
    return notFound();
  }

  // Handle pools if array or single object
  const formattedVisit = {
    ...visit,
    pools: Array.isArray(visit.pools) ? visit.pools[0] || null : visit.pools || null
  };

  // Generate signed URLs for photos
  const photoUrls: Record<string, string> = {};
  const paths = formattedVisit.visit_photos?.map((photo: any) => photo.storage_path) || [];

  if (paths.length > 0) {
    const { data: signed, error: signedError } = await supabase
      .storage
      .from('pool-photos')
      .createSignedUrls(paths, 86400 * 7); // Let signed URLs remain active for 7 days so clients can view them later!

    if (!signedError && signed) {
      signed.forEach((item, index) => {
        if (item.signedUrl) {
          photoUrls[paths[index]] = item.signedUrl;
        }
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#f7fafc]">
      <ShareVisitClient visit={formattedVisit as any} photoUrls={photoUrls} />
    </main>
  );
}
