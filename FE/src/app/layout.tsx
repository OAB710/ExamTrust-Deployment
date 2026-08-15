import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./../index.css";

import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "ExamTrust | Nền tảng đánh giá học thuật tin cậy",
    template: "%s | ExamTrust",
  },
  description:
    "Nền tảng tổ chức thi với đề ngẫu nhiên, giám sát toàn vẹn, phân tích kết quả và hỗ trợ AI có giảng viên kiểm duyệt.",
  icons: {
    icon: "/examtrust-mark.svg",
  },
  openGraph: {
    title: "ExamTrust",
    description:
      "Đánh giá học thuật minh bạch, có thể kiểm chứng và được thiết kế cho môi trường đại học.",
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
          Chuyển đến nội dung chính
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
