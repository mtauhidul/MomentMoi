# MomentMoi - Event Planning Platform

A sophisticated event planning platform built with Next.js 14, TypeScript, TailwindCSS, and Supabase. The platform serves both event planners and vendors providing services for various event types including Weddings, Christenings, Parties, and Kid's Parties.

## 🎯 Project Overview

MomentMoi is a comprehensive event planning platform that helps users plan and organize various types of events. The platform provides tools for event management, vendor discovery, guest management, and planning coordination.

## 🏗️ Architecture & Technology Stack

### Core Technologies

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS with custom design system
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth
- **UI Components**: Radix UI primitives + custom components
- **Icons**: Lucide React
- **State Management**: React Context + Supabase real-time

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components
│   ├── ui/                # Base UI components (Radix + custom)
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   └── features/          # Feature-specific components
├── lib/                   # Utilities and configurations
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── styles/                # Global styles and Tailwind config
```

## 🎨 Design System Implementation

### Color Palette

```typescript
// Primary - Sophisticated Teal
primary: {
  50: '#f0f9f9',
  100: '#cceceb',
  200: '#99d8d6',
  300: '#66c4c1',
  400: '#5a9b99',
  500: '#507c7b', // Main primary
  600: '#456a69',
  700: '#3a5757',
  800: '#2f4545',
  900: '#243333'
}

// Secondary - Warm Accent
secondary: {
  50: '#faf9f7',
  100: '#f4f1ed',
  200: '#e8e1d9',
  300: '#dcd1c5',
  400: '#c5b8a8',
  500: '#a89d8e', // Main secondary
  600: '#8b8075',
  700: '#6e635c',
  800: '#514743',
  900: '#342a2a'
}

// System Colors
background: '#f1f0ef',
surface: '#fafafa',
border: '#eeeeee',
text: {
  primary: '#212121',
  secondary: '#616161',
  muted: '#9e9e9e'
}
```

### Typography

- **Headings**: Ivy Presto Display (Light 300)
- **Body**: Lato (Regular 400, Bold 700)
- **Scale**: Follow Tailwind's text scale (xs to 7xl)

### Component Guidelines

- Use Radix UI primitives for accessibility
- Implement mobile-first responsive design
- Follow WCAG 2.1 AA accessibility standards
- Use consistent spacing (Tailwind spacing scale)
- Implement proper loading states and error handling

## 🗄️ Database Schema Rules

### Core Tables Structure

```sql
-- Users and Profiles
profiles (id, email, full_name, user_type, avatar_url, created_at)
planner_profiles (id, user_id, partner_id, partner_name, partner_email)
vendor_profiles (id, user_id, business_name, description, logo_url, verified)

-- Event Management
events (id, planner_id, event_type, event_date, location, guest_count, event_style, budget_range, planning_stage)
guests (id, event_id, name, email, phone, rsvp_status, dietary_restrictions)

-- Vendor System
service_categories (id, name, icon, description, event_types)
vendor_services (id, vendor_id, category_id, name, description, pricing_model, event_types)

