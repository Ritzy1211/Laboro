'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard,
  Globe,
  Palette,
  Key,
  Smartphone,
  Mail,
  Moon,
  Sun,
  Monitor,
  Check,
  ChevronRight,
  AlertTriangle,
  Download
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Settings sections
const settingsSections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weekly: true,
    marketing: false,
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <section.icon className="w-4 h-4" />
                    {section.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Area */}
        <motion.div variants={itemVariants} className="lg:col-span-3 space-y-6">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and public profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarFallback className="text-xl">JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <Button variant="outline" size="sm">Change Avatar</Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        JPG, PNG or GIF. Max 2MB.
                      </p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <Input defaultValue="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input defaultValue="john@example.com" type="email" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone</label>
                      <Input defaultValue="+1 (555) 123-4567" type="tel" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Timezone</label>
                      <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                        <option>America/New_York (EST)</option>
                        <option>America/Los_Angeles (PST)</option>
                        <option>Europe/London (GMT)</option>
                        <option>Asia/Tokyo (JST)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    <textarea
                      className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      placeholder="Tell us about yourself..."
                      defaultValue="Full-stack developer with 5+ years of experience in React and Node.js."
                    />
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button>Save Changes</Button>
                </CardFooter>
              </Card>

              {/* Skills & Languages */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills & Languages</CardTitle>
                  <CardDescription>
                    Update your professional skills and spoken languages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'].map((skill) => (
                        <Badge key={skill} variant="secondary" className="gap-1">
                          {skill}
                          <button className="ml-1 hover:text-destructive">×</button>
                        </Badge>
                      ))}
                      <Button variant="outline" size="sm">+ Add Skill</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Languages</label>
                    <div className="flex flex-wrap gap-2">
                      {['English (Native)', 'Spanish (Fluent)'].map((lang) => (
                        <Badge key={lang} variant="secondary" className="gap-1">
                          {lang}
                          <button className="ml-1 hover:text-destructive">×</button>
                        </Badge>
                      ))}
                      <Button variant="outline" size="sm">+ Add Language</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    id: 'email',
                    icon: Mail,
                    title: 'Email Notifications',
                    description: 'Receive notifications via email',
                  },
                  {
                    id: 'push',
                    icon: Bell,
                    title: 'Push Notifications',
                    description: 'Receive push notifications in your browser',
                  },
                  {
                    id: 'weekly',
                    icon: Globe,
                    title: 'Weekly Digest',
                    description: 'Receive a weekly summary of your activity',
                  },
                  {
                    id: 'marketing',
                    icon: Smartphone,
                    title: 'Marketing Emails',
                    description: 'Receive updates about new features and promotions',
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications((prev) => ({
                          ...prev,
                          [item.id]: !prev[item.id as keyof typeof prev],
                        }))
                      }
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        notifications[item.id as keyof typeof notifications]
                          ? 'bg-primary'
                          : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          notifications[item.id as keyof typeof notifications]
                            ? 'translate-x-5'
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Appearance Section */}
          {activeSection === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light', icon: Sun, label: 'Light' },
                      { id: 'dark', icon: Moon, label: 'Dark' },
                      { id: 'system', icon: Monitor, label: 'System' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setTheme(option.id as typeof theme)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                          theme === option.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <option.icon className={`w-6 h-6 ${
                          theme === option.id ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <span className="text-sm font-medium">{option.label}</span>
                        {theme === option.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Language</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="ja">日本語</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Change your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Current Password</label>
                    <Input type="password" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <Input type="password" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm New Password</label>
                    <Input type="password" />
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button>Update Password</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Two-Factor Authentication
                  </CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">2FA is not enabled</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Protect your account with two-factor authentication
                      </p>
                    </div>
                    <Button>Enable 2FA</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                    <div>
                      <p className="font-medium">Export Your Data</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Download a copy of all your data
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                    <div>
                      <p className="font-medium text-destructive">Delete Account</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Billing Section */}
          {activeSection === 'billing' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>
                    Manage your subscription and billing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-6 rounded-lg border-2 border-primary bg-primary/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className="mb-2">Current Plan</Badge>
                        <h3 className="text-xl font-semibold">Professional</h3>
                        <p className="text-muted-foreground mt-1">
                          $49/month • Renews on Feb 15, 2024
                        </p>
                      </div>
                      <Button variant="outline">Change Plan</Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Jobs Posted</p>
                        <p className="text-2xl font-semibold">12 / 50</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Team Members</p>
                        <p className="text-2xl font-semibold">5 / 10</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Storage Used</p>
                        <p className="text-2xl font-semibold">2.4 GB</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>
                    Manage your payment methods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 rounded bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold">
                        VISA
                      </div>
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-sm text-muted-foreground">Expires 12/25</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Default</Badge>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-4">
                    + Add Payment Method
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { date: 'Jan 15, 2024', amount: '$49.00', status: 'Paid' },
                      { date: 'Dec 15, 2023', amount: '$49.00', status: 'Paid' },
                      { date: 'Nov 15, 2023', amount: '$49.00', status: 'Paid' },
                    ].map((invoice, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{invoice.date}</p>
                            <p className="text-sm text-muted-foreground">Professional Plan</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{invoice.amount}</span>
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            {invoice.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
