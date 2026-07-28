"use client";

import * as React from "react";
import { CircleHelp } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type HelpContent = {
  title?: React.ReactNode;
  description: React.ReactNode;
  usedBy?: React.ReactNode;
  note?: React.ReactNode;
};

type ContextHelpProps = {
  content: React.ReactNode | HelpContent;
  ariaLabel?: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
};

function isHelpContent(value: React.ReactNode | HelpContent): value is HelpContent {
  return (
    typeof value === "object" &&
    value !== null &&
    !React.isValidElement(value) &&
    "description" in value
  );
}

function HelpBody({ content }: { content: React.ReactNode | HelpContent }) {
  if (!isHelpContent(content)) {
    return <p>{content}</p>;
  }

  return (
    <div className="space-y-1.5">
      {content.title ? (
        <p className="font-semibold text-popover-foreground">{content.title}</p>
      ) : null}
      <p>{content.description}</p>
      {content.usedBy ? (
        <p>
          <span className="font-medium">Use when: </span>
          {content.usedBy}
        </p>
      ) : null}
      {content.note ? (
        <p>
          <span className="font-medium">Note: </span>
          {content.note}
        </p>
      ) : null}
    </div>
  );
}

const HelpButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, type = "button", ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  >
    <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
  </button>
));
HelpButton.displayName = "HelpButton";

function useTouchHelpMode() {
  const [isTouchMode, setIsTouchMode] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setIsTouchMode(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isTouchMode;
}

export function ContextHelp({
  content,
  ariaLabel = "View explanation",
  className,
  side = "top",
  align = "center",
}: ContextHelpProps) {
  const contentId = React.useId();
  const isTouchMode = useTouchHelpMode();
  const [desktopOpen, setDesktopOpen] = React.useState(false);
  const body = <HelpBody content={content} />;

  if (isTouchMode) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <HelpButton
            aria-label={ariaLabel}
            aria-describedby={contentId}
            className={className}
          />
        </PopoverTrigger>
        <PopoverContent
          id={contentId}
          side={side}
          align={align}
          className="max-w-[320px] text-sm leading-5"
        >
          {body}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Tooltip
      delayDuration={250}
      open={desktopOpen}
      onOpenChange={setDesktopOpen}
    >
      <TooltipTrigger asChild>
        <HelpButton
          aria-label={ariaLabel}
          aria-describedby={contentId}
          className={className}
          onClick={() => setDesktopOpen(true)}
          onFocus={() => setDesktopOpen(true)}
          onBlur={() => setDesktopOpen(false)}
        />
      </TooltipTrigger>
      <TooltipContent
        id={contentId}
        side={side}
        align={align}
        className="max-w-[320px] text-sm leading-5"
      >
        {body}
      </TooltipContent>
    </Tooltip>
  );
}

export function HelpedTitle({
  children,
  help,
  className,
  helpClassName,
}: {
  children: React.ReactNode;
  help: React.ReactNode | HelpContent;
  className?: string;
  helpClassName?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 align-baseline", className)}
    >
      <span>{children}</span>
      <ContextHelp content={help} className={helpClassName} />
    </span>
  );
}
