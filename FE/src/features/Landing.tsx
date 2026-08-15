"use client";

import {
  ArrowRight,
  BarChart3,
  FileClock,
  Fingerprint,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";

const capabilityGroups = [
  {
    icon: Fingerprint,
    title: "Đề riêng cho từng sinh viên",
    description:
      "Mỗi lượt thi có thứ tự câu hỏi và đáp án riêng, được lưu thành một phiên bản bất biến khi bắt đầu.",
  },
  {
    icon: FileClock,
    title: "Lưu đúng lịch sử câu hỏi",
    description: "Bài thi cũ luôn tham chiếu đúng phiên bản câu hỏi đã sử dụng.",
  },
  {
    icon: ShieldCheck,
    title: "Giám sát rủi ro",
    description: "Hệ thống ghi nhận bất thường nhưng không tự kết luận gian lận.",
  },
  {
    icon: Sparkles,
    title: "AI có giảng viên kiểm duyệt",
    description: "Câu hỏi do AI đề xuất phải được giảng viên xem và duyệt trước khi sử dụng.",
  },
  {
    icon: BarChart3,
    title: "Phân tích có thể giải thích",
    description: "Theo dõi độ khó, kết quả và chất lượng câu hỏi theo thời gian.",
  },
  {
    icon: WifiOff,
    title: "Khôi phục khi mất kết nối",
    description: "Bài làm được tự động lưu, sinh viên không mất câu trả lời khi mạng chập chờn.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <Header />

      <main id="main-content">
        <section className="page-surface flex min-h-[calc(100dvh-4rem)] items-center pb-8 pt-8 sm:pt-10 lg:pb-10 lg:pt-10">
          <div className="container grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-12">
            <div>
              <p className="text-sm font-semibold text-primary">Đánh giá học thuật minh bạch</p>
              <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.1] tracking-[-0.055em] sm:text-5xl">
                Minh bạch từ khi ra đề đến khi có điểm
              </h1>
              <p className="mt-4 max-w-[52ch] text-base leading-7 text-muted-foreground">
                Đề thi riêng cho từng sinh viên, lịch sử không thể chỉnh sửa và tín hiệu bất thường rõ ràng để giảng viên xem xét công bằng.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="group">
                  <Link href="/login">
                    Đăng nhập
                    <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#nang-luc">Khám phá nền tảng</Link>
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-2 shadow-heavy">
              <Image
                src="/examtrust-hero.png"
                alt="Hồ sơ bài thi được lưu theo từng phiên bản để phục vụ kiểm tra và đối chiếu"
                width={1456}
                height={1118}
                priority
                className="aspect-[4/3] w-full rounded-xl object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
            </div>
          </div>
        </section>

        <section id="nang-luc" className="scroll-mt-20 py-10 sm:py-12">
          <div className="container">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-[-0.04em]">Nền tảng cho một kỳ thi đáng tin cậy</h2>
              <p className="mt-3 max-w-[60ch] text-base leading-7 text-muted-foreground">
                Mỗi khả năng đều phục vụ một mục tiêu: bảo toàn bằng chứng, giảm thao tác thủ công và hỗ trợ quyết định có trách nhiệm.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {capabilityGroups.map((capability) => (
                <article
                  key={capability.title}
                  className="flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-soft"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <capability.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold tracking-[-0.02em]">{capability.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{capability.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/80 py-8">
        <div className="container flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <img src="/examtrust-mark.svg" alt="" width={32} height={32} className="h-8 w-8" />
            ExamTrust
          </Link>
          <nav aria-label="Liên kết cuối trang" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <Link href="#nang-luc" className="hover:text-foreground">Năng lực</Link>
            <Link href="/privacy" className="hover:text-foreground">Quyền riêng tư</Link>
            <Link href="/login" className="hover:text-foreground">Đăng nhập</Link>
          </nav>
          <p className="text-sm text-muted-foreground">© 2026 ExamTrust</p>
        </div>
      </footer>
    </div>
  );
}
