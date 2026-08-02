import type { Metadata } from "next";
import { headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import "./globals.css";
import { Providers } from "@/app/providers";
import { getRequestLocale } from '@/i18n/server';
import { messages } from '@/i18n/messages';
import { themeInitializationScript } from '@/features/theme/theme';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return messages[locale].metadata;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html lang={locale} suppressHydrationWarning>
      <head><script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeInitializationScript }} /></head>
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="Europe/Warsaw">
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
