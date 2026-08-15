import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuestionTopicDialog } from "./QuestionTopicDialog";

describe("QuestionTopicDialog topic similarity guidance", () => {
  it("sends an optional scope description and distinguishes AI from lexical results", () => {
    const onTopicDescriptionChange = vi.fn();
    render(
      <QuestionTopicDialog
        open
        selectedTopicId=""
        newTopicName="Chuẩn hóa dữ liệu"
        topicDescription="Các dạng chuẩn và phụ thuộc hàm"
        topicSearch=""
        topics={[]}
        suggestions={[
          {
            id: "topic-1",
            code: "NORMALIZATION",
            name: "Thiết kế lược đồ quan hệ",
            relation: "SAME_CONCEPT",
            score: 0.91,
            matchMethod: "AI",
            reason: "Cùng khái niệm trong phạm vi môn Cơ sở dữ liệu.",
          },
          {
            id: "topic-2",
            code: "SQL",
            name: "Ngôn ngữ SQL",
            relation: "RELATED",
            score: 0.42,
            matchMethod: "LEXICAL",
            reason: "So khớp từ khóa; cần rà soát thêm.",
          },
        ]}
        checkingSimilarity={false}
        creatingTopic={false}
        checkMessage="Tìm thấy 2 chủ đề tương tự."
        onNewTopicNameChange={vi.fn()}
        onTopicDescriptionChange={onTopicDescriptionChange}
        onTopicSearchChange={vi.fn()}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onCheckSimilarity={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Phạm vi \/ mô tả ngắn/i), { target: { value: "Phạm vi mới" } });
    expect(onTopicDescriptionChange).toHaveBeenCalledWith("Phạm vi mới");
    expect(screen.getByText("Cùng khái niệm")).toBeInTheDocument();
    expect(screen.getByText("Đánh giá bởi AI")).toBeInTheDocument();
    expect(screen.getByText("So khớp từ khóa")).toBeInTheDocument();
    expect(screen.getByText("Độ tin cậy 91%")).toBeInTheDocument();
  });
});
