# EriggaLive - Official Fan Platform

## Overview

EriggaLive is a comprehensive fan platform for the Nigerian artist Erigga, built as a Next.js application with TypeScript. The platform features community interactions, media management, payment processing, and administrative tools with a mobile-responsive design and theme switching capabilities. It serves as a complete ecosystem for fan engagement including user tiers, coin-based economy, media content, and real-time community features.

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
- **Real-time Features**: Supabase real-time subscriptions for live updates
- **File Storage**: Supabase Storage for media files with organized bucket structure

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