import Link from 'next/link';
import { 
  ArrowRight, 
  Globe, 
  Clock, 
  Shield, 
  Users, 
  Zap, 
  BarChart3,
  CheckCircle,
  Building2,
  Star,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-25 dark:bg-neutral-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                LABORO
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                Features
              </a>
              <a href="#enterprise" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                Enterprise
              </a>
              <a href="#pricing" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                Pricing
              </a>
              <a href="#about" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                About
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="btn btn-primary text-sm"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 to-transparent dark:from-brand-950/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Enterprise-ready platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight text-balance">
              The global work platform for{' '}
              <span className="text-gradient">distributed teams</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto text-balance">
              Connect with verified talent across time zones. Manage jobs, schedules, and payments with enterprise-grade security and reliability.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="btn btn-primary text-base px-8 py-3"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/demo"
                className="btn btn-secondary text-base px-8 py-3"
              >
                Request Demo
              </Link>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-500" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-500" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 border-y border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-8">
            TRUSTED BY LEADING ENTERPRISES WORLDWIDE
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-50">
            {/* Placeholder logos */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-24 bg-neutral-300 dark:bg-neutral-700 rounded" />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100">
              Everything you need for global work
            </h2>
            <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
              Powerful features designed for enterprises managing distributed workforces across multiple time zones.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Globe className="h-6 w-6" />,
                title: 'Global Talent Pool',
                description: 'Access verified workers from 150+ countries with skills matching your requirements.',
              },
              {
                icon: <Clock className="h-6 w-6" />,
                title: 'Time Zone Intelligence',
                description: 'Smart scheduling with real-time overlap visualization for seamless collaboration.',
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: 'Trust & Verification',
                description: 'Multi-layer verification including identity, skills, and background checks.',
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: 'Team Management',
                description: 'Role-based access control with enterprise SSO integration.',
              },
              {
                icon: <BarChart3 className="h-6 w-6" />,
                title: 'Analytics & Insights',
                description: 'Real-time dashboards with performance metrics and reliability scores.',
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: 'Instant Matching',
                description: 'AI-powered matching algorithm to find the perfect talent for your jobs.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="card p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section id="enterprise" className="py-20 lg:py-32 bg-neutral-900 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-600/20 text-brand-400 text-sm font-medium mb-6">
                <Building2 className="h-4 w-4" />
                Enterprise Ready
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Built for enterprise scale and security
              </h2>
              <p className="text-lg text-neutral-400 mb-8">
                LABORO provides the infrastructure, compliance, and support that large organizations require for managing global workforces.
              </p>
              <ul className="space-y-4">
                {[
                  'SOC 2 Type II certified',
                  'GDPR and CCPA compliant',
                  'Enterprise SSO (SAML, OIDC)',
                  'Dedicated account management',
                  'Custom SLAs and integrations',
                  '24/7 priority support',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-neutral-300">
                    <CheckCircle className="h-5 w-5 text-success-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href="/enterprise"
                  className="btn btn-primary text-base"
                >
                  Talk to Sales
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-brand-500/20 to-brand-700/20 rounded-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100">
              Loved by teams worldwide
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "LABORO transformed how we manage our distributed engineering team. The timezone features alone saved us countless hours.",
                author: "Sarah Chen",
                role: "VP Engineering",
                company: "TechCorp",
              },
              {
                quote: "The verification system gives us confidence in the talent we hire. We've scaled our operations globally with ease.",
                author: "Michael Roberts",
                role: "COO",
                company: "GlobalScale Inc",
              },
              {
                quote: "Finally, a platform that understands enterprise needs. The SSO integration and compliance features are exactly what we needed.",
                author: "Emma Williams",
                role: "IT Director",
                company: "Enterprise Solutions",
              },
            ].map((testimonial, index) => (
              <div key={index} className="card p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning-400 text-warning-400" />
                  ))}
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900" />
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-elevated p-8 md:p-12 text-center bg-gradient-to-br from-brand-600 to-brand-700 border-0">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to go global?
            </h2>
            <p className="text-lg text-brand-100 mb-8 max-w-2xl mx-auto">
              Join thousands of companies already using LABORO to manage their distributed workforce.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="btn bg-white text-brand-700 hover:bg-brand-50 text-base px-8 py-3"
              >
                Get Started Free
              </Link>
              <Link
                href="/demo"
                className="btn bg-brand-500 text-white hover:bg-brand-400 border border-brand-400 text-base px-8 py-3"
              >
                Schedule Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
                <span className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  LABORO
                </span>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                The enterprise-grade global work platform.
              </p>
            </div>
            {[
              {
                title: 'Product',
                links: ['Features', 'Enterprise', 'Pricing', 'Security'],
              },
              {
                title: 'Company',
                links: ['About', 'Blog', 'Careers', 'Contact'],
              },
              {
                title: 'Legal',
                links: ['Privacy', 'Terms', 'Cookie Policy', 'GDPR'],
              },
            ].map((column, index) => (
              <div key={index}>
                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  {column.title}
                </h4>
                <ul className="space-y-2">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href="#"
                        className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center text-sm text-neutral-500 dark:text-neutral-400">
            © {new Date().getFullYear()} LABORO. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
