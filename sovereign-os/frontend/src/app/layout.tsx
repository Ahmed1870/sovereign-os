import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Sovereign OS — Digital Identity Command Center',
  description: 'Reclaim your digital sovereignty. Monitor breaches, scan your footprint, and clean your data automatically.',
  keywords: 'digital privacy, identity protection, breach monitoring, OSINT, GDPR',
  themeColor: '#060914',
  openGraph: {
    title: 'Sovereign OS',
    description: 'Your Autonomous Digital Bodyguard',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} bg-void-900 text-white antialiased`}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0f1630',
                color: '#fff',
                border: '1px solid rgba(54,112,248,0.3)',
              },
              success: { iconTheme: { primary: '#34c759', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ff2d55', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
