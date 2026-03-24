import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Log in to your SubTracker account to manage your subscriptions.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
