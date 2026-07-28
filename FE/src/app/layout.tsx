import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./../index.css";

import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "ExamTrust | Trusted Academic Assessment Platform",
    template: "%s | ExamTrust",
  },
  description:
    "An assessment platform with randomized exams, integrity monitoring, results analysis, and lecturer-reviewed AI support.",
  icons: {
    icon: "/examtrust-favicon.svg",
  },
  openGraph: {
    title: "ExamTrust",
    description:
      "Transparent, verifiable academic assessment designed for higher education.",
    images: ["/examtrust-og.svg"],
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="min-h-[100dvh] bg-background font-sans text-foreground antialiased">
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
