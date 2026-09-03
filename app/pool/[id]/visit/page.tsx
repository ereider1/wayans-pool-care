import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import TechnicianForm from '@/components/technician-form';

export default async function NewVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: pool, error } = await supabase
    .from('pools')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !pool) {
    return notFound();
  }

  return <TechnicianForm poolId={pool.id} poolName={pool.name} />;
}
