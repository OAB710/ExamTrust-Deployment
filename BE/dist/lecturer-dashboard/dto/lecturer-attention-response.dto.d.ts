export interface LecturerAttentionItemDto {
    count: number;
    href: string;
}
export interface LecturerAttentionResponseDto {
    suspiciousReports: LecturerAttentionItemDto;
    pendingAiQuestions: LecturerAttentionItemDto;
    draftExams: LecturerAttentionItemDto;
    upcomingExams: LecturerAttentionItemDto;
}
