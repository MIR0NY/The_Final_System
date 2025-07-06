// app/layout.js
import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script';
import { ThemeProvider } from './components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'School Management App',
  description: 'A comprehensive school management system.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Font Awesome for Icons */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
        {/* Google Fonts: Inter is handled by next/font/google */}
      </head>
      <body className={inter.className} suppressHydrationWarning> {/* ADD THIS PROP HERE */}
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}