import { createClient } from '@/lib/supabase/server';
import DashboardClient from '@/components/dashboard-client';

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
      <DashboardClient initialPools={pools || []} />
    </main>
  );
}
