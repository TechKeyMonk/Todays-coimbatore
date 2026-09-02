import * as fs from 'fs';
import * as path from 'path';
import * as nodeCrypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...rest] = trimmed.split('=');
        if (key && rest.length > 0) {
          process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: ws as any },
});

function toUuid(idStr?: string): string {
  if (!idStr) return nodeCrypto.randomUUID();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr)) {
    return idStr;
  }
  const hash = nodeCrypto.createHash('md5').update(String(idStr)).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    '8' + hash.substring(17, 20),
    hash.substring(20, 32),
  ].join('-');
}

export async function runSeed(): Promise<void> {
  console.log('📦 Supabase Database Seeder (TypeScript)');

  const categoriesPath = path.join(process.cwd(), 'src', 'data', 'categories.json');
  const donorsPath = path.join(process.cwd(), 'src', 'data', 'blood_donors.json');
  const listingsPath = path.join(process.cwd(), 'src', 'data', 'listings.json');

  const categories = fs.existsSync(categoriesPath)
    ? JSON.parse(fs.readFileSync(categoriesPath, 'utf8')).map((c: any) => ({
        id: toUuid(c.id || c.slug),
        name: c.name,
        slug: c.slug,
        icon: c.icon || '📌',
      }))
    : [];

  const bloodDonors = fs.existsSync(donorsPath)
    ? JSON.parse(fs.readFileSync(donorsPath, 'utf8')).map((d: any) => ({
        id: toUuid(d.id || d.phone),
        name: d.name,
        blood_group: d.blood_group || d.bloodGroup,
        area: d.area,
        phone: d.phone,
      }))
    : [];

  const listings = fs.existsSync(listingsPath)
    ? JSON.parse(fs.readFileSync(listingsPath, 'utf8')).map((l: any) => ({
        id: toUuid(l.id || l.name),
        title: l.title || l.name,
      }))
    : [];

  if (categories.length > 0) {
    const { error } = await supabase.from('categories').upsert(categories, { onConflict: 'id' });
    if (!error) console.log(`✅ Seeded ${categories.length} categories`);
    else console.warn(`Categories note: ${error.message}`);
  }

  if (bloodDonors.length > 0) {
    const { error } = await supabase.from('blood_donors').upsert(bloodDonors, { onConflict: 'id' });
    if (!error) console.log(`✅ Seeded ${bloodDonors.length} blood donors`);
    else console.warn(`Blood donors note: ${error.message}`);
  }

  if (listings.length > 0) {
    const { error } = await supabase.from('listings').upsert(listings, { onConflict: 'id' });
    if (!error) console.log(`✅ Seeded ${listings.length} listings`);
    else console.warn(`Listings note: ${error.message}`);
  }
}

if (require.main === module) {
  runSeed().catch(console.error);
}
