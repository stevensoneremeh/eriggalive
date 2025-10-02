# EriggaLive - Official Fan Platform

## Overview

EriggaLive is a comprehensive fan platform for the Nigerian artist Erigga, built as a Next.js application with TypeScript. The platform features community interactions, media management, payment processing, and administrative tools with a mobile-responsive design and theme switching capabilities. It serves as a complete ecosystem for fan engagement including user tiers, coin-based economy, media content, and real-time community features.

## Recent Changes

### October 2, 2025 - Enhanced Admin Dashboard & Live Features
- **Database Schema**: Created comprehensive database tables
  - `homepage` - Content sections (hero, featured, announcements)
  - `merch` - Product catalog with pricing, stock, categories
  - `media` - Media library for images, audio, videos
  - `radio` - Radio stream management with schedules
  - `videos` - Chronicles and Vault video content
  - `tiers` - Subscription tier configuration
  - `live_streams` - Mux audio/video streaming with playback IDs
  - `vault_items` - Tier-restricted exclusive content
  - `meet_greet_bookings` - Daily.co video call bookings with Paystack payment
  - `homepage_media` - Hero section media (images/videos)
- **API Routes**: Complete CRUD endpoints with authorization
  - `/api/admin/products` - Merch management
  - `/api/admin/homepage` - Homepage content
  - `/api/admin/radio-streams` - Radio configuration
  - `/api/admin/users-management` - User tier and role management
  - `/api/admin/vault-items` - Vault content with tier access
  - `/api/admin/live-streams` - Mux streaming management
  - `/api/admin/homepage-media` - Hero section media
  - `/api/meet-greet/book` - Paystack payment integration
  - `/api/meet-greet/verify-payment` - Daily.co room creation
- **Admin Features**:
  - User Management - Update user tiers, roles, and status
  - Vault Management - Content with tier-based access control
  - Live Streaming (Mux) - Create audio/video streams with stream keys
  - Homepage Media - Manage hero section photos and videos
  - Merch, Radio, Videos, Tiers - Full CRUD operations
- **Live Streaming (Mux)**:
  - Admin creates streams with Mux API integration
  - Automatic stream key and playback ID generation
  - Radio page displays active Mux streams
  - Support for both audio and video streams
- **Meet & Greet**:
  - Paystack payment integration (₦50,000 default)
  - Daily.co video call room creation on payment
  - Booking management with status tracking
  - Direct video call links for confirmed bookings
- **Authorization**: Email-based control for `info@eriggalive.com`
  - Server-side API protection
  - Client-side admin guard
  - RLS policies for all admin tables
- **Status**: Full admin dashboard with live streaming and booking features operational

### September 12, 2025 - Replit Environment Setup
- **Initial Import**: Successfully imported GitHub project and configured for Replit environment
- **Dependencies**: Installed all Node.js dependencies using pnpm (preferred package manager)
- **Frontend Configuration**: Set up Next.js development server on port 5000 with proper host binding (0.0.0.0)
- **Environment Variables**: Created .env.local with development defaults and Replit domain configuration
- **Deployment Setup**: Configured autoscale deployment with npm build/start commands
- **Graceful Fallbacks**: Application handles missing Supabase environment variables gracefully with mock clients
- **Status**: Application is running successfully and ready for use

### September 14, 2025 - Supabase Connection Issue Resolution
- **Issue Identified**: Application was attempting to connect to unavailable Supabase instance causing connection timeouts and 503 errors
- **Solution Implemented**: 
  - Created .env.local with fallback environment variables to prevent problematic connections
  - Enhanced error handling in auth context with timeout protection (5s for profile fetch, 3s for session refresh)
  - Improved graceful degradation to "offline mode" when Supabase is unavailable
  - Added better logging with user-friendly warning messages instead of errors
- **Result**: Eliminated connection timeout errors and 503 failures, application runs smoothly in offline mode
- **Status**: Application is stable and handles network issues gracefully

### September 14, 2025 - Community Features Removal
- **Task Completed**: Successfully removed all community-related features from the EriggaLive platform
- **Components Removed**: 
  - Community pages (/app/community/), layouts, and components
  - Community API routes and context providers
  - Navigation references to community features
