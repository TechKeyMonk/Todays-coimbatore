import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const eventId = decodeURIComponent(resolvedParams.id || '').trim();

  let title = "Coimbatore Event Details | Today's Coimbatore";
  let description = 'Check out event schedules, venue directions, and highlights in Coimbatore.';

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
    let query = supabase.from('events').select('title, event_name, description');
    if (isUuid) {
      query = query.eq('id', eventId);
    } else {
      query = query.or(`title.ilike.%${eventId}%,event_name.ilike.%${eventId}%`);
    }
    const { data } = await query.maybeSingle();
    if (data) {
      const name = data.title || data.event_name;
      if (name) title = `${name} | Coimbatore Events`;
      if (data.description) description = data.description.slice(0, 160);
    }
  } catch (e) {}

  return {
    title,
    description,
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const resolvedParams = await params;
  const eventId = resolvedParams.id;
  redirect(`/events?id=${encodeURIComponent(eventId)}`);
}
