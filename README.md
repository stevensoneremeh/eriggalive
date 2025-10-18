# EriggaLive - Official Fan Platform

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/techcitybystevenson-4623s-projects/v0-eriggalive)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/Sp0x1FNZqDE)

## Overview

EriggaLive is a comprehensive fan platform featuring community interactions, media management, payment processing, and administrative tools. The platform includes mobile-responsive design, theme switching, secure payment webhooks, and a full-featured admin panel.

## 🌿 Branch Management

### Branches
- **main**: Production branch - deployed to [https://eriggalive.vercel.app](https://eriggalive.vercel.app)
- **new**: Development/Staging branch - deployed to preview URL on Vercel

### Switching Branches
```bash
# Switch to main (production)
git checkout main

# Switch to new (development)
git checkout new

# View branch info and URLs
bash scripts/branch-info.sh
```

### Deploying Changes
Both branches automatically deploy to Vercel on push:
```bash
# Deploy to production
git checkout main
git push origin main

# Deploy to staging
git checkout new
git push origin new
```

## 🚀 Recent Enhancements

### Mobile Responsive Community Pages
- **Fully responsive design** optimized for iOS Safari, Android Chrome, and desktop
- **Touch-friendly interactions** with proper spacing and sizing for mobile devices
- **Responsive navigation** with slide-out sidebar and mobile overlay
- **Adaptive layouts** using flexbox and CSS Grid with proper breakpoints
- **Mobile-first approach** ensuring optimal performance across all devices

### Theme Toggle with Logo Switching
- **Modern theme toggle** with Light, Dark, and System/Auto modes
- **Dynamic logo switching** - light logo for light theme, dark logo for dark theme
- **Persistent theme selection** using localStorage with next-themes integration
- **Akonan Dune 2 aesthetic** for dark mode with bronze/sepia monogram styling
- **Accessible theme controls** with proper ARIA labels and keyboard navigation

### Paystack Webhook for Balance Updates
- **Secure webhook endpoint** (`/api/paystack-webhook`) with HMAC-SHA512 signature verification
- **Atomic balance updates** using Supabase database functions for data consistency
- **Idempotency protection** preventing duplicate transaction processing
- **Real-time balance refresh** with SWR hooks for instant UI updates
- **Comprehensive error handling** and transaction logging

### Admin Pages with Media Upload
- **Protected admin routes** with Supabase Auth & RLS (Row Level Security)
- **Media upload system** with drag-and-drop support for images, videos, audio, and documents
- **Preview gallery** with grid/list view modes and bulk operations
- **User management** with search, filtering, and account statistics
- **Transaction monitoring** with status tracking and revenue analytics
- **Responsive admin interface** with mobile sidebar navigation

## 🛠️ Setup and Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account and project
- Paystack account for payment processing
- Vercel account for deployment (optional)

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Paystack Configuration
PAYSTACK_SECRET_KEY=your_paystack_secret_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback

# Theme and Branding
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your_google_verification_code
\`\`\`

### Database Setup

1. **Create Supabase Tables**
   \`\`\`sql
   -- Run the SQL scripts in the following order:
   -- 1. database/01-extensions-and-types.sql
   -- 2. database/02-core-tables.sql
   -- 3. supabase/migrations/001_branding_wallet_tx.sql
   -- 4. scripts/paystack-webhook-functions.sql
   \`\`\`

2. **Enable Row Level Security (RLS)**
   \`\`\`sql
   -- Enable RLS on all tables
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
   ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE wallet ENABLE ROW LEVEL SECURITY;
   \`\`\`

3. **Create Storage Buckets**
   \`\`\`sql
   -- Create media storage bucket
   INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);
   \`\`\`

### Installation Steps

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/your-username/eriggalive.git
   cd eriggalive
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   \`\`\`

4. **Run database migrations**
   \`\`\`bash
   # Execute SQL scripts in your Supabase dashboard
   # Or use the Supabase CLI:
   supabase db push
   \`\`\`

5. **Start the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 Configuration

### Paystack Webhook Setup

1. **Configure webhook URL in Paystack Dashboard**
   - URL: `https://yourdomain.com/api/paystack-webhook`
   - Events: `charge.success`, `transfer.success`

2. **Test webhook locally using ngrok**
   \`\`\`bash
   # Install ngrok
   npm install -g ngrok
   
   # Expose local server
   ngrok http 3000
   
   # Use the ngrok URL for webhook testing
   # Example: https://abc123.ngrok.io/api/paystack-webhook
   \`\`\`

### Admin Access Setup

1. **Create admin user in Supabase**
   \`\`\`sql
   -- Update user role to admin
   UPDATE profiles SET role = 'admin' WHERE email = 'admin@yourdomain.com';
   \`\`\`

2. **Access admin panel**
   - Navigate to `/admin` after signing in as admin user
   - Admin routes are protected by RLS policies

### Theme Configuration

1. **Upload logo files**
   - Light theme logo: `/public/images/erigga-live-logo.png`
   - Dark theme logo: `/public/images/erigga-live-logo-dark.png`

2. **Customize theme colors**
   - Edit `app/globals.css` for custom CSS variables
   - Modify `tailwind.config.ts` for Tailwind theme extensions

## 📱 Mobile Optimization

### Responsive Breakpoints
- **Mobile**: `< 640px` (sm)
- **Tablet**: `640px - 1024px` (md/lg)
- **Desktop**: `1024px+` (xl)

### Touch-Friendly Design
- Minimum touch target size: 44px × 44px
- Proper spacing between interactive elements
- Swipe gestures for navigation
- Optimized keyboard and form inputs

### Performance Optimizations
- Image optimization with Next.js Image component
- Lazy loading for media content
- Efficient bundle splitting
- Service worker for offline functionality

## 🔐 Security Features

### Authentication & Authorization
- Supabase Auth with email/password
- Row Level Security (RLS) policies
- Protected admin routes
- Session management with automatic refresh

### Payment Security
- Webhook signature verification
- Idempotent transaction processing
- Secure environment variable handling
- PCI DSS compliance through Paystack

### Data Protection
- Input sanitization and validation
- SQL injection prevention
- XSS protection
- CSRF token validation

## 🧪 Testing

### Manual Testing Checklist

#### Mobile Responsiveness
- [ ] Community pages load correctly on mobile devices
- [ ] Navigation sidebar works on touch devices
- [ ] Forms are usable on small screens
- [ ] Images and media scale properly
- [ ] Touch targets are appropriately sized

#### Theme Toggle
- [ ] Theme toggle switches between light/dark/system modes
- [ ] Logo changes correctly with theme
- [ ] Theme preference persists across sessions
- [ ] All components respect theme colors
- [ ] Accessibility standards are met

#### Paystack Integration
- [ ] Payment flow completes successfully
- [ ] Webhook receives and processes events
- [ ] User balance updates after payment
- [ ] Transaction records are created
- [ ] Error handling works for failed payments

#### Admin Panel
- [ ] Admin authentication works correctly
- [ ] Media upload accepts various file types
- [ ] File preview and deletion functions work
- [ ] User management displays correct data
- [ ] Transaction monitoring shows accurate information

### Automated Testing

Run the test suite:
\`\`\`bash
npm run test
# or
yarn test
\`\`\`

### Load Testing

Test webhook performance:
\`\`\`bash
# Install artillery for load testing
npm install -g artillery

# Run webhook load test
artillery run tests/webhook-load-test.yml
\`\`\`

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**
   \`\`\`bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel --prod
   \`\`\`

2. **Configure environment variables in Vercel dashboard**
   - Add all environment variables from `.env.local`
   - Ensure webhook URLs use production domain

3. **Set up custom domain (optional)**
   - Configure DNS settings
   - Enable SSL certificate
   - Update Paystack webhook URLs

### Manual Deployment

1. **Build the application**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Start production server**
   \`\`\`bash
   npm start
   \`\`\`

### Post-Deployment Checklist
- [ ] All environment variables are set
- [ ] Database migrations are applied
- [ ] Paystack webhooks are configured
- [ ] Admin access is working
- [ ] SSL certificate is active
- [ ] Performance monitoring is enabled

## 📊 Monitoring and Analytics

### Performance Monitoring
- Vercel Analytics for page performance
- Supabase Dashboard for database metrics
- Custom logging for webhook events

### Error Tracking
- Console logging for development
- Structured error handling
- User feedback collection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Contact the development team
- Check the [v0.dev documentation](https://v0.dev/docs)

## 🔗 Links

- **Live Application**: [https://vercel.com/techcitybystevenson-4623s-projects/v0-eriggalive](https://vercel.com/techcitybystevenson-4623s-projects/v0-eriggalive)
- **v0.dev Project**: [https://v0.dev/chat/projects/Sp0x1FNZqDE](https://v0.dev/chat/projects/Sp0x1FNZqDE)
- **Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
- **Paystack Dashboard**: [https://dashboard.paystack.com](https://dashboard.paystack.com)

---

Built with ❤️ using [v0.dev](https://v0.dev), Next.js, Supabase, and Paystack.
