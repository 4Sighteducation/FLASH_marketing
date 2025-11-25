-- Clean up test waitlist entries
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qkapwhyxcpgzahuemucg

-- Option 1: Delete specific test emails
DELETE FROM public.waitlist 
WHERE email IN (
  'test@example.com',
  'tony@vespa.academy',
  'test@test.com'
  -- Add any other test emails here
);

-- Option 2: Delete all @vespa.academy emails (if those are test accounts)
-- DELETE FROM public.waitlist 
-- WHERE email LIKE '%@vespa.academy';

-- Option 3: Delete all entries from a specific source
-- DELETE FROM public.waitlist 
-- WHERE source = 'test';

-- Option 4: Delete all waitlist entries (CAREFUL - wipes everything!)
-- DELETE FROM public.waitlist;

-- After deleting, reset the position numbers for remaining entries
UPDATE public.waitlist
SET position = subquery.new_position
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS new_position
  FROM public.waitlist
) AS subquery
WHERE public.waitlist.id = subquery.id;

-- Update is_top_twenty flag based on new positions
UPDATE public.waitlist
SET is_top_twenty = (position <= 20);

-- Verify the results
SELECT 
  position,
  email,
  is_top_twenty,
  created_at
FROM public.waitlist 
ORDER BY position ASC;

