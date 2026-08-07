"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HelpedTitle } from "@/components/common/ContextHelp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BackToDashboardButton } from "@/components/common/BackToDashboardButton";

export default function LearningFeedbackDetail() {
  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full">
          <BackToDashboardButton to="/student" className="mb-4 -ml-2" />
        </div>

        {/* Sidebar */}
        <aside className="w-full md:w-64 mb-6 md:mb-0">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">
                <HelpedTitle help="Feedback sau bài thi giúp bạn xem điểm, chủ đề yếu và gợi ý luyện tập.">
                  Phản hồi bài thi
                </HelpedTitle>
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                Giữa kỳ - Nhập môn Khoa học máy tính
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="ghost" className="justify-start">
                Tổng quan
              </Button>
              <Button variant="secondary" className="justify-start">
                Hiệu suất
              </Button>
              <Button variant="ghost" className="justify-start">
                Lỗi thường gặp
              </Button>
              <Button variant="ghost" className="justify-start">
                Gợi ý
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-2">
                CẦN HỖ TRỢ?
              </div>
              <Button size="sm" className="w-full">
                Đặt lịch hỗ trợ
              </Button>
            </CardContent>
          </Card>
        </aside>
        {/* Main Content */}
        <main className="flex-1">
          <div className="mb-4 text-xs text-muted-foreground">
            Trang chủ &gt; Bài thi &gt; Phản hồi học tập
          </div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">Phân tích bài kiểm tra giữa kỳ</h1>
            <div className="flex gap-2">
              <Button variant="outline">Chia sẻ</Button>
              <Button>Tải PDF</Button>
            </div>
          </div>
          <div className="text-muted-foreground mb-6">
            Phân tích sâu kết quả và mô hình nhận thức trong bài giữa kỳ CS101 của bạn.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <div className="text-3xl font-bold">84/100</div>
                <div className="text-green-600 text-xs font-semibold mt-1">
                  +5% so với trung bình
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Tổng điểm
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <div className="text-3xl font-bold">78%</div>
                <div className="text-xs text-muted-foreground mt-1">
                  <HelpedTitle help="Ước lượng mức độ nắm vững chủ đề dựa trên kết quả trả lời và dạng lỗi thường gặp.">
                    Mức độ nắm vững chủ đề
                  </HelpedTitle>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <div className="text-3xl font-bold">45 phút</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Thời gian đã dùng
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                <HelpedTitle help="Các lỗi lặp lại qua nhiều câu hỏi, dùng để ưu tiên phần cần ôn tập.">
                  Lỗi thường gặp
                </HelpedTitle>
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                Các lỗi lặp lại được xác định qua nhiều câu hỏi.
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-orange-600 font-bold">!</span>
                  <span className="font-semibold">
                    Nhầm lẫn phân tích tiệm cận
                  </span>
                  <span className="ml-auto bg-orange-200 text-orange-800 text-xs font-bold px-2 py-0.5 rounded">
                    ẢNH HƯỞNG CAO
                  </span>
                </div>
                <div className="text-sm mb-1">
                  Bạn thường xuyên nhầm lẫn ký hiệu Big-O và Big-Theta trong các
                  câu hỏi độ phức tạp thuật toán (Câu 4, 12, 19).
                </div>
                <div className="text-xs">
                  Mục tiêu học tập:{" "}
                  <a href="#" className="underline text-blue-700">
                    CS-1.0-4.1: Hiệu quả thuật toán
                  </a>
                </div>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-yellow-600 font-bold">!</span>
                  <span className="font-semibold">Mệt mỏi cuối buổi thi</span>
                  <span className="ml-auto bg-yellow-200 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded">
                    ẢNH HƯỞNG TRUNG BÌNH
                  </span>
                </div>
                <div className="text-sm mb-1">
                  Độ chính xác giảm 30% trong 15 phút cuối. Hầu hết lỗi là lỗi
                  cú pháp đơn giản, không phải lỗi khái niệm.
                </div>
                <div className="text-xs">
                  Xu hướng:{" "}
                  <span className="italic">
                    10 câu hỏi cuối mất ít hơn 40% thời gian so với trung bình.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="mb-4 font-semibold text-lg">
            Gợi ý cá nhân hóa
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="font-semibold mb-1">
                  Chương 4: Độ phức tạp thuật toán
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  Tập trung vào trang 142-158 về định nghĩa ký hiệu Theta.
                </div>
                <Button variant="link" className="p-0 h-auto text-blue-700">
                  Đọc ngay →
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="font-semibold mb-1">Video: Làm chủ Big-O</div>
                <div className="text-xs text-muted-foreground mb-2">
                  Video 12 phút của GS. Miller phân tích các hiểu lầm phổ biến.
                </div>
                <Button variant="link" className="p-0 h-auto text-blue-700">
                  Xem video →
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="font-semibold mb-1">
                  Bộ luyện tập: Làm chủ ký hiệu
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  10 câu hỏi thích ứng tập trung vào điểm yếu của bạn.
                </div>
                <Button variant="link" className="p-0 h-auto text-blue-700">
                  Bắt đầu luyện tập →
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="font-semibold mb-1">
                  Nhóm học tập: Ôn CS101
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  Tham gia cùng 4 bạn học đang ôn chủ đề tương tự tuần này.
                </div>
                <Button variant="link" className="p-0 h-auto text-blue-700">
                  Tham gia nhóm →
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}
