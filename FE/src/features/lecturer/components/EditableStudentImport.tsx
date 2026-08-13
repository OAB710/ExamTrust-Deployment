"use client";

import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { CheckCircle2, FileSpreadsheet, Trash2, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";
import { toast } from "sonner";

type Field = "fullName" | "email" | "studentId" | "department";
type ImportRow = Record<Field, string> & { originalRow: number; errors: Partial<Record<Field, string>> };

const fields: Field[] = ["fullName", "email", "studentId", "department"];
const labels: Record<Field, string> = { fullName: "Họ tên", email: "Email", studentId: "MSSV", department: "Khoa/Bộ môn" };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const aliases: Record<Field, string[]> = {
  fullName: ["fullname", "hoten", "hovaten", "name"], email: ["email", "emailaddress"],
  studentId: ["studentid", "masinhvien", "mssv"], department: ["department", "khoa", "donvi"],
};
const normalizeHeader = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

function validate(rows: Omit<ImportRow, "errors">[]): ImportRow[] {
  const emailRows = new Map<string, number[]>();
  const studentRows = new Map<string, number[]>();
  rows.forEach((row) => {
    const email = row.email.trim().toLowerCase();
    const studentId = row.studentId.trim().toLowerCase();
    if (email) emailRows.set(email, [...(emailRows.get(email) || []), row.originalRow]);
    if (studentId) studentRows.set(studentId, [...(studentRows.get(studentId) || []), row.originalRow]);
  });
  return rows.map((row) => {
    const clean = Object.fromEntries(fields.map((field) => [field, row[field].trim()])) as Record<Field, string>;
    const errors: ImportRow["errors"] = {};
    fields.forEach((field) => { if (!clean[field]) errors[field] = "Bắt buộc"; });
    if (clean.email && !emailPattern.test(clean.email)) errors.email = "Email không đúng định dạng";
    const dupEmails = emailRows.get(clean.email.toLowerCase()) || [];
    if (dupEmails.length > 1) errors.email = `Trùng với dòng ${dupEmails.filter((line) => line !== row.originalRow).join(", ")}`;
    const dupIds = studentRows.get(clean.studentId.toLowerCase()) || [];
    if (dupIds.length > 1) errors.studentId = `Trùng với dòng ${dupIds.filter((line) => line !== row.originalRow).join(", ")}`;
    return { ...clean, originalRow: row.originalRow, errors };
  });
}

export function EditableStudentImport({ courseId, onSuccess }: { courseId: string; onSuccess: (count: number) => void }) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const validCount = rows.filter((row) => Object.keys(row.errors).length === 0).length;
  const errorCount = rows.length - validCount;
  const displayed = useMemo(() => [...rows]
    .filter((row) => !showErrorsOnly || Object.keys(row.errors).length > 0)
    .sort((a, b) => Number(Object.keys(b.errors).length > 0) - Number(Object.keys(a.errors).length > 0) || a.originalRow - b.originalRow), [rows, showErrorsOnly]);

  const applyMatrix = (matrix: unknown[][], name = "") => {
    const nonEmpty = matrix.filter((row) => row.some((cell) => String(cell ?? "").trim()));
    if (nonEmpty.length < 2) return toast.error("Tệp cần có hàng tiêu đề và ít nhất một dòng sinh viên.");
    const headers = nonEmpty[0].map(normalizeHeader);
    const indexes = Object.fromEntries(fields.map((field) => [field, headers.findIndex((header) => aliases[field].includes(header))])) as Record<Field, number>;
    const missing = fields.filter((field) => indexes[field] < 0);
    if (missing.length) return toast.error(`Thiếu cột: ${missing.join(", ")}.`);
    const parsed = nonEmpty.slice(1).map((source, index) => ({
      originalRow: index + 2,
      fullName: String(source[indexes.fullName] ?? ""), email: String(source[indexes.email] ?? ""),
      studentId: String(source[indexes.studentId] ?? ""), department: String(source[indexes.department] ?? ""),
    }));
    setRows(validate(parsed)); setFileName(name);
  };
  const readFile = async (file: File) => {
    try {
      if (/\.(xlsx|xls)$/i.test(file.name)) {
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
        applyMatrix(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: "" }) as unknown[][], file.name);
      } else {
        const text = await file.text(); const lines = text.split(/\r?\n/).filter((line) => line.trim());
        const delimiter = lines[0]?.includes("\t") ? "\t" : lines[0]?.includes(";") ? ";" : ",";
        applyMatrix(lines.map((line) => line.split(delimiter).map((cell) => cell.trim().replace(/^['"]|['"]$/g, ""))), file.name);
      }
    } catch { toast.error("Không thể đọc tệp import."); }
  };
  const update = (originalRow: number, field: Field, value: string) => setRows((current) => validate(current.map((row) => row.originalRow === originalRow ? { ...row, [field]: value, errors: {} } : row)));
  const remove = (originalRow: number) => setRows((current) => validate(current.filter((row) => row.originalRow !== originalRow)));
  const importRows = async () => {
    if (errorCount || !rows.length) return;
    setImporting(true);
    try {
      const result = await api.bulkImportStudents(courseId, rows.map(({ errors, originalRow, ...student }) => student));
      if (result.failed?.length) { toast.error("Backend từ chối một số dòng; hãy kiểm tra lại dữ liệu."); return; }
      toast.success(`Đã ghi danh ${result.success.length} sinh viên.`); onSuccess(result.success.length); setRows([]); setFileName("");
    } catch { toast.error("Ghi danh thất bại. Vui lòng thử lại."); } finally { setImporting(false); }
  };

  return <div className="space-y-4">
    <input ref={inputRef} type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={(event) => event.target.files?.[0] && void readFile(event.target.files[0])} />
    <div onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void readFile(file); }} className="cursor-pointer rounded-lg border-2 border-dashed p-5 text-center hover:border-primary/50 hover:bg-muted/30">
      <Upload className="mx-auto mb-2 h-7 w-7 text-muted-foreground" /><p className="text-sm font-medium">{fileName || "Nhấn để tải tệp lên hoặc kéo thả vào đây"}</p><p className="mt-1 text-xs text-muted-foreground">CSV, TXT, XLS, XLSX</p>
    </div>
    <Textarea placeholder="fullName,email,studentId,department\nNguyễn Văn An,an@example.edu,SV001,CNTT" className="font-mono text-xs" rows={3} onBlur={(event) => { if (!event.target.value.trim()) return; const lines = event.target.value.split(/\r?\n/); const delimiter = lines[0]?.includes("\t") ? "\t" : lines[0]?.includes(";") ? ";" : ","; applyMatrix(lines.map((line) => line.split(delimiter)), "Dữ liệu đã dán"); }} />
    {rows.length > 0 && <>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3 text-sm"><span><b>{rows.length}</b> dòng đã đọc · <span className="text-emerald-700">✓ {validCount} hợp lệ</span> · <span className="text-destructive">✕ {errorCount} cần sửa</span></span><Button size="sm" variant="outline" onClick={() => setShowErrorsOnly((value) => !value)}>{showErrorsOnly ? "Hiện tất cả" : "Chỉ xem dòng lỗi"}</Button></div>
      <div className="max-h-[52vh] overflow-auto rounded-lg border"><Table><TableHeader className="sticky top-0 bg-background"><TableRow><TableHead className="min-w-[88px]">Dòng gốc</TableHead>{fields.map((field) => <TableHead key={field} className="min-w-[230px]">{labels[field]}</TableHead>)}<TableHead /></TableRow></TableHeader><TableBody>{displayed.map((row) => <TableRow key={row.originalRow} className={Object.keys(row.errors).length ? "bg-destructive/5" : ""}><TableCell className="font-mono">{row.originalRow}</TableCell>{fields.map((field) => <TableCell key={field} className="min-w-[230px]"><Input aria-label={`${labels[field]} dòng ${row.originalRow}`} value={row[field]} onChange={(event) => update(row.originalRow, field, event.target.value)} className={row.errors[field] ? "border-destructive focus-visible:ring-destructive" : ""} />{row.errors[field] && <p className="mt-1 text-xs text-destructive">{row.errors[field]}</p>}</TableCell>)}<TableCell><Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => remove(row.originalRow)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>)}</TableBody></Table></div>
      <Button className="w-full gap-2" disabled={Boolean(errorCount) || importing || !rows.length} onClick={() => void importRows()}>{errorCount ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}{importing ? "Đang ghi danh..." : `Ghi danh ${rows.length} sinh viên`}</Button>
    </>}
  </div>;
}
