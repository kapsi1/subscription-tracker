import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Complete your registration by verifying your email address.',
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
