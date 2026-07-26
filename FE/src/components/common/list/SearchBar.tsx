"use client";

import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
};

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Tìm kiếm...",
  className,
  disabled,
  clearable = true,
}: SearchBarProps) {
  const previousValue = useRef<string | null>(null);

  useEffect(() => {
    if (previousValue.current === null) {
      previousValue.current = value;
      return;
    }
    if (previousValue.current === value) return;

    previousValue.current = value;
    const timeoutId = window.setTimeout(onSearch, 250);
    return () => window.clearTimeout(timeoutId);
  }, [onSearch, value]);

  return (
    <div className={cn("flex w-full items-center gap-2", className)}>
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSearch();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="h-11 rounded-lg border-border bg-card pl-9 pr-12 shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        />
        {clearable && value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => onChange("")}
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Xóa nội dung tìm kiếm</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

