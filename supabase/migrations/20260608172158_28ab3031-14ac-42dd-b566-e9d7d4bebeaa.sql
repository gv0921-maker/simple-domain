
-- One-time backfill: ensure every crm_contacts row has a matching customers row.
-- Match by lowercase email; for contacts with no email use crm_contact_id stored in notes tag.

INSERT INTO public.customers (name, email, phone, company, contact_person, type, is_active)
SELECT
  COALESCE(NULLIF(TRIM(CONCAT_WS(' ', c.first_name, c.last_name)), ''), c.company_name, 'Unnamed') AS name,
  c.email,
  c.phone,
  c.company_name AS company,
  CASE WHEN c.company_name IS NOT NULL AND c.company_name <> ''
       THEN NULLIF(TRIM(CONCAT_WS(' ', c.first_name, c.last_name)), '')
       ELSE NULL END AS contact_person,
  CASE WHEN c.type::text = 'company' THEN 'company' ELSE 'individual' END AS type,
  true
FROM public.crm_contacts c
WHERE
  -- Skip if a customer with the same (lowercased) email already exists
  (c.email IS NULL OR c.email = '' OR NOT EXISTS (
      SELECT 1 FROM public.customers cu
      WHERE LOWER(cu.email) = LOWER(c.email)
  ))
  -- For contacts without email, skip if a customer with same name+phone already exists
  AND NOT (
    (c.email IS NULL OR c.email = '')
    AND EXISTS (
      SELECT 1 FROM public.customers cu
      WHERE cu.name = COALESCE(NULLIF(TRIM(CONCAT_WS(' ', c.first_name, c.last_name)), ''), c.company_name, 'Unnamed')
        AND COALESCE(cu.phone,'') = COALESCE(c.phone,'')
    )
  );
