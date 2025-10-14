
# Event Ticketing System - Testing Checklist

## System Overview
The enhanced event ticketing system includes:
- Fixed and custom payment amounts
- Priority seating based on payment
- QR code generation and validation
- Admin scanner with detailed attendee information
- Payment tracking and seating assignments

## Testing Checklist

### 1. Event Payment Flow
- [ ] Navigate to `/events` page
- [ ] Verify event details display correctly
- [ ] Test fixed price payment (₦20,000)
- [ ] Test custom amount payment (minimum ₦20,000)
- [ ] Verify Paystack integration redirects correctly
- [ ] Complete payment and verify redirect to dashboard

### 2. Ticket Generation
- [ ] After payment, verify ticket appears in `/dashboard/events`
- [ ] Check ticket number format: `ELT-XXXXXXXX-XXXX`
- [ ] Verify QR code is generated
- [ ] Verify seating priority is calculated correctly
- [ ] Check seating assignment based on payment amount

### 3. Payment and Seating Details
- [ ] Verify amount paid is displayed correctly
- [ ] Check custom payment badge appears for priority payments
- [ ] Verify seating assignment shows correct section
- [ ] Check priority level badge displays correct tier:
  - Priority >= 900: Front Row VIP (Purple)
  - Priority >= 800: Second Row Premium (Blue)
  - Priority >= 700: Third Row Premium (Green)
  - Priority < 700: General Admission (Gray)

### 4. Admin Scanner (`/admin/scanner`)
- [ ] Login as admin (info@eriggalive.com)
- [ ] Navigate to `/admin/scanner`
- [ ] Select an event from dropdown
- [ ] Verify statistics display:
  - Total Tickets
  - Admitted Count
  - Total Revenue
  - VIP/Regular Split
- [ ] Check attendee table shows:
  - Ticket number
  - Holder name and email
  - Amount paid with custom badge
  - Seating assignment
  - Priority score
  - Admission status
  - Admitted timestamp

### 5. QR Code Scanning
- [ ] Click "Open Scanner" button
- [ ] Test manual entry with ticket number
- [ ] Verify validation response includes:
  - Ticket details
  - Payment information
  - Seating assignment
  - Holder information
- [ ] Check admission status updates to "admitted"
- [ ] Verify admitted timestamp is recorded
- [ ] Test scanning already admitted ticket (should fail)

### 6. Ticket Details Expansion
- [ ] Click expand arrow on any ticket row
- [ ] Verify expanded details show:
  - Purchase timestamp
  - Ticket type
  - Payment method
  - QR token preview
- [ ] Test collapse functionality

### 7. Search and Export
- [ ] Test search by ticket number
- [ ] Test search by holder name
- [ ] Test search by email
- [ ] Click "Export" button
- [ ] Verify CSV download includes all columns
- [ ] Check CSV formatting is correct

### 8. Priority Seating Logic
- [ ] Create tickets with different payment amounts:
  - ₦50,000 (should get priority 900+)
  - ₦35,000 (should get priority 800+)
  - ₦25,000 (should get priority 700+)
  - ₦20,000 (should get priority <700)
- [ ] Verify seating assignments match priority:
  - Front Row VIP for highest
  - Second Row Premium for high
  - Third Row Premium for medium
  - General Admission for standard

### 9. Real-time Updates
- [ ] Admit a ticket via scanner
- [ ] Verify ticket list refreshes
- [ ] Check statistics update immediately
- [ ] Verify admitted count increases

### 10. Edge Cases
- [ ] Test with no tickets for event
- [ ] Test scanning invalid QR code
- [ ] Test scanning ticket for wrong event
- [ ] Test payment below minimum (should fail)
- [ ] Test concurrent ticket purchases

## Database Verification

Check Supabase tables:
```sql
-- Verify tickets table
SELECT 
  ticket_number,
  price_paid_naira,
  custom_amount,
  seating_priority,
  seating_assignment,
  admission_status
FROM tickets
ORDER BY seating_priority DESC;

-- Verify event_payments table
SELECT 
  amount,
  custom_amount,
  status,
  paid_at
FROM event_payments
WHERE status = 'paid';

-- Check seating priority distribution
SELECT 
  seating_assignment,
  COUNT(*) as count,
  AVG(COALESCE(custom_amount, price_paid_naira)) as avg_payment
FROM tickets
GROUP BY seating_assignment
ORDER BY avg_payment DESC;
```

## Expected Results

### Payment Amounts
- Fixed: ₦20,000
- Custom: >= ₦20,000

### Priority Levels
- 900-999: Front Row VIP
- 800-899: Second Row Premium  
- 700-799: Third Row Premium
- 600-699: Fourth Row Standard
- 500-599: Fifth Row Standard
- <500: General Admission

### Status Flow
1. Payment initiated: `status=pending`
2. Payment verified: `status=paid`, ticket created
3. Ticket scanned: `admission_status=admitted`
4. Invalid scan: Error with reason

## Performance Checks
- [ ] Page load time < 2 seconds
- [ ] QR scan validation < 1 second
- [ ] Table with 100+ tickets loads smoothly
- [ ] Search filters instantly
- [ ] Export completes within 3 seconds

## Security Checks
- [ ] Non-admin cannot access scanner
- [ ] QR tokens are cryptographically secure
- [ ] Payment amounts cannot be modified post-purchase
- [ ] Admission status changes are logged
- [ ] Only valid tickets can be admitted

## Success Criteria
All checklist items must pass for the system to be considered production-ready.