- **Navigation System Updated**: 
  - Fixed navigation to use explicit arrays instead of index-based references
  - Cleaned up imports and removed unused components
  - Ensured proper routing for all remaining features
- **Result**: Application maintains all functionality except community features, with stable navigation and no broken links
- **Status**: Application is fully functional without community features

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 14 with App Router and TypeScript
- **UI Library**: Tailwind CSS with shadcn/ui components for consistent design
- **State Management**: React Context API for authentication, theme, and community state
- **Theme System**: next-themes with custom theme provider supporting light, dark, and system modes
- **Responsive Design**: Mobile-first approach with breakpoint-specific layouts
- **Component Architecture**: Modular component structure with shared UI components

### Authentication & Authorization
- **Primary Auth**: Supabase Auth with JWT tokens and session management
- **User Profiles**: Custom user profiles linked to Supabase auth users
- **Tier-based Access**: Multi-tier membership system (grassroot, pioneer, elder, blood) with different access levels
- **Row Level Security**: Supabase RLS policies for data protection
- **Admin System**: Role-based access control for administrative functions

### Backend Architecture
- **API Routes**: Next.js API routes for server-side operations
- **Server Actions**: Next.js server actions for form handling and database operations
- **Middleware**: Custom middleware for session management and route protection
- **Error Handling**: Comprehensive error boundaries and logging system

### Database Design
- **Primary Database**: Supabase (PostgreSQL) with custom schema
- **Core Tables**: Users, community posts/comments, categories, transactions, media uploads
- **Admin Tables**: Homepage content, merch products, media library, radio streams, videos, subscription tiers
- **Real-time Features**: Supabase real-time subscriptions for live updates
- **File Storage**: Supabase Storage for media files with organized bucket structure
- **Security**: Row Level Security (RLS) policies restrict write access to info@eriggalive.com for admin tables

### Payment & Economy System
- **Payment Gateway**: Paystack integration for Nigerian payments
- **Virtual Currency**: Erigga Coins system with purchase/withdrawal capabilities
- **Webhooks**: Secure webhook handling for payment confirmations with HMAC verification
- **Balance Management**: Real-time balance updates with SWR for instant UI refresh

### Media Management
- **Upload System**: Multi-file upload with drag-and-drop support
- **File Types**: Support for images, videos, audio, and documents
- **Preview System**: Gallery view with grid/list modes
- **Storage Organization**: Structured file organization with user-based folders

### Community Features
- **Post System**: Rich text posts with media attachments and voting
- **Categories**: Organized content categorization with tier-based access
- **Real-time Chat**: Live community interactions with room-based conversations
- **Voting System**: Community-driven content ranking with coin rewards

## External Dependencies

### Core Services
- **Supabase**: Primary backend service providing authentication, database, storage, and real-time subscriptions
- **Paystack**: Payment processing for Nigerian market with webhook integration
- **Vercel**: Deployment platform with serverless functions and edge optimization

### Third-party Libraries
- **Framer Motion**: Animation library for smooth UI transitions and interactions
- **SWR**: Data fetching with caching, revalidation, and optimistic updates
- **React Hook Form**: Form handling with validation and error management
- **date-fns**: Date manipulation and formatting utilities
- **Lucide React**: Comprehensive icon library for consistent UI elements

### Development Tools
- **TypeScript**: Type safety and improved developer experience
- **ESLint & Prettier**: Code formatting and quality enforcement
- **Jest**: Testing framework with React Testing Library integration
- **Tailwind CSS**: Utility-first CSS framework with custom design system

### Media Processing
- **DOMPurify**: HTML sanitization for user-generated content security
- **Image Optimization**: Next.js built-in image optimization with custom video handling
- **File Upload**: Custom media upload utilities with validation and preprocessing

### Monitoring & Analytics
- **Error Boundaries**: React error boundaries for graceful error handling
- **Health Checks**: System health monitoring endpoints for service status
- **Feature Flags**: Custom feature flag system for controlled rollouts
