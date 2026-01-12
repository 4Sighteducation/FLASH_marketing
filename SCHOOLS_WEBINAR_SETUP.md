## Schools webinar setup (FL4SH_marketing)

### 1) Booking link variable

The server will email staff the booking link using:

- **`SCHOOL_WEBINAR_BOOKING_URL`**

Set it to:

- `https://calendly.com/vespaacademy/student-workshop-booking`

**Where to set it**

- **Vercel (recommended)**: Project = `FLASH_marketing` → Settings → Environment Variables → add `SCHOOL_WEBINAR_BOOKING_URL` for **Production + Preview + Development**.
- **Local dev**: create `FLASH_marketing/.env.local` and add:

```bash
SCHOOL_WEBINAR_BOOKING_URL=https://calendly.com/vespaacademy/student-workshop-booking
```

Note: the code also has a built-in default to that Calendly URL, but setting the env var makes it explicit and easy to change later.

### 2) Why your import shows ~1300

If your CSV contains **embedded newlines inside quoted fields**, a naive `split("\n")` import will stop early or mis-parse later rows.

The importer script now handles embedded newlines properly and reports:

- total records parsed
- malformed rows skipped (wrong column count)

### 3) Re-run import safely

From `FLASH_marketing`:

```bash
DRY_RUN=true node scripts/import-establishments-from-crm-csv.mjs
```

If it reports ~6,727 records (or similar), run the real import:

```bash
node scripts/import-establishments-from-crm-csv.mjs
```

Because it **upserts by `id`**, re-running is safe: it will fill in the missing rows without duplicating.

## Schools webinar: setup

### Booking link

Set this environment variable on the **`FLASH_marketing` Vercel project** (Production + Preview + Development):

- **`SCHOOL_WEBINAR_BOOKING_URL`**: `https://calendly.com/vespaacademy/student-workshop-booking`

Locally (for `npm run dev`), create `FLASH_marketing/.env.local`:

```bash
SCHOOL_WEBINAR_BOOKING_URL=https://calendly.com/vespaacademy/student-workshop-booking
```

### Email + database requirements

- **SendGrid**: set `SENDGRID_API_KEY` (and optionally `SENDGRID_FROM_EMAIL`)
- **Supabase**: set `SUPABASE_SERVICE_ROLE_KEY` (server-only) so the API route can insert rows.

### What happens on signup

- Staff submit the form at `/schools`
- The server inserts into `public.school_webinar_signups`
- The server emails the booking link to the staff member

