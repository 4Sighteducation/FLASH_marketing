-- Check Waitlist Status
-- Run these queries in Supabase SQL Editor to see your waitlist data

-- 1. View all waitlist entries (ordered by position)
SELECT 
  position,
  email,
  is_top_twenty,
  source,
  notified,
  created_at,
  TO_CHAR(created_at, 'Mon DD, YYYY HH24:MI') as signup_time
FROM public.waitlist 
ORDER BY position ASC;

-- 2. Count total signups
SELECT COUNT(*) as total_signups FROM public.waitlist;

-- 3. Count top 20 signups
SELECT COUNT(*) as top_twenty_count 
FROM public.waitlist 
WHERE is_top_twenty = true;

-- 4. See who's in the top 20
SELECT 
  position,
  email,
  created_at
FROM public.waitlist 
WHERE is_top_twenty = true
ORDER BY position ASC;

-- 5. Check signups by source
SELECT 
  source,
  COUNT(*) as count
FROM public.waitlist 
GROUP BY source
ORDER BY count DESC;

-- 6. Recent signups (last 10)
SELECT 
  position,
  email,
  is_top_twenty,
  TO_CHAR(created_at, 'Mon DD HH24:MI') as when_signed_up
FROM public.waitlist 
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Check for any duplicate emails (should be 0)
SELECT 
  email,
  COUNT(*) as count
FROM public.waitlist 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 8. Summary stats
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN is_top_twenty THEN 1 END) as top_twenty,
  COUNT(CASE WHEN notified THEN 1 END) as notified,
  MIN(created_at) as first_signup,
  MAX(created_at) as latest_signup
FROM public.waitlist;

