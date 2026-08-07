"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { HelpedTitle } from "@/components/common/ContextHelp";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Shield,
  Eye,
  Lock,
  Globe,
  Bell,
  Database,
  Clock,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { getNumericInputError, sanitizeNumericInput } from "@/lib/number-input";

export default function SystemPolicyConfig() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Integrity Policies
  const [globalSimilarityThreshold, setGlobalSimilarityThreshold] = useState([
    80,
  ]);
  const [globalTimingThreshold, setGlobalTimingThreshold] = useState([3]);
  const [autoFlagEnabled, setAutoFlagEnabled] = useState(true);
  const [requireManualReview, setRequireManualReview] = useState(true);
  const [maxTabSwitchesGlobal, setMaxTabSwitchesGlobal] = useState([5]);

  // Scoring Policies
  const [defaultPassingScore, setDefaultPassingScore] = useState("50");
  const [allowNegativeMarking, setAllowNegativeMarking] = useState(false);
  const [scoreRoundingMethod, setScoreRoundingMethod] = useState("round");
  const [gradeScale, setGradeScale] = useState("10");

  // Access Policies
  const [passwordPolicy, setPasswordPolicy] = useState("strong");
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState("");

  // Data Retention
  const [retentionPeriod, setRetentionPeriod] = useState("365");
  const [autoArchive, setAutoArchive] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");

  const [numberErrors, setNumberErrors] = useState<Record<string, string>>({});

  // System Maintenance
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  const handleSave = async () => {
    const nextErrors = {
      defaultPassingScore:
        getNumericInputError(defaultPassingScore, {
          min: 0,
          max: 100,
          integer: true,
        }) || "",
      sessionTimeout:
        getNumericInputError(sessionTimeout, {
          min: 5,
          max: 480,
          integer: true,
        }) || "",
      maxLoginAttempts:
        getNumericInputError(maxLoginAttempts, {
          min: 1,
          max: 20,
          integer: true,
        }) || "",
    };

    setNumberErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setGlobalSimilarityThreshold([80]);
    setGlobalTimingThreshold([3]);
    setAutoFlagEnabled(true);
    setRequireManualReview(true);
    setMaxTabSwitchesGlobal([5]);
    setDefaultPassingScore("50");
    setAllowNegativeMarking(false);
  };

  return (
    <DashboardLayout>
      <AdminPageShell>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1">
              Thiết lập chính sách hệ thống
            </h1>
            <p className="text-muted-foreground">
              Cấu hình ngưỡng toàn vẹn học thuật, chính sách tính điểm và các
              thiết lập áp dụng cho toàn hệ thống
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Khôi phục mặc định
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saved ? "Đã lưu!" : "Lưu chính sách"}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Integrity Thresholds */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <HelpedTitle help={{
                  description: "Cấu hình ngưỡng cảnh báo toàn vẹn học thuật ở cấp hệ thống.",
                  usedBy: "Quản trị viên dùng để điều chỉnh mức nhạy của các tín hiệu như tương đồng câu trả lời, chuyển tab hoặc bất thường thời gian.",
                  note: "Các tín hiệu chỉ hỗ trợ xem xét, không tự kết luận gian lận.",
                }}>
                  Ngưỡng toàn vẹn học thuật toàn hệ thống
                </HelpedTitle>
              </CardTitle>
              <CardDescription>
                Thiết lập áp dụng cho toàn hệ thống để phát hiện và đánh dấu gian lận
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ngưỡng tương đồng câu trả lời</span>
                  <span className="font-medium">
                    {globalSimilarityThreshold[0]}%
                  </span>
                </div>
                <Slider
                  value={globalSimilarityThreshold}
                  onValueChange={setGlobalSimilarityThreshold}
                  min={50}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Đánh dấu bài nộp khi độ tương đồng câu trả lời vượt ngưỡng này
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ngưỡng bất thường về thời gian</span>
                  <span className="font-medium">
                    {globalTimingThreshold[0]} sự kiện
                  </span>
                </div>
                <Slider
                  value={globalTimingThreshold}
                  onValueChange={setGlobalTimingThreshold}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Số lần chuyển tab tối đa trước khi tự động đánh dấu</span>
                  <span className="font-medium">{maxTabSwitchesGlobal[0]}</span>
                </div>
                <Slider
                  value={maxTabSwitchesGlobal}
                  onValueChange={setMaxTabSwitchesGlobal}
                  min={1}
                  max={15}
                  step={1}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Tự động đánh dấu</Label>
                  <p className="text-xs text-muted-foreground">
                    Tự động đánh dấu bài nộp vượt ngưỡng
                  </p>
                </div>
                <Switch
                  checked={autoFlagEnabled}
                  onCheckedChange={setAutoFlagEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Yêu cầu xem xét thủ công</Label>
                  <p className="text-xs text-muted-foreground">
                    Mọi trường hợp bị đánh dấu phải được giảng viên xem xét
                  </p>
                </div>
                <Switch
                  checked={requireManualReview}
                  onCheckedChange={setRequireManualReview}
                />
              </div>
            </CardContent>
          </Card>

          {/* Scoring Policies */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <HelpedTitle help={{
                  description: "Thiết lập mặc định cho cách tính điểm, ngưỡng đạt và quy đổi điểm.",
                  usedBy: "Quản trị viên cấu hình chính sách chung để giảng viên có điểm khởi tạo nhất quán.",
                  note: "Một số bài thi có thể có cấu hình riêng nếu được hỗ trợ ở cấp bài thi.",
                }}>
                  Chính sách tính điểm
                </HelpedTitle>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Điểm đạt mặc định (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={defaultPassingScore}
                    onChange={(e) =>
                      setDefaultPassingScore(
                        sanitizeNumericInput(e.target.value),
                      )
                    }
                    onBlur={(e) =>
                      setNumberErrors((prev) => ({
                        ...prev,
                        defaultPassingScore:
                          getNumericInputError(e.target.value, {
                            min: 0,
                            max: 100,
                            integer: true,
                          }) || "",
                      }))
                    }
                  />
                  {numberErrors.defaultPassingScore ? (
                    <p className="text-xs text-destructive">
                      {numberErrors.defaultPassingScore}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Thang điểm</Label>
                  <Select value={gradeScale} onValueChange={setGradeScale}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">Thang điểm 10</SelectItem>
                      <SelectItem value="100">Thang điểm 100</SelectItem>
                      <SelectItem value="letter">Điểm chữ (A-F)</SelectItem>
                      <SelectItem value="4">Thang điểm GPA 4.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phương pháp làm tròn điểm</Label>
                <Select
                  value={scoreRoundingMethod}
                  onValueChange={setScoreRoundingMethod}
                >
                  <SelectTrigger className="w-[240px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round">Làm tròn gần nhất</SelectItem>
                    <SelectItem value="floor">Làm tròn xuống</SelectItem>
                    <SelectItem value="ceil">Làm tròn lên</SelectItem>
                    <SelectItem value="none">
                      Không làm tròn (2 số lẻ)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Cho phép trừ điểm âm</Label>
                  <p className="text-xs text-muted-foreground">
                    Cho phép giảng viên cấu hình trừ điểm theo từng bài thi
                  </p>
                </div>
                <Switch
                  checked={allowNegativeMarking}
                  onCheckedChange={setAllowNegativeMarking}
                />
              </div>
            </CardContent>
          </Card>

          {/* Access & Security */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <HelpedTitle help={{
                  description: "Thiết lập bảo mật đăng nhập, phiên làm việc và giới hạn truy cập.",
                  usedBy: "Quản trị viên dùng để giảm rủi ro truy cập trái phép và kiểm soát phiên đăng nhập.",
                  note: "Thay đổi chính sách bảo mật có thể ảnh hưởng trực tiếp đến trải nghiệm đăng nhập của người dùng.",
                }}>
                  Truy cập & Bảo mật
                </HelpedTitle>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Chính sách mật khẩu</Label>
                  <Select
                    value={passwordPolicy}
                    onValueChange={setPasswordPolicy}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Cơ bản (từ 6 ký tự)</SelectItem>
                      <SelectItem value="medium">Trung bình (từ 8 ký tự, kết hợp)</SelectItem>
                      <SelectItem value="strong">
                        Mạnh (từ 12 ký tự, kết hợp + ký tự đặc biệt)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Thời gian hết phiên (phút)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={480}
                    value={sessionTimeout}
                    onChange={(e) =>
                      setSessionTimeout(sanitizeNumericInput(e.target.value))
                    }
                    onBlur={(e) =>
                      setNumberErrors((prev) => ({
                        ...prev,
                        sessionTimeout:
                          getNumericInputError(e.target.value, {
                            min: 5,
                            max: 480,
                            integer: true,
                          }) || "",
                      }))
                    }
                  />
                  {numberErrors.sessionTimeout ? (
                    <p className="text-xs text-destructive">
                      {numberErrors.sessionTimeout}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Số lần đăng nhập sai tối đa</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={maxLoginAttempts}
                    onChange={(e) =>
                      setMaxLoginAttempts(sanitizeNumericInput(e.target.value))
                    }
                    onBlur={(e) =>
                      setNumberErrors((prev) => ({
                        ...prev,
                        maxLoginAttempts:
                          getNumericInputError(e.target.value, {
                            min: 1,
                            max: 20,
                            integer: true,
                          }) || "",
                      }))
                    }
                  />
                  {numberErrors.maxLoginAttempts ? (
                    <p className="text-xs text-destructive">
                      {numberErrors.maxLoginAttempts}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Xác thực hai yếu tố</Label>
                  <p className="text-xs text-muted-foreground">
                    Yêu cầu xác thực hai yếu tố với mọi người dùng
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label>Danh sách IP được phép (không bắt buộc)</Label>
                <Textarea
                  placeholder="Nhập danh sách IP được phép, mỗi dòng một dải (VD: 192.168.1.0/24)"
                  value={ipWhitelist}
                  onChange={(e) => setIpWhitelist(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                <HelpedTitle help={{
                  description: "Quy định thời gian lưu trữ dữ liệu bài thi, nhật ký và bản ghi hệ thống.",
                  usedBy: "Quản trị viên dùng để cân bằng giữa nhu cầu truy vết, tuân thủ và dung lượng lưu trữ.",
                  note: "Không nên rút ngắn thời gian lưu trữ nếu vẫn cần phục vụ phúc khảo hoặc điều tra.",
                }}>
                  Lưu trữ dữ liệu
                </HelpedTitle>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Thời gian lưu trữ</Label>
                  <Select
                    value={retentionPeriod}
                    onValueChange={setRetentionPeriod}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 ngày</SelectItem>
                      <SelectItem value="180">6 tháng</SelectItem>
                      <SelectItem value="365">1 năm</SelectItem>
                      <SelectItem value="730">2 năm</SelectItem>
                      <SelectItem value="forever">Vĩnh viễn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tần suất sao lưu</Label>
                  <Select
                    value={backupFrequency}
                    onValueChange={setBackupFrequency}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hàng giờ</SelectItem>
                      <SelectItem value="daily">Hàng ngày</SelectItem>
                      <SelectItem value="weekly">Hàng tuần</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Tự động lưu trữ bài thi đã hoàn thành</Label>
                  <p className="text-xs text-muted-foreground">
                    Tự động lưu trữ bài thi sau khi hết thời gian lưu trữ
                  </p>
                </div>
                <Switch
                  checked={autoArchive}
                  onCheckedChange={setAutoArchive}
                />
              </div>
            </CardContent>
          </Card>

          {/* Maintenance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <HelpedTitle help="Dùng khi cần bảo trì hệ thống hoặc tạm hạn chế truy cập của người dùng không phải quản trị viên.">
                  Bảo trì hệ thống
                </HelpedTitle>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Chế độ bảo trì</Label>
                  <p className="text-xs text-muted-foreground">
                    Tắt quyền truy cập với người dùng không phải quản trị viên
                  </p>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                />
              </div>
              {maintenanceMode && (
                <div className="space-y-2">
                  <Label>Thông báo bảo trì</Label>
                  <Textarea
                    placeholder="Nội dung thông báo hiển thị cho người dùng..."
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    rows={2}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminPageShell>
    </DashboardLayout>
  );
}
