# LABORO

A premium, enterprise-ready global work platform with a classic, minimal, and timeless UI. Enterprise-grade UX comparable to Stripe, Linear, or Notion, optimized for global users across time zones.

## 🌟 Features

### Core Platform
- **Role-Based UI**: Dynamic interfaces for Workers, Clients, and Enterprise Admins
- **Global Timezone Support**: Time-zone aware UI components with overlap visualization
- **Enterprise Data Tables**: Advanced sorting, filtering, and bulk actions
- **Reliability Scoring**: Trust and verification system for workers
- **Skill Management**: Tag-based skill system with proficiency levels

### User Experience
- **Classic, Minimal Design**: Professional enterprise aesthetic
- **WCAG AA Accessibility**: Full accessibility compliance
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Smooth Animations**: Framer Motion powered transitions
- **Dark Mode Support**: System-aware theme switching

### Technical Excellence
- **Type-Safe**: Full TypeScript implementation
- **i18n Ready**: Internationalization infrastructure with English and Spanish
- **Optimized Performance**: React Query caching, code splitting
- **Modern Architecture**: Next.js 14 App Router with Server Components

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14.1.0 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: TailwindCSS with custom design tokens
- **State Management**: Zustand with persist middleware
- **Server State**: TanStack Query (React Query)
- **Animations**: Framer Motion
- **Components**: Radix UI Primitives

### Design System
- **Color Palette**: Enterprise slate-based theme with blue accents
- **Typography**: Inter font family
- **Icons**: Lucide React
- **Variants**: Class Variance Authority (CVA)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Authenticated routes
│   │   ├── admin/          # Enterprise admin console
│   │   ├── client/         # Client dashboard
│   │   ├── worker/         # Worker dashboard
│   │   ├── jobs/           # Job management
│   │   │   └── create/     # Job creation wizard
│   │   ├── settings/       # User settings
│   │   └── dashboard/      # Main dashboard
│   ├── auth/               # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── providers.tsx       # Client providers
│
├── components/
│   ├── ui/                 # Base UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── modal.tsx
│   │   ├── drawer.tsx
│   │   ├── toast.tsx
│   │   └── card.tsx
│   ├── layout/             # Layout components
│   │   ├── global-header.tsx
│   │   └── sidebar-nav.tsx
│   └── features/           # Feature components
│       ├── skill-tag-system.tsx
│       ├── reliability-score-badge.tsx
│       ├── timezone-visualizer.tsx
│       ├── availability-scheduler.tsx
│       └── enterprise-data-table.tsx
│
├── hooks/                  # Custom React hooks
│   ├── use-auth.ts         # Authentication hooks
│   ├── use-jobs.ts         # Job/Task hooks
│   └── use-common.ts       # Utility hooks
│
├── lib/                    # Utilities
│   ├── utils.ts            # General utilities
│   ├── timezone.ts         # Timezone utilities
│   └── i18n.tsx            # Internationalization
│
├── locales/                # Translation files
│   ├── en.json
│   └── es.json
│
├── services/               # API services
│   ├── api-client.ts       # Base API client
│   ├── auth-service.ts     # Auth endpoints
│   ├── user-service.ts     # User endpoints
│   └── job-service.ts      # Job/Task endpoints
│
├── stores/                 # Zustand stores
│   ├── auth-store.ts       # Authentication state
│   ├── ui-store.ts         # UI preferences
│   └── notification-store.ts
│
├── styles/
│   ├── globals.css         # Global styles & CSS vars
│   └── tokens.ts           # Design tokens
│
└── types/                  # TypeScript types
    ├── index.ts            # Core types
    └── components.ts       # Component props
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/laboro.git
cd laboro

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📖 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Create production build
npm run start    # Start production server
npm run lint     # Run ESLint
npm run type-check  # Run TypeScript compiler check
```

## 🎨 Design System

### Colors

The design system uses a muted enterprise palette:

- **Primary**: Blue-500 (#3b82f6)
- **Background**: Slate-50/Slate-950
- **Foreground**: Slate-900/Slate-50
- **Muted**: Slate-100/Slate-800
- **Accent**: Slate-100/Slate-800
- **Destructive**: Red-500

### Typography

- **Font Family**: Inter
- **Headings**: Semibold weight
- **Body**: Regular weight
- **Monospace**: JetBrains Mono (code blocks)

### Components

All components follow CVA (Class Variance Authority) patterns for consistent variants:

```tsx
import { Button } from '@/components/ui/button';

// Variants: default, secondary, outline, ghost, link, destructive
// Sizes: sm, md, lg
<Button variant="outline" size="sm">Click me</Button>
```

## 🌐 Internationalization

The platform supports multiple languages via the i18n system:

```tsx
import { useTranslation } from '@/lib/i18n';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('common.welcome')}</h1>;
}
```

### Adding a New Language

1. Create a new JSON file in `src/locales/` (e.g., `fr.json`)
2. Add the locale to `src/lib/i18n.tsx`
3. Update `localeMetadata` with display information

## 🔐 Authentication

The platform uses JWT-based authentication with Zustand persistence:

```tsx
import { useAuthStore } from '@/stores';
import { useLogin } from '@/hooks';

function LoginForm() {
  const login = useLogin();
  const { isAuthenticated, user } = useAuthStore();
  
  // Login mutation will automatically update store
  login.mutate({ email, password });
}
```

## 📊 State Management

### Zustand Stores

- **auth-store**: User authentication state
- **ui-store**: Theme, sidebar, breakpoints
- **notification-store**: Toast notifications

### React Query

Server state is managed with TanStack Query:

```tsx
import { useSearchJobs } from '@/hooks';

function JobList() {
  const { data, isLoading } = useSearchJobs({ skills: ['React'] });
  // ...
}
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## 📦 Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

### Docker

```bash
docker build -t laboro .
docker run -p 3000:3000 laboro
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript strict mode
- Use functional components
- Prefer hooks over class components
- Follow the existing file structure

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Design inspired by Stripe, Linear, and Notion
- Built with the amazing Next.js framework
- UI primitives from Radix UI
- Icons from Lucide

---

Built with ❤️ by the Laboro Team
