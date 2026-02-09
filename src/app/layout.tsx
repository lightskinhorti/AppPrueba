import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChurnLens - Subscription Analytics for SaaS',
  description:
    'Connect your Stripe account and get MRR tracking, cohort retention analysis, and churn intelligence for your SaaS business.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
