# Comprehensive Supabase AI Setup Prompt for Erigga Live Platform

## Project Overview
Create a complete backend setup for "Erigga Live" - a fan platform for Nigerian rapper Erigga. The platform includes user authentication, community features, merchandise store, freebies system, coin economy, and admin dashboard.

## Database Schema Requirements

### 1. User Management System
\`\`\`sql
-- Create user_profiles table with comprehensive user data
-- Include: auth_user_id (UUID), username, email, tier system (grassroot/pioneer/elder/blood)
-- Include: role system (user/moderator/admin/super_admin), coins, points, verification status
-- Include: profile data (bio, location, avatar), subscription management, referral system
\`\`\`

### 2. Community System
\`\`\`sql
-- Create community_categories table for organizing discussions
-- Create community_posts table with rich content support (HTML, media, voting)
-- Create community_comments table with nested replies and like system
-- Create community_post_votes and community_comment_likes tables
-- Include: content moderation, hashtags, mentions, media attachments
\`\`\`

### 3. Freebies & Merchandise System
\`\`\`sql
-- Create freebies table with tier-based access control
-- Create freebie_claims table for tracking user claims and shipping
-- Create products table for merchandise with pricing and inventory
-- Include: stock management, tier restrictions, shipping requirements
\`\`\`

### 4. Coin Economy System
\`\`\`sql
-- Create coin_transactions table for all coin-related activities
-- Include: transaction types (purchase/withdrawal/reward/content_access)
-- Include: payment integration with Paystack, transaction status tracking
-- Include: referral bonuses, content access payments
\`\`\`

### 5. Notification System
\`\`\`sql
-- Create notifications table for user communications
-- Include: notification types (system/content/social/payment/event)
-- Include: read status, expiration, delivery tracking
\`\`\`

## Authentication & Security Requirements

### Row Level Security (RLS) Policies
- Enable RLS on all tables
- Users can only access their own data unless admin
- Admins have full access to all data
- Public content is viewable by everyone
- Secure API endpoints with proper authentication

### User Roles & Permissions
- **User**: Basic access to community and content
- **Moderator**: Can moderate community posts and comments
- **Admin**: Can manage users, content, and freebies
- **Super Admin**: Full system access including sensitive operations

### Tier System Implementation
- **Grassroot**: Basic tier, access to free content and basic freebies
- **Pioneer**: Mid-tier, access to some premium content and better freebies
- **Elder**: High-tier, access to most premium content and exclusive freebies
- **Blood**: Top tier, access to all content and limited edition items

## API Endpoints Structure

### Authentication Endpoints
\`\`\`
POST /api/auth/login - User login with credentials
POST /api/auth/signup - User registration
POST /api/auth/logout - User logout
GET /api/auth/user - Get current user profile
PUT /api/auth/profile - Update user profile
\`\`\`

### Community Endpoints
\`\`\`
GET /api/community/posts - Get community posts with pagination
POST /api/community/posts - Create new post
PUT /api/community/posts/[id] - Update post
DELETE /api/community/posts/[id] - Delete post
POST /api/community/posts/[id]/vote - Vote on post
GET /api/community/posts/[id]/comments - Get post comments
POST /api/community/posts/[id]/comments - Add comment
PUT /api/community/comments/[id] - Update comment
DELETE /api/community/comments/[id] - Delete comment
POST /api/community/comments/[id]/like - Like comment
\`\`\`

### Freebies & Merchandise Endpoints
\`\`\`
GET /api/freebies - Get available freebies (tier-filtered)
POST /api/freebies/claim - Claim a freebie
GET /api/freebies/claims - Get user's freebie claims
GET /api/products - Get merchandise products
POST /api/products/purchase - Purchase product
\`\`\`

### Admin Endpoints
\`\`\`
GET /api/admin/stats - Get platform statistics
GET /api/admin/users - Get all users (paginated)
PUT /api/admin/users/[id] - Update user (role, tier, status)
GET /api/admin/freebies - Get all freebies
POST /api/admin/freebies - Create new freebie
PUT /api/admin/freebies/[id] - Update freebie
DELETE /api/admin/freebies/[id] - Delete freebie
GET /api/admin/claims - Get all freebie claims
PUT /api/admin/claims/[id] - Update claim status
\`\`\`

### Coin System Endpoints
\`\`\`
GET /api/coins/balance - Get user coin balance
POST /api/coins/purchase - Purchase coins with Paystack
POST /api/coins/withdraw - Withdraw coins to bank account
GET /api/coins/transactions - Get transaction history
\`\`\`

## Database Functions & Triggers

### Essential Functions
\`\`\`sql
-- get_or_create_user_profile(uuid) - Auto-create user profile on signup
-- increment_post_votes(bigint) - Safely increment post vote count
-- decrement_post_votes(bigint) - Safely decrement post vote count
-- increment_comment_likes(bigint) - Safely increment comment likes
-- decrement_comment_likes(bigint) - Safely decrement comment likes
-- handle_coin_transaction(bigint, integer, text) - Process coin transactions
-- check_tier_access(user_tier, user_tier) - Validate tier-based access
\`\`\`

### Triggers
\`\`\`sql
-- update_updated_at_column() - Auto-update timestamp on record changes
-- sync_user_profile_on_auth_change() - Sync profile when auth user changes
-- update_post_comment_count() - Update comment count when comments added/removed
-- validate_freebie_claim() - Validate claim eligibility before insertion
\`\`\`

## Storage Configuration

### Buckets Setup
\`\`\`sql
-- Create 'eriggalive-assets' bucket for user uploads
-- Configure public access for profile images and content
-- Set up folder structure: avatars/, covers/, posts/, freebies/, products/
-- Implement size limits and file type restrictions
\`\`\`

### Storage Policies
\`\`\`sql
-- Public read access for all assets
-- Authenticated users can upload to their own folders
-- Admins can manage all assets
-- Automatic cleanup of unused assets
\`\`\`

## Real-time Features

### Supabase Realtime Configuration
\`\`\`sql
-- Enable realtime on community_posts for live updates
-- Enable realtime on community_comments for live discussions
-- Enable realtime on notifications for instant alerts
-- Configure proper filters to prevent data leaks
\`\`\`

## Integration Requirements

### Payment Integration (Paystack)
- Secure webhook handling for payment confirmations
- Transaction verification and reconciliation
- Support for both one-time and recurring payments
- Proper error handling and retry mechanisms

### Email Integration
- Welcome emails for new users
- Notification emails for important events
- Password reset and email verification
- Admin alerts for critical issues

### File Upload Integration
- Image optimization and resizing
- Multiple format support (JPEG, PNG, WebP)
- Virus scanning for uploaded files
- CDN integration for fast delivery

## Performance Optimization

### Database Indexes
\`\`\`sql
-- Create indexes on frequently queried columns
-- Composite indexes for complex queries
-- Partial indexes for filtered queries
-- Regular index maintenance and analysis
\`\`\`

### Caching Strategy
- Redis caching for frequently accessed data
- Query result caching for expensive operations
- Session caching for user data
- CDN caching for static assets

## Monitoring & Analytics

### Database Monitoring
- Query performance tracking
- Connection pool monitoring
- Storage usage alerts
- Backup verification

### Application Monitoring
- API endpoint performance
- Error rate tracking
- User activity analytics
- Security event logging

## Security Measures

### Data Protection
- Encryption at rest and in transit
- PII data anonymization
- Secure password hashing
- Regular security audits

### Access Control
- Multi-factor authentication support
- Session management and timeout
- IP-based access restrictions
- Rate limiting on sensitive endpoints

## Deployment Configuration

### Environment Variables
\`\`\`env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PAYSTACK_SECRET_KEY=your_paystack_secret
PAYSTACK_PUBLIC_KEY=your_paystack_public
NEXT_PUBLIC_APP_URL=your_app_url
JWT_SECRET=your_jwt_secret
\`\`\`

### Database Migrations
- Version-controlled schema changes
- Rollback procedures for failed migrations
- Data migration scripts for schema updates
- Testing procedures for migration validation

## Testing Strategy

### Database Testing
- Unit tests for all functions and triggers
- Integration tests for complex workflows
- Performance tests for high-load scenarios
- Security tests for access control

### API Testing
- Endpoint functionality tests
- Authentication and authorization tests
- Error handling and edge case tests
- Load testing for scalability validation

## Documentation Requirements

### API Documentation
- Complete endpoint documentation with examples
- Authentication flow documentation
- Error code reference
- Rate limiting information

### Database Documentation
- Schema documentation with relationships
- Function and trigger documentation
- Index and performance optimization guide
- Backup and recovery procedures

## Implementation Priority

### Phase 1 (Core Features)
1. User authentication and profile management
2. Basic community features (posts, comments, voting)
3. Tier system implementation
4. Basic admin dashboard

### Phase 2 (Enhanced Features)
1. Freebies system with claims management
2. Coin economy with Paystack integration
3. Advanced community features (mentions, hashtags)
4. Comprehensive admin tools

### Phase 3 (Advanced Features)
1. Real-time notifications and updates
2. Advanced analytics and reporting
3. Mobile app API optimization
4. Performance monitoring and optimization

## Success Metrics

### Technical Metrics
- API response time < 200ms for 95% of requests
- Database query performance < 100ms average
- 99.9% uptime availability
- Zero data loss incidents

### Business Metrics
- User engagement rate > 70%
- Community post interaction rate > 50%
- Freebie claim completion rate > 80%
- Admin task completion efficiency > 90%

This comprehensive setup will create a robust, scalable backend for the Erigga Live platform with all necessary features for user management, community interaction, commerce, and administration.
