import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

/**
 * Usage:
 *  SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/import-establishments-from-crm-csv.mjs
 *
 * Optional:
 *  CSV_PATH="C:\\path\\to\\crm_schools_rows.csv"
 *  CHUNK_SIZE=400
 *  DRY_RUN=true   (parse + validate only, no writes)
 *  MAX_RECORDS=1000 (limit records processed; useful for testing)
 */

function requireEnv(name) {
  const v = String(process.env[name] || '').trim();
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

function toNull(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function toInt(v) {
  const s = toNull(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toFloat(v) {
  const s = toNull(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toBool(v) {
  const s = toNull(v);
  if (!s) return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  return null;
}

// Minimal CSV parser supporting quotes and commas.
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        const next = line[i + 1];
        if (next === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') {
        out.push(cur);
        cur = '';
      } else if (ch === '"') {
        inQuotes = true;
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out;
}

// Split CSV into records, correctly handling newlines inside quoted fields.
function splitCsvRecords(raw) {
  const records = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (ch === '"') {
      const next = raw[i + 1];
      if (inQuotes && next === '"') {
        // Escaped quote inside quoted field
        cur += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      cur += '"';
      continue;
    }

    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      // Normalize CRLF / CR
      if (ch === '\r' && raw[i + 1] === '\n') i++;
      if (cur.length) records.push(cur);
      cur = '';
      continue;
    }

    cur += ch;
  }

  if (cur.length) records.push(cur);
  return records;
}

function normalizeWebsite(url) {
  const s = toNull(url);
  if (!s) return null;
  // Some rows are "www.example.com" without scheme
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w.-]+\.[a-z]{2,}(\b|\/)/i.test(s)) return `https://${s}`;
  return s;
}

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || requireEnv('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const defaultCsvPath = path.resolve(__dirname, '..', 'crm_schools_rows.csv');
  const csvPath = process.env.CSV_PATH ? path.resolve(process.env.CSV_PATH) : defaultCsvPath;

  const chunkSize = Math.min(Math.max(Number(process.env.CHUNK_SIZE || '400') || 400, 50), 1000);
  const dryRun = String(process.env.DRY_RUN || '').trim().toLowerCase() === 'true';
  const maxRecords = Math.max(Number(process.env.MAX_RECORDS || '0') || 0, 0);

  if (!fs.existsSync(csvPath)) throw new Error(`CSV not found: ${csvPath}`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = splitCsvRecords(raw).filter((l) => l.length > 0);
  if (lines.length < 2) throw new Error('CSV looks empty');

  const header = parseCsvLine(lines[0]);
  const idx = new Map(header.map((h, i) => [h, i]));
  const totalRecords = lines.length - 1;
  process.stdout.write(
    `CSV: ${csvPath}\nColumns: ${header.length}\nRecords: ${totalRecords}${maxRecords ? ` (processing first ${maxRecords})` : ''}\nChunk size: ${chunkSize}\nDry run: ${dryRun}\n\n`
  );

  function get(row, key) {
    const i = idx.get(key);
    if (i === undefined) return null;
    return row[i] ?? null;
  }

  let inserted = 0;
  let failed = 0;
  let malformed = 0;

  const endExclusive = maxRecords ? Math.min(1 + maxRecords, lines.length) : lines.length;

  for (let start = 1; start < endExclusive; start += chunkSize) {
    const slice = lines.slice(start, Math.min(start + chunkSize, endExclusive));
    const rows = [];

    for (const line of slice) {
      const cols = parseCsvLine(line);
      if (cols.length !== header.length) {
        malformed++;
        continue;
      }

      const id = toNull(get(cols, 'id'));
      const establishment_name = toNull(get(cols, 'establishment_name'));

      // Some rows are international or non-school entries; still allowed.
      const urn = toNull(get(cols, 'urn'));
      const postcode = toNull(get(cols, 'address_postcode'));
      const website = normalizeWebsite(get(cols, 'website'));

      // Canonical display name
      const name = establishment_name || toNull(get(cols, 'trust_name')) || '(unknown)';

      const meta = {
        // Keep original IDs/refs for future syncing
        knack_record_id: toNull(get(cols, 'knack_record_id')),
        is_in_knack: toBool(get(cols, 'is_in_knack')),
        is_international: toBool(get(cols, 'is_international')),
        international_region: toNull(get(cols, 'international_region')),
        region_group: toNull(get(cols, 'region_group')),
        enrichment_status: toNull(get(cols, 'enrichment_status')),
        enriched_at: toNull(get(cols, 'enriched_at')),
      };

      rows.push({
        ...(id ? { id } : {}),
        name,
        establishment_name,
        postcode,
        urn,
        website,

        country: toNull(get(cols, 'country')),
        region: toNull(get(cols, 'region')),
        local_authority: toNull(get(cols, 'local_authority')),
        urban_rural: toNull(get(cols, 'urban_rural')),
        phase_of_education: toNull(get(cols, 'phase_of_education')),
        high_age: toInt(get(cols, 'high_age')),
        ofsted_rating: toNull(get(cols, 'ofsted_rating')),
        ofsted_date: toNull(get(cols, 'ofsted_date')),
        ofsted_report_url: toNull(get(cols, 'ofsted_report_url')),
        establishment_type: toNull(get(cols, 'establishment_type')),
        establishment_type_group: toNull(get(cols, 'establishment_type_group')),
        denomination: toNull(get(cols, 'denomination')),
        address_street_1: toNull(get(cols, 'address_street_1')),
        address_street_2: toNull(get(cols, 'address_street_2')),
        address_city: toNull(get(cols, 'address_city')),
        address_state: toNull(get(cols, 'address_state')),
        latitude: toFloat(get(cols, 'latitude')),
        longitude: toFloat(get(cols, 'longitude')),
        phone: toNull(get(cols, 'phone')),
        primary_email: toNull(get(cols, 'primary_email')),
        academy_trust_id: toNull(get(cols, 'academy_trust_id')),
        trust_name: toNull(get(cols, 'trust_name')),
        customer_status: toNull(get(cols, 'customer_status')),
        is_existing_customer: toBool(get(cols, 'is_existing_customer')),
        number_of_pupils: toInt(get(cols, 'number_of_pupils')),

        meta,
      });
    }

    if (!dryRun) {
      const { error } = await supabase.from('establishments').upsert(rows, { onConflict: 'id' });
      if (error) {
        failed += rows.length;
        console.error(`Chunk failed (${start}-${start + rows.length - 1}):`, error.message);
        continue;
      }
    }
    inserted += rows.length;
    process.stdout.write(`${dryRun ? 'Validated' : 'Imported'} ${inserted}/${endExclusive - 1} (malformed skipped: ${malformed})\n`);
  }

  process.stdout.write(`\nDone. ${dryRun ? 'Validated' : 'Imported'}=${inserted} failed=${failed} malformed_skipped=${malformed}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

