"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
// import { BackToDashboardButton } from '@/components/common/BackToDashboardButton';

export default function TransparencyDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* <BackToDashboardButton to="/admin" className="-ml-2" /> */}

        <Card>
          <CardHeader>
            <CardTitle>Bảng minh bạch hệ thống</CardTitle>
            <p className="text-muted-foreground mt-2">
              Báo cáo tổng quan về tính minh bạch, số liệu thống kê, kiểm định
              và quyết định học thuật trong hệ thống.
            </p>
          </CardHeader>
          <CardContent>
            <Separator className="my-4" />
            <section>
              <h2 className="text-lg font-semibold mb-2">
                1. Tổng hợp số liệu thống kê
              </h2>
              <p>
                Tổng hợp các chỉ số chính: số lượng bài thi, số lượng câu hỏi,
                số sinh viên tham gia, điểm trung bình, độ phân biệt và độ khó.
                <br />
                <b>Ví dụ:</b> 10 bài thi, 500 câu hỏi, 200 sinh viên, điểm
                trung bình: 7.5
              </p>
            </section>
            <Separator className="my-4" />
            <section>
              <h2 className="text-lg font-semibold mb-2">
                2. Cảnh báo & bằng chứng toàn vẹn học thuật
              </h2>
              <p>
                Báo cáo cảnh báo từ AI, bằng chứng toàn vẹn học thuật và quyết
                định của hội đồng.
                <br />
                <b>Ví dụ:</b> 5 cảnh báo, 2 quyết định "Không gian lận", 1
                quyết định "Gian lận"
              </p>
            </section>
            <Separator className="my-4" />
            <section>
              <h2 className="text-lg font-semibold mb-2">
                3. Quyết định học thuật
              </h2>
              <p>
                Quyết định học thuật dựa trên bằng chứng, nhật ký sự kiện và
                số liệu thống kê.
                <br />
                <b>Ví dụ:</b> 1 sinh viên bị đình chỉ, 2 sinh viên bị cảnh cáo
              </p>
            </section>
            <Separator className="my-4" />
            <section>
              <h2 className="text-lg font-semibold mb-2">4. Nhật ký kiểm toán</h2>
              <p>
                Lưu trữ và hiển thị lịch sử hoạt động hệ thống, cập nhật chính
                sách và các quyết định.
                <br />
                <b>Ví dụ:</b> 10/01/2026: Đã cập nhật chính sách toàn vẹn học
                thuật
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
