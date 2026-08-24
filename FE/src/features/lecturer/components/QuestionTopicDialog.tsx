"use client";

import { Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { TopicOption } from "../question-editor-types";
import { topicRelationLabel, type TopicSuggestion } from "../hooks/useQuestionTopics";

type Props = {
  open: boolean;
  selectedTopicId: string;
  newTopicName: string;
  topicDescription: string;
  topicSearch: string;
  topics: TopicOption[];
  suggestions: TopicSuggestion[];
  checkingSimilarity: boolean;
  creatingTopic: boolean;
  checkMessage: string;
  onNewTopicNameChange: (value: string) => void;
  onTopicDescriptionChange: (value: string) => void;
  onTopicSearchChange: (value: string) => void;
  onClose: () => void;
  onSelect: (topicId: string) => void;
  onCreate: () => void;
  onCheckSimilarity: () => void;
};

export function QuestionTopicDialog(props: Props) {
  if (!props.open) return null;
  const canCreate = Boolean(props.newTopicName.trim()) && !props.creatingTopic;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="mx-4 flex max-h-[90vh] w-[min(96vw,1100px)] max-w-none flex-col overflow-hidden">
        <CardHeader className="shrink-0 border-b bg-gradient-to-r from-background to-muted/30">
          <div className="flex items-start justify-between gap-4"><div><CardTitle>Chọn hoặc tạo chủ đề</CardTitle><CardDescription>Tìm chủ đề có sẵn, kiểm tra tương tự hoặc tạo chủ đề mới.</CardDescription></div><Button variant="ghost" size="sm" onClick={props.onClose}>Hủy</Button></div>
        </CardHeader>
        <CardContent className="grid flex-1 gap-5 overflow-y-auto p-5 sm:p-7 lg:grid-cols-[1fr_1fr] lg:p-8">
          <section className="space-y-4 rounded-2xl border bg-muted/20 p-5 shadow-sm">
            <div><Label htmlFor="topic-name" className="text-xs uppercase tracking-wide text-muted-foreground">Chủ đề mới</Label><p className="mt-1 text-sm text-muted-foreground">Tạo mới khi chủ đề chưa tồn tại.</p></div>
            <div className="flex flex-col gap-2 sm:flex-row"><Input id="topic-name" placeholder="Ví dụ: Thuật toán đồ thị" value={props.newTopicName} onChange={(event) => props.onNewTopicNameChange(event.target.value)} onKeyDown={(event) => event.key === "Enter" && props.onCreate()} /><Button variant="outline" onClick={props.onCheckSimilarity} disabled={!props.newTopicName.trim() || props.checkingSimilarity} className="shrink-0 gap-2">{props.checkingSimilarity ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Kiểm tra AI</Button><Button onClick={props.onCreate} disabled={!canCreate} className="shrink-0 gap-2">{props.creatingTopic ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Tạo</Button></div>
            <div className="space-y-1.5"><Label htmlFor="topic-description" className="text-xs text-muted-foreground">Phạm vi / mô tả ngắn <span className="normal-case">(không bắt buộc)</span></Label><Input id="topic-description" placeholder="Ví dụ: Các khái niệm về mô hình quan hệ, khóa và chuẩn hóa dữ liệu" value={props.topicDescription} onChange={(event) => props.onTopicDescriptionChange(event.target.value)} /></div>
            {props.checkingSimilarity ? <p className="rounded-xl border border-info/25 bg-info/5 px-3 py-2 text-xs text-info">Đang kiểm tra chủ đề tương tự...</p> : props.checkMessage ? <p className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">{props.checkMessage}</p> : null}
            {props.suggestions.length ? <div className="space-y-2"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Kết quả cần rà soát</p>{props.suggestions.map((topic) => <button key={topic.id} type="button" className="w-full rounded-xl border bg-background px-3 py-2.5 text-left hover:border-primary hover:bg-primary/5" onClick={() => props.onSelect(topic.id)}><span className="flex flex-wrap items-center justify-between gap-2"><span className="truncate text-sm font-medium">{topic.name}</span><span className="flex items-center gap-1.5"><Badge variant="outline" className="text-[10px]">{topicRelationLabel[topic.relation]}</Badge><Badge variant="secondary" className="text-[10px]">Độ tin cậy {Math.round(topic.score * 100)}%</Badge></span></span><span className="mt-1.5 flex flex-wrap gap-1.5"><Badge variant={topic.matchMethod === "LEXICAL" ? "secondary" : "outline"} className="text-[10px]">{topic.matchMethod === "LEXICAL" ? "So khớp từ khóa" : "Đánh giá bởi AI"}</Badge></span>{topic.reason ? <span className="mt-1 block text-xs text-muted-foreground">{topic.reason}</span> : null}</button>)}</div> : null}
          </section>
          <section className="flex min-h-0 flex-col space-y-4 rounded-2xl border bg-background p-5 shadow-sm">
            <div className="space-y-2"><div className="flex items-center justify-between"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Tìm chủ đề</Label><span className="text-[10px] text-muted-foreground">{props.topics.length} kết quả</span></div><Input placeholder="Tìm theo tên hoặc mã..." value={props.topicSearch} onChange={(event) => props.onTopicSearchChange(event.target.value)} /></div>
            <Separator />
            <div className="min-h-[200px] flex-1 space-y-2.5 overflow-y-auto pr-1">{props.topics.length ? props.topics.map((topic) => <Button key={topic.id} variant={props.selectedTopicId === topic.id ? "default" : "outline"} className="h-auto w-full justify-start rounded-xl py-2.5 text-left" size="sm" onClick={() => props.onSelect(topic.id)}><span className="truncate">{topic.name}</span></Button>) : <p className="py-2 text-sm text-muted-foreground">Không có chủ đề phù hợp.</p>}</div>
          </section>
        </CardContent>
        <CardFooter className="flex shrink-0 flex-col gap-3 border-t bg-muted/20 p-5 sm:flex-row"><Button variant="outline" onClick={props.onClose} className="flex-1">Hủy</Button><Button onClick={props.onCreate} disabled={!canCreate} className="flex-1 gap-2">{props.creatingTopic ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Tạo và chọn</Button></CardFooter>
      </Card>
    </div>
  );
}
