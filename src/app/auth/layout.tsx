import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your LABORO account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-700" />
        <div className="absolute inset-0 opacity-10">
          {/* Grid pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }} />
        </div>
        
        <div className="relative z-10 p-12 flex flex-col justify-between h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <span className="text-2xl font-semibold text-white">LABORO</span>
          </div>

          {/* Main Content */}
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white mb-6">
              Connect with global talent, seamlessly.
            </h1>
            <p className="text-lg text-brand-100">
              The enterprise-grade platform for managing distributed teams across time zones. Trusted by leading companies worldwide.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-12">
            <div>
              <p className="text-3xl font-bold text-white">150+</p>
              <p className="text-brand-200">Countries</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">50K+</p>
              <p className="text-brand-200">Workers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">99.9%</p>
              <p className="text-brand-200">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
