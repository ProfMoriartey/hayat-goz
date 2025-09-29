"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { UserButton } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "~/components/LocaleSwitcher";

export default function LandingPage() {
  const t = useTranslations("HomePage");

  const services = [
    {
      key: "general",
      img: "/services-1.jpg",
    },
    {
      key: "laser",
      img: "/services-2.jpg",
    },
    {
      key: "children",
      img: "/services-3.jpg",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center space-x-2">
            <Image
              src="/hayat-gozss.png"
              alt="Clinic Logo"
              width={100}
              height={56}
              className="h-7 w-13 md:h-9 md:w-25"
            />
          </div>
          <div className="flex items-center gap-4">
            <LocaleSwitcher />
            <Link href="/book">
              <Button className="bg-[#575749] text-sm hover:bg-[#676758] md:text-base">
                {t("navbar.bookNow")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-1 items-center justify-center bg-gradient-to-r from-[#95bb89] to-[#575749] text-white">
        <div className="w-full px-4 py-12 text-center sm:px-6 md:py-20 lg:py-28">
          <h1 className="text-2xl leading-tight font-bold sm:text-4xl md:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[#fbfbe9] sm:text-base md:text-xl">
            {t("hero.desc")}
          </p>
          <div className="mt-5 sm:mt-6">
            <Link href="/book">
              <Button
                size="lg"
                className="w-full bg-white text-[#575749] hover:bg-blue-50 sm:w-auto"
              >
                {t("hero.cta")}
              </Button>
            </Link>
          </div>

          <div className="mt-8 sm:mt-10 md:mt-12">
            <Image
              src="/hero-img.jpg"
              alt="Clinic"
              width={1200}
              height={500}
              className="mx-auto h-48 w-full max-w-4xl rounded-lg object-cover shadow-lg sm:h-64 md:h-80 lg:h-[400px]"
            />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="w-full bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <h2 className="text-center text-2xl font-bold md:text-3xl">
            {t("services.title")}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 md:mt-10 md:grid-cols-3">
            {services.map((srv) => (
              <Card key={srv.key} className="overflow-hidden">
                <Image
                  src={srv.img}
                  alt={t(`services.items.${srv.key}.title`)}
                  width={400}
                  height={200}
                  className="h-40 w-full object-cover md:h-48"
                />
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">
                    {t(`services.items.${srv.key}.title`)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm md:text-base">
                    {t(`services.items.${srv.key}.desc`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-gray-900 text-gray-300">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <p className="text-center font-semibold text-white md:text-left">
            {t("footer.clinic")}
          </p>
          <UserButton />
          <div className="mt-2 space-y-1 text-center text-sm md:mt-3 md:text-left md:text-base">
            <p>{t("footer.address")}</p>
            <p>{t("footer.phone")}</p>
            <p>{t("footer.email")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
