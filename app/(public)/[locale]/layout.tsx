import type { Metadata } from "next";
import localFont from "next/font/local";
import "../../globals.css";
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import PublicSiteProvider from './components/PublicSiteProvider';
import { inter } from './fonts';
import './public.css';
import NavigationBar from "./components/NavigationBar";
import Footer from "./components/Footer";

const phetsarath = localFont({
  src: [
    {
      path: "../../../public/fonts/Phetsarath-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Phetsarath-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-phetsarath",
});

export const metadata: Metadata = {
  title: "MC Broker",
  description: "Professional insurance broker in Laos",
  icons: {
    icon: '/favicon.ico',
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.some(supported => supported === locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`public-site ${phetsarath.variable} ${inter.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <PublicSiteProvider>
            <NavigationBar />
            <main id="main-content" tabIndex={-1}>{children}</main>
            <Footer />
          </PublicSiteProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
