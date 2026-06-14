DELETE FROM public.employees
WHERE email IN ('admin@erp.local','sales@erp.local','warehouse@erp.local','hr@erp.local','accountant@erp.local');

DELETE FROM public.customers
WHERE name ILIKE 'demo %' OR name ILIKE 'sample %' OR name ILIKE 'test %'
   OR email ILIKE '%@example.com' OR email ILIKE '%@erp.local';

DELETE FROM public.vendors  WHERE name ILIKE 'demo %' OR name ILIKE 'sample %' OR name ILIKE 'test %';
DELETE FROM public.suppliers WHERE name ILIKE 'demo %' OR name ILIKE 'sample %' OR name ILIKE 'test %';

DELETE FROM public.crm_contacts
WHERE first_name ILIKE 'demo%' OR first_name ILIKE 'sample%'
   OR email ILIKE '%@example.com' OR email ILIKE '%@erp.local';

DELETE FROM public.crm_opportunities WHERE name ILIKE 'demo%' OR name ILIKE 'sample%';
DELETE FROM public.crm_leads
WHERE title ILIKE 'demo%' OR title ILIKE 'sample%'
   OR contact_name ILIKE 'demo%' OR contact_name ILIKE 'sample%';

DELETE FROM public.products
WHERE name ILIKE 'demo product%' OR name ILIKE 'sample product%'
   OR sku ILIKE 'DEMO-%' OR sku ILIKE 'SAMPLE-%';