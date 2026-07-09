import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'Satguru DMC — CMS Admin',
  description: 'Content admin for the Satguru DMC website',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css" />
      </head>
      <body>
        {/* Runs before paint: default is dark; only a saved 'light' choice opts out. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('admin-theme')==='light')document.documentElement.classList.remove('dark')}catch(e){}",
          }}
        />
        {children}
      </body>
    </html>
  );
}
