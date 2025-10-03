
-- Migration: Update meet_greet_bookings for Daily.co integration
-- This safely updates the existing table structure

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add scheduled_at if booking_date and booking_time exist
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'meet_greet_bookings' 
               AND column_name = 'booking_date') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'meet_greet_bookings' 
                    AND column_name = 'scheduled_at') THEN
        
        ALTER TABLE public.meet_greet_bookings 
        ADD COLUMN scheduled_at timestamp with time zone;
        
        -- Migrate existing data
        UPDATE public.meet_greet_bookings 
        SET scheduled_at = (booking_date + booking_time)::timestamp with time zone
        WHERE scheduled_at IS NULL;
        
        ALTER TABLE public.meet_greet_bookings 
        ALTER COLUMN scheduled_at SET NOT NULL;
        
        -- Drop old columns
        ALTER TABLE public.meet_greet_bookings 
        DROP COLUMN IF EXISTS booking_date,
        DROP COLUMN IF EXISTS booking_time;
    END IF;

    -- Add duration column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meet_greet_bookings' 
                   AND column_name = 'duration') THEN
        ALTER TABLE public.meet_greet_bookings 
        ADD COLUMN duration integer NOT NULL DEFAULT 30;
    END IF;

    -- Add Daily.co columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meet_greet_bookings' 
                   AND column_name = 'daily_room_url') THEN
        ALTER TABLE public.meet_greet_bookings 
        ADD COLUMN daily_room_url text,
        ADD COLUMN daily_room_name text,
        ADD COLUMN started_at timestamp with time zone,
        ADD COLUMN ended_at timestamp with time zone;
    END IF;

    -- Update status check constraint
    ALTER TABLE public.meet_greet_bookings 
    DROP CONSTRAINT IF EXISTS meet_greet_bookings_status_check;
    
    ALTER TABLE public.meet_greet_bookings 
    ADD CONSTRAINT meet_greet_bookings_status_check 
    CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled'));

END $$;

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_meet_greet_bookings_scheduled_at 
ON public.meet_greet_bookings(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_meet_greet_bookings_daily_room 
ON public.meet_greet_bookings(daily_room_name) 
WHERE daily_room_name IS NOT NULL;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.meet_greet_bookings TO authenticated;
GRANT SELECT ON public.meet_greet_bookings TO anon;
