-- Create the ERIGGA Live Intimate Session event
INSERT INTO public.events (
    id,
    title,
    description,
    event_type,
    venue,
    address,
    city,
    country,
    event_date,
    doors_open,
    event_end,
    max_capacity,
    current_attendance,
    ticket_price_naira,
    ticket_price_coins,
    vip_price_naira,
    vip_price_coins,
    vip_capacity,
    current_vip_sold,
    image_url,
    banner_url,
    status,
    requires_membership,
    is_featured,
    metadata,
    created_at,
    updated_at
) VALUES (
    uuid_generate_v4(),
    'ERIGGA Live - Intimate Session with THE GOAT',
    'Join Erigga for an exclusive intimate session in a cozy, atmospheric setting. Experience the GOAT up close and personal in this limited capacity event featuring acoustic performances, storytelling, and direct fan interaction.',
    'concert',
    'Uncle Jaffi at The Playground',
    'The Playground Entertainment Complex',
    'Warri',
    'Nigeria',
    '2025-09-03 19:00:00+01',  -- 7 PM WAT
    '2025-09-03 18:00:00+01',  -- Doors open at 6 PM
    '2025-09-03 23:00:00+01',  -- Event ends at 11 PM
    100,  -- Limited capacity for intimate setting
    0,    -- Current attendance
    1000000.00,  -- 1 million naira as requested
    50000,       -- Equivalent in Erigga coins (20 naira per coin)
    1500000.00,  -- VIP price (1.5 million naira)
    75000,       -- VIP equivalent in coins
    20,          -- VIP capacity (20% of total)
    0,           -- Current VIP sold
    '/events/erigga-intimate-session.png',
    '/events/erigga-intimate-session.png',
    'upcoming',
    'free',  -- Available to all membership tiers
    true,    -- Featured event
    '{
        "contact_phone": "09035418185",
        "table_reservations": true,
        "dress_code": "Smart casual",
        "age_restriction": "18+",
        "special_features": ["Acoustic performances", "Fan Q&A", "Photo opportunities", "Exclusive merchandise"],
        "original_pricing": {
            "regular": 20000,
            "vip": 50000
        }
    }',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;
