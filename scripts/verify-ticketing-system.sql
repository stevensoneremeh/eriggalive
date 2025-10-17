
-- Verify Event Ticketing System Database Schema
-- Run this in Supabase SQL Editor

-- 1. Check if all required tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('events', 'tickets', 'event_payments') THEN '✓ Core Table'
    ELSE '✗ Missing'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('events', 'tickets', 'event_payments')
ORDER BY table_name;

-- 2. Verify tickets table has all required columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tickets'
  AND column_name IN (
    'custom_amount',
    'seating_priority',
    'seating_assignment',
    'admission_status',
    'admitted_at',
    'admitted_by',
    'qr_token'
  )
ORDER BY column_name;

-- 3. Check event_payments table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'event_payments'
  AND column_name IN (
    'custom_amount',
    'paystack_reference',
    'status',
    'ticket_id'
  )
ORDER BY column_name;

-- 4. Verify seating calculation function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'calculate_seating_priority',
    'assign_seating',
    'admit_ticket'
  )
ORDER BY routine_name;

-- 5. Test sample ticket data
SELECT 
  t.ticket_number,
  t.custom_amount,
  t.price_paid_naira,
  t.seating_priority,
  t.seating_assignment,
  t.admission_status,
  e.title as event_title
FROM tickets t
JOIN events e ON t.event_id = e.id
ORDER BY t.seating_priority DESC
LIMIT 10;

-- 6. Check payment records
SELECT 
  COUNT(*) as total_payments,
  SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN custom_amount THEN 1 ELSE 0 END) as custom_payments,
  SUM(amount) / 100.0 as total_revenue_naira
FROM event_payments;

-- 7. Verify seating priority distribution
SELECT 
  seating_assignment,
  COUNT(*) as ticket_count,
  MIN(seating_priority) as min_priority,
  MAX(seating_priority) as max_priority,
  AVG(COALESCE(custom_amount, price_paid_naira)) / 100.0 as avg_payment_naira
FROM tickets
WHERE seating_assignment IS NOT NULL
GROUP BY seating_assignment
ORDER BY MAX(seating_priority) DESC;

-- 8. Check admission statistics
SELECT 
  admission_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM tickets
GROUP BY admission_status
ORDER BY count DESC;

-- 9. Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('tickets', 'event_payments')
ORDER BY tablename, policyname;

-- 10. Sample successful workflow test
-- This should return data if tickets have been created
SELECT 
  'Workflow Test' as test_name,
  COUNT(DISTINCT ep.id) as payments_created,
  COUNT(DISTINCT t.id) as tickets_created,
  COUNT(DISTINCT CASE WHEN t.admission_status = 'admitted' THEN t.id END) as tickets_admitted
FROM event_payments ep
LEFT JOIN tickets t ON ep.ticket_id = t.id
WHERE ep.status = 'paid';
