import "~/styles/globals.css";

import { Geist } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "~/i18n/routing";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

type Messages = Record<string, string | Record<string, string>>;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  let messages: Messages;
  try {
    const mod = (await import(`../../../messages/${locale}.json`)) as {
      default: Messages;
    };
    messages = mod.default;
  } catch (error) {
    notFound();
  }

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={geist.variable}
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