-- Planning Tools
checklist_items (id, event_id, title, description, due_date, completed)
budget_items (id, event_id, category, name, estimated_cost, actual_cost)
```

### Event Types Supported

- **Weddings**: Traditional and modern wedding planning
- **Christenings**: Religious and secular christening ceremonies
- **Parties**: Various party types including birthdays, anniversaries, corporate events
- **Kid's Parties**: Children's birthday parties and celebrations

### Security Rules

- Implement Row Level Security (RLS) on ALL tables
- Users can only access their own data
- Planners can access shared event data
- Vendors can only access their own business data
- Public event sites use separate, limited access

## 🔐 Authentication & Authorization

### User Types

- **Planners**: Primary event planners with partner linking
- **Vendors**: Service providers with business profiles
- **Viewers**: Users who browse and favorite vendors (no planning functionality)
- **Guests**: Limited access for RSVP functionality

### Auth Flow Rules

- Email/password authentication with Supabase
- Email verification required for all accounts
- Partner invitation system for planners
- Protected routes based on user type
- Session management with proper logout handling
- Onboarding flow after first login (viewers: location preference, planners/vendors: detailed setup)

## 📱 Component Development Rules

### Form Components

- Use React Hook Form for form management
- Implement proper validation with Zod schemas
- Show validation errors inline
- Use floating labels for better UX
- Implement proper loading states during submission

### Data Display Components

- Use skeleton loaders for loading states
- Implement proper error boundaries
- Use optimistic updates where appropriate
- Implement proper pagination for large datasets
- Use proper ARIA labels for accessibility

### Navigation Components

- Implement role-based navigation
- Use breadcrumbs for deep navigation
- Implement proper active states
- Mobile-first responsive design
- Proper focus management

## 🚀 Development Phases (MVP Focus)

### Phase 1: Foundation (Weeks 1-3)

- [ ] Next.js 14 setup with TypeScript
- [ ] TailwindCSS with custom theme
- [ ] Supabase project and auth setup
- [ ] Basic layout and navigation

### Phase 2: Event Profiles (Weeks 4-5)

- [x] Basic profile management with onboarding
- [x] Viewer onboarding flow (location preference)
- [ ] Planner onboarding flow (partner info, event details)
- [ ] Vendor onboarding flow (business details, services)
- [ ] Event dashboard with countdown

### Phase 3: Guest Management (Weeks 6-7)

- [ ] Guest list management
- [ ] RSVP collection system
- [ ] Guest count tracking

### Phase 4: Vendor System (Weeks 8-10)

- [ ] Vendor profiles and services
- [ ] Vendor discovery and filtering
- [ ] Vendor bookmarking system

### Phase 5: Planning Tools (Weeks 11-12)

- [ ] Event checklist system
- [ ] Basic budget tracking
- [ ] Progress monitoring

### Phase 6: Polish & Launch (Weeks 13-14)

- [ ] End-to-end testing
- [ ] Mobile optimization
- [ ] Production deployment

## 🧪 Testing & Quality Rules

### Code Quality

- Use TypeScript strict mode
- Implement proper error handling
- Use ESLint and Prettier
- Write meaningful commit messages
- Follow React best practices

### Testing Requirements

- Unit tests for utility functions
- Component tests for critical UI
- Integration tests for user flows
- E2E tests for complete journeys
- Security testing for RLS policies

### Performance Rules

- Optimize images with Next.js Image component
- Implement proper code splitting
- Use React.memo for expensive components
- Optimize database queries
- Monitor Core Web Vitals

## 🎯 Feature Implementation Rules

### Event Management

- Multiple events per planner
- Event type-specific features and templates
- Basic venue and date information
- Simple event dashboard
- Countdown to event date

### Viewer Experience

- Browse vendors without planning functionality
- Save vendors to favorites
- Location-based vendor discovery
- Simple onboarding (optional location preference)

### Guest Management

- Manual guest entry
- Basic RSVP status tracking
- Public RSVP collection page
- Guest count summaries

### Vendor System

- Vendor registration and profiles
- Service category filtering by event type
- Location-based search
- Vendor bookmarking
- Email contact system

### Planning Tools

- Pre-defined checklist templates by event type
- Basic budget categories
- Progress tracking
- Simple task management

## 🔧 Development Workflow

### Git Workflow

- Feature branches from main
- Descriptive branch names (feature/, fix/, etc.)
- Pull request reviews required
- Squash commits on merge

### Code Organization

- Feature-based folder structure
- Shared components in /components/ui
- Custom hooks for reusable logic
- Type definitions in /types
- Utility functions in /lib

### Environment Management

- Development, staging, production environments
- Environment-specific Supabase projects
- Proper .env file management
- Never commit sensitive data

## 🚨 Security & Privacy Rules

### Data Protection

- All user data encrypted at rest
- HTTPS only in production
- Proper session management
- Regular security audits
- GDPR compliance considerations

### Input Validation

- Validate all user inputs
- Sanitize data before database storage
- Implement rate limiting
- Prevent SQL injection
- Validate file uploads

## 📊 Performance & Monitoring

### Performance Targets

- Lighthouse score >90
- First Contentful Paint <1.5s
- Largest Contentful Paint <2.5s
- Cumulative Layout Shift <0.1

### Monitoring

- Error tracking with Sentry
- Performance monitoring
- User analytics (privacy-compliant)
- Database query monitoring

## 🎨 UI/UX Guidelines

### Design Principles

- Sophisticated elegance with modern functionality
- Mobile-first responsive design
- Accessibility as a core requirement
- Consistent visual hierarchy
- Thoughtful micro-interactions

### Animation Rules

- Subtle, purposeful animations
- Respect user's motion preferences
- Use CSS transforms for performance
- Implement proper loading states
- Celebration animations for milestones

### Accessibility Requirements

- WCAG 2.1 AA compliance
- Proper color contrast ratios
- Keyboard navigation support
- Screen reader compatibility
- Focus management in modals

## 🔄 State Management Rules

### Local State

- Use React useState for component state
- Use React useReducer for complex state
- Keep state as close to usage as possible
- Avoid prop drilling

### Global State

- Use React Context for auth state
- Use Supabase real-time for live updates
- Implement optimistic updates
- Handle loading and error states

### Data Fetching

- Use SWR or React Query for caching
- Implement proper error boundaries
- Show loading states during fetches
- Handle offline scenarios

## 📝 Documentation Rules

### Code Documentation

- JSDoc comments for complex functions
- README files for major features
- API documentation for endpoints
- Component storybook documentation

### User Documentation

- User onboarding guides
- Feature tutorials
- FAQ sections
- Help center content

## 🚀 Deployment Rules

### Vercel Deployment Setup

#### 1. Environment Variables

Before deploying to Vercel, you need to configure the following environment variables in your Vercel project dashboard:

**Required Environment Variables:**

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `DATABASE_URL` - Your database connection string

**Setting up Environment Variables in Vercel:**

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each environment variable with the appropriate values
4. Make sure to set them for Production, Preview, and Development environments

**Getting Supabase Values:**

- Go to your Supabase project dashboard
- Navigate to Settings → API
- Copy the Project URL and anon public key

#### 2. Database Setup

Ensure your Supabase database is properly configured:

- Run Prisma migrations: `npx prisma migrate deploy`
- Seed the database if needed: `npm run db:seed`

#### 3. Build Configuration

The project includes automatic Prisma client generation during build:

- `vercel.json` configures the build process
- `postinstall` script generates Prisma client after dependency installation
- Build command includes `prisma generate && next build`

### Production Deployment

- Vercel for hosting
- Supabase for database
- Environment variable management
- Domain and SSL setup
- CDN for static assets

### Monitoring Setup

- Error tracking
- Performance monitoring
- User analytics
- Database monitoring
- Uptime monitoring

---

**Remember**: This is an MVP-focused development approach. Start simple, build core functionality first, and add complexity incrementally. Focus on user value over feature richness, and test with real users early and often.
