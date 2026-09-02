const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

// 1. Load environment variables from .env.local / .env
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) must be defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

// Deterministic UUID generator (converts any string ID like "cat-1" to a valid UUID)
function toUuid(idStr) {
  if (!idStr) return crypto.randomUUID();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr)) {
    return idStr;
  }
  const hash = crypto.createHash('md5').update(String(idStr)).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    '8' + hash.substring(17, 20),
    hash.substring(20, 32),
  ].join('-');
}

async function seedTable(tableName, records, primaryKey = 'id') {
  if (!records || records.length === 0) {
    console.log(`ℹ️  No records found to seed for "${tableName}"`);
    return { success: 0, error: 0 };
  }

  console.log(`🚀 Seeding table "${tableName}" with ${records.length} records...`);
  
  let successCount = 0;
  let errorCount = 0;

  // Try bulk upsert first
  const { data, error } = await supabase.from(tableName).upsert(records, { onConflict: primaryKey });
  
  if (!error) {
    successCount = records.length;
    console.log(`✅ Successfully bulk-inserted ${successCount} records into "${tableName}"`);
  } else {
    console.warn(`⚠️  Bulk insert note for "${tableName}": ${error.message}. Attempting individual inserts...`);

    for (const record of records) {
      const { error: singleError } = await supabase.from(tableName).upsert(record, { onConflict: primaryKey });
      if (!singleError) {
        successCount++;
      } else {
        errorCount++;
        console.error(`   ✕ Record [${record[primaryKey] || 'item'}]: ${singleError.message}`);
      }
    }
    console.log(`📊 Table "${tableName}": ${successCount} succeeded, ${errorCount} failed`);
  }

  return { success: successCount, error: errorCount };
}

async function runSeed() {
  console.log('====================================================');
  console.log('📦 Starting Supabase Database Seeder for TodaysCoimbatore');
  console.log(`🔗 Target URL: ${supabaseUrl}`);
  console.log(`🔑 Key Type: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY (Bypasses RLS)' : 'ANON_KEY'}`);
  console.log('====================================================\n');

  // 1. Categories
  const categoriesPath = path.join(process.cwd(), 'src', 'data', 'categories.json');
  let rawCategories = fs.existsSync(categoriesPath) ? JSON.parse(fs.readFileSync(categoriesPath, 'utf8')) : [];
  const categories = rawCategories.map((c) => ({
    id: toUuid(c.id || c.slug),
    name: c.name,
    slug: c.slug,
    icon: c.icon || '📌',
  }));

  // 2. Blood Donors
  const donorsPath = path.join(process.cwd(), 'src', 'data', 'blood_donors.json');
  let rawDonors = fs.existsSync(donorsPath) ? JSON.parse(fs.readFileSync(donorsPath, 'utf8')) : [];
  const bloodDonors = rawDonors.map((d) => ({
    id: toUuid(d.id || d.phone),
    name: d.name,
    blood_group: d.blood_group || d.bloodGroup,
    area: d.area,
    phone: d.phone,
  }));

  // 3. Listings
  const listingsPath = path.join(process.cwd(), 'src', 'data', 'listings.json');
  let rawListings = fs.existsSync(listingsPath) ? JSON.parse(fs.readFileSync(listingsPath, 'utf8')) : [];
  const listings = rawListings.map((l) => ({
    id: toUuid(l.id || l.name || l.title),
    title: l.title || l.name,
    category: l.category || 'General',
    phone: l.phone || null,
    address: l.address || null,
    area: l.area || 'Coimbatore',
    pincode: l.pincode || null,
    rating: typeof l.rating === 'number' ? l.rating : 4.5,
  }));

  const results = {};

  results.categories = await seedTable('categories', categories, 'id');
  console.log('');

  results.blood_donors = await seedTable('blood_donors', bloodDonors, 'id');
  console.log('');

  results.listings = await seedTable('listings', listings, 'id');
  console.log('');

  console.log('====================================================');
  console.log('🏁 Supabase Seeding Process Completed Successfully!');
  console.log('Summary:', JSON.stringify(results, null, 2));
  console.log('====================================================');
}

runSeed().catch((err) => {
  console.error('❌ Fatal Seed Error:', err);
  process.exit(1);
});
