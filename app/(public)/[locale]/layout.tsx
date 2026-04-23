import type { Metadata } from "next";
import localFont from "next/font/local";
import "../../globals.css";
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AppProvider } from "@/app/contexts";
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
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${phetsarath.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <AppProvider>
            <NavigationBar />
            {children}
            <Footer />
          </AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

