import './globals.css';
import { Inter } from 'next/font/google';
import ClientProviders from './components/ClientProviders';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CaterFlow - Catering Management SaaS',
  description: 'Complete catering management platform for your business',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
