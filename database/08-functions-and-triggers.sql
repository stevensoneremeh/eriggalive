-- Function to generate unique Erigga ID
CREATE OR REPLACE FUNCTION generate_erigga_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.erigga_id := 'EG' || LPAD(NEW.id::text, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.referral_code := upper(substring(md5(random()::text) from 1 for 8));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update login count and last login
    IF TG_OP = 'UPDATE' AND OLD.last_login IS DISTINCT FROM NEW.last_login THEN
        NEW.login_count = COALESCE(OLD.login_count, 0) + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle post interactions
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'comments' THEN
            UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        ELSIF TG_TABLE_NAME = 'post_likes' THEN
            UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'comments' THEN
            UPDATE public.posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
        ELSIF TG_TABLE_NAME = 'post_likes' THEN
            UPDATE public.posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to handle comment interactions
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'comments' AND NEW.parent_id IS NOT NULL THEN
            UPDATE public.comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_id;
        ELSIF TG_TABLE_NAME = 'comment_likes' THEN
            UPDATE public.comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'comments' AND OLD.parent_id IS NOT NULL THEN
            UPDATE public.comments SET reply_count = reply_count - 1 WHERE id = OLD.parent_id;
        ELSIF TG_TABLE_NAME = 'comment_likes' THEN
            UPDATE public.comments SET like_count = like_count - 1 WHERE id = OLD.comment_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to audit user actions
CREATE OR REPLACE FUNCTION audit_user_actions()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        metadata
    ) VALUES (
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        TG_OP::audit_action,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
        jsonb_build_object('timestamp', now(), 'operation', TG_OP)
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Function to handle tier upgrades
CREATE OR REPLACE FUNCTION handle_tier_upgrade()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if tier was upgraded
    IF OLD.tier IS DISTINCT FROM NEW.tier THEN
        -- Award bonus coins for tier upgrade
        CASE NEW.tier
            WHEN 'pioneer' THEN NEW.coins = NEW.coins + 100;
            WHEN 'elder' THEN NEW.coins = NEW.coins + 500;
            WHEN 'blood' THEN NEW.coins = NEW.coins + 1000;
            ELSE NULL;
        END CASE;
        
        -- Create notification for tier upgrade
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            data
        ) VALUES (
            NEW.id,
            'tier_upgrade',
            'Tier Upgraded!',
            'Congratulations! You have been upgraded to ' || NEW.tier || ' tier.',
            jsonb_build_object('old_tier', OLD.tier, 'new_tier', NEW.tier, 'bonus_coins', 
                CASE NEW.tier
                    WHEN 'pioneer' THEN 100
                    WHEN 'elder' THEN 500
                    WHEN 'blood' THEN 1000
                    ELSE 0
                END
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS generate_erigga_id_trigger ON public.users;
CREATE TRIGGER generate_erigga_id_trigger
    BEFORE INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION generate_erigga_id();

DROP TRIGGER IF EXISTS generate_referral_code_trigger ON public.users;
CREATE TRIGGER generate_referral_code_trigger
    BEFORE INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

DROP TRIGGER IF EXISTS update_user_stats_trigger ON public.users;
CREATE TRIGGER update_user_stats_trigger
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

DROP TRIGGER IF EXISTS handle_tier_upgrade_trigger ON public.users;
CREATE TRIGGER handle_tier_upgrade_trigger
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION handle_tier_upgrade();

-- Updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON public.albums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON public.tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_music_videos_updated_at BEFORE UPDATE ON public.music_videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gallery_items_updated_at BEFORE UPDATE ON public.gallery_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coin_transactions_updated_at BEFORE UPDATE ON public.coin_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Post interaction triggers
CREATE TRIGGER update_post_comment_count AFTER INSERT OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_post_counts();
CREATE TRIGGER update_post_like_count AFTER INSERT OR DELETE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- Comment interaction triggers
CREATE TRIGGER update_comment_reply_count AFTER INSERT OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_comment_counts();
CREATE TRIGGER update_comment_like_count AFTER INSERT OR DELETE ON public.comment_likes FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

-- Audit triggers for sensitive tables
CREATE TRIGGER audit_users_trigger AFTER INSERT OR UPDATE OR DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION audit_user_actions();
CREATE TRIGGER audit_coin_transactions_trigger AFTER INSERT OR UPDATE OR DELETE ON public.coin_transactions FOR EACH ROW EXECUTE FUNCTION audit_user_actions();
