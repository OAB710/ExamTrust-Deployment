import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";

describe("shared UI foundation", () => {
  it("renders a page heading, description and action", () => {
    const onClick = vi.fn();
    render(
      <PageHeader
        title="Question bank"
        description="Manage question versions."
        actions={[{ label: "Create question", onClick }]}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Question bank");
    fireEvent.click(screen.getByRole("button", { name: "Create question" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders an actionable empty state", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No exams yet"
        description="Create your first exam to get started."
        action={{ label: "Create exam", onClick }}
      />,
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("No exams yet");
    fireEvent.click(screen.getByRole("button", { name: "Create exam" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
