# Comprehensive Supabase AI Setup Prompt for Erigga Live Platform

## Project Overview
Create a complete backend infrastructure for "Erigga Live" - a fan engagement platform for Nigerian artist Erigga. The platform features community interactions, tier-based access, freebies system, coin economy, and content management.

## Database Schema Requirements

### Core Tables Needed:

1. **user_profiles** - Main user management
   - Fields: id, auth_user_id (uuid), username, full_name, email, tier, role, coins, points, etc.
   - Tiers: grassroot, pioneer, elder, blood
   - Roles: user, moderator, admin, super_admin

2. **community_posts** - User-generated content
   - Fields: id, user_id (uuid), content, type, media_url, vote_count, comment_count
   - Types: bars, story, event, general, announcement, poll

3. **community_comments** - Post comments with threading
   - Fields: id, post_id, user_id (uuid), parent_comment_id, content, like_count

4. **freebies** - Tier-based rewards system
   - Fields: id, name, description, required_tier, stock_quantity, is_active

5. **freebie_claims** - User claims tracking
   - Fields: id, user_id (uuid), freebie_id, status, shipping_address

6. **coin_transactions** - Virtual currency system
   - Fields: id, user_id (uuid), amount, transaction_type, status

### Custom Types Required:
\`\`\`sql
CREATE TYPE user_tier AS ENUM ('grassroot', 'pioneer', 'elder', 'blood');
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
CREATE TYPE post_type AS ENUM ('bars', 'story', 'event', 'general', 'announcement', 'poll');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE transaction_type AS ENUM ('purchase', 'withdrawal', 'reward', 'content_access', 'refund');
\`\`\`

## Security Requirements

### Row Level Security (RLS) Policies:
1. Users can only view/edit their own data
2. Admins have full access to all data
3. Public content is viewable by everyone
4. Tier-based access for premium content

### Authentication:
- Supabase Auth integration
- Email/password and social logins
- User profile auto-creation on signup

## API Endpoints Needed

### Community Features:
- GET/POST /api/community/posts - CRUD operations
- POST /api/community/posts/vote - Voting system
- GET/POST /api/community/comments - Comment management

### Freebies System:
- GET /api/freebies - List available freebies
- POST /api/freebies/claim - Claim freebie
- GET /api/freebies/claims - User's claims

### Coin Economy:
- GET /api/coins/balance - User balance
- POST /api/coins/purchase - Buy coins
- POST /api/coins/withdraw - Withdraw coins

### Admin Panel:
- GET /api/admin/stats - Platform statistics
- GET/POST/PUT/DELETE /api/admin/freebies - Manage freebies
- GET /api/admin/users - User management

## Storage Requirements

### Buckets:
- `eriggalive-assets` - Public bucket for images, videos, audio
- Policies for authenticated upload, public read

### File Types:
- Images: JPG, PNG, WebP
- Videos: MP4, WebM
- Audio: MP3, WAV
- Documents: PDF

## Real-time Features

### Supabase Realtime:
- Live post updates
- Real-time voting
- Live comment threads
- Notification system

## Performance Optimizations

### Indexes:
- User lookup indexes (auth_user_id, username, email)
- Content indexes (created_at, category, is_published)
- Search indexes for full-text search

### Caching Strategy:
- Cache frequently accessed data
- Optimize query performance

## Environment Variables Required:
\`\`\`
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
\`\`\`

## Migration Strategy

1. Create all custom types first
2. Create core tables with proper relationships
3. Set up RLS policies
4. Create indexes for performance
5. Insert seed data
6. Test all endpoints

## Testing Requirements

### Test Users:
Create test users for each tier with sample data:
- grassroot_user@test.com
- pioneer_user@test.com  
- elder_user@test.com
- blood_user@test.com
- admin@test.com

### Sample Data:
- Community categories
- Sample posts and comments
- Freebies for each tier
- Test transactions

## Deployment Checklist

1. ✅ Database schema deployed
2. ✅ RLS policies active
3. ✅ Storage buckets configured
4. ✅ API endpoints tested
5. ✅ Authentication working
6. ✅ Real-time subscriptions active
7. ✅ Admin panel functional

## Error Handling

### Common Issues to Address:
- Foreign key constraint errors
- Type mismatch (bigint vs uuid)
- RLS policy conflicts
- Storage permission issues

### Monitoring:
- Query performance monitoring
- Error logging and alerting
- User activity tracking

Please generate the complete SQL schema, API endpoints, and configuration needed to implement this platform with proper error handling and security measures.
\`\`\`

Now let's create a deployment verification script:
