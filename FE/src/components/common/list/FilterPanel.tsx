"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Filter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { getNumericInputError, parseNumericInput } from "@/lib/number-input";
import { cn } from "@/lib/utils";
import {
  FilterDefinition,
  FilterValues,
  NumberRangeValue,
} from "./filter-types";

type FilterPanelProps = {
  title?: string;
  description?: string;
  filters: FilterDefinition[];
  value: FilterValues;
  onValueChange: (key: string, value: FilterValues[string]) => void;
  onApply: () => void;
  onClear: () => void;
  triggerLabel?: string;
  activeCount?: number;
  className?: string;
  inline?: boolean;
};

const getNumberFieldKey = (filterKey: string, bound: "min" | "max") =>
  `${filterKey}::${bound}`;

export function FilterPanel({
  title = "Bộ lọc",
  description = "Thu hẹp kết quả trước khi áp dụng.",
  filters,
  value,
  onValueChange,
  onApply,
  onClear,
  triggerLabel = "Lọc",
  activeCount = 0,
  className,
  inline = true,
}: FilterPanelProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [numberDrafts, setNumberDrafts] = useState<Record<string, string>>({});
  const [numberErrors, setNumberErrors] = useState<Record<string, string>>({});
  const previousFilterSignature = useRef<string | null>(null);
  const filterSignature = JSON.stringify(
    filters.map((filter) => value[filter.key]),
  );

  useEffect(() => {
    if (previousFilterSignature.current === null) {
      previousFilterSignature.current = filterSignature;
      return;
    }
    if (previousFilterSignature.current === filterSignature) return;

    previousFilterSignature.current = filterSignature;
    const timeoutId = window.setTimeout(onApply, 100);
    return () => window.clearTimeout(timeoutId);
  }, [filterSignature, onApply]);
  const getRangeDraftValue = (
    filterKey: string,
    bound: "min" | "max",
    valueFromState?: number,
  ) => {
    const key = getNumberFieldKey(filterKey, bound);
    if (Object.prototype.hasOwnProperty.call(numberDrafts, key)) {
      return numberDrafts[key];
    }
    return valueFromState === undefined ? "" : String(valueFromState);
  };

  const setRangeError = (
    filterKey: string,
    bound: "min" | "max",
    message: string,
  ) => {
    const key = getNumberFieldKey(filterKey, bound);
    setNumberErrors((prev) => ({ ...prev, [key]: message }));
  };

  const clearRangeError = (filterKey: string, bound: "min" | "max") => {
    const key = getNumberFieldKey(filterKey, bound);
    setNumberErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const commitRangeValue = (
    filter: Extract<FilterDefinition, { type: "number-range" }>,
    bound: "min" | "max",
    rawValue: string,
    currentRange: NumberRangeValue,
  ) => {
    const message = getNumericInputError(rawValue, {
      min: filter.min ?? 0,
      max: filter.max,
      integer: false,
    });

    if (message) {
      setRangeError(filter.key, bound, message);
      return false;
    }

    clearRangeError(filter.key, bound);

    const parsed = parseNumericInput(rawValue, {
      min: filter.min ?? 0,
      max: filter.max,
      integer: false,
    });

    if (bound === "min") {
      onValueChange(filter.key, {
        min: parsed,
        max: currentRange.max,
      });
      return true;
    }

    onValueChange(filter.key, {
      min: currentRange.min,
      max: parsed,
    });
    return true;
  };

  const handleClearWithReset = () => {
    setNumberDrafts({});
    setNumberErrors({});
    onClear();
  };

  const trigger = (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "h-9 rounded-lg border-border bg-card px-2.5 text-xs hover:bg-muted",
        className,
      )}
    >
      <Filter className="h-3.5 w-3.5" />
      <span>{triggerLabel}</span>
      {activeCount > 0 ? (
        <span className="ml-1 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 py-0 text-[10px] font-semibold text-primary-foreground">
          {activeCount}
        </span>
      ) : null}
      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
    </Button>
  );

  const content = (
    <div
      className={cn(
        "flex min-h-0 flex-col gap-2.5",
        inline
          ? "rounded-xl border border-border bg-card p-3 shadow-sm"
          : "max-h-[min(50vh,20rem)]",
      )}
    >
      <div className={cn("flex items-center gap-3", title ? "justify-between" : "justify-end")}>
        {title ? (
          <div>
            <h3 className="text-base font-semibold leading-6 text-foreground">{title}</h3>
            {!inline ? <p className="text-xs text-muted-foreground">{description}</p> : null}
          </div>
        ) : null}
        {inline ? (
          <Button
            type="button"
            variant="ghost"
            onClick={handleClearWithReset}
            className="h-8 gap-1.5 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Xóa bộ lọc
          </Button>
        ) : null}
      </div>

      {!inline ? <Separator /> : null}

      <div className={cn(inline ? "" : "max-h-[16rem] min-h-[6rem] overflow-y-auto pr-2")}>
        <div
          className={cn(
            inline
              ? "grid grid-cols-1 items-end gap-x-4 gap-y-3 sm:grid-cols-[repeat(auto-fit,minmax(13rem,1fr))]"
              : "space-y-3",
          )}
        >
          {filters.map((filter) => {
            const current = value[filter.key];

            if (filter.type === "text") return null;

            if (filter.type === "select") {
              return (
                <div
                  key={filter.key}
                  className={cn(
                    "space-y-1.5",
                    inline ? "" : "mx-auto w-full max-w-[26rem]",
                  )}
                >
                  <Label className="text-xs font-medium">{filter.label}</Label>
                  <Select
                    value={typeof current === "string" ? current : "all"}
                    onValueChange={(nextValue) =>
                      onValueChange(filter.key, nextValue)
                    }
                  >
                    <SelectTrigger className="h-9 rounded-lg border-border bg-card text-xs ring-0 outline-none focus:border-primary focus:ring-0 focus-visible:border-primary focus-visible:ring-0 data-[state=open]:border-primary data-[state=open]:ring-0">
                      <SelectValue
                        placeholder={
                          filter.placeholder ||
                          `Chọn ${filter.label.toLowerCase()}`
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.allowAll !== false && (
                        <SelectItem value="all">
                          {filter.allLabel || `Tất cả ${filter.label}`}
                        </SelectItem>
                      )}
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            }

            if (filter.type === "multi-select") {
              const selected = Array.isArray(current) ? current : [];

              return (
                <div
                  key={filter.key}
                  className={cn(
                    "space-y-1.5",
                    inline ? "sm:col-span-2" : "mx-auto w-full max-w-[26rem]",
                  )}
                >
                  <Label className="text-xs font-medium">{filter.label}</Label>
                  <div className="rounded-lg border border-border/80 p-2.5">
                    <ScrollArea className="max-h-28 pr-1.5">
                      <div className="space-y-1.5">
                        {filter.options.map((option) => {
                          const checked = selected.includes(option.value);
                          return (
                            <label
                              key={option.value}
                              className="flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/60"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(checkedValue) => {
                                  const next = checkedValue
                                    ? [...selected, option.value]
                                    : selected.filter(
                                        (item) => item !== option.value,
                                      );
                                  onValueChange(filter.key, next);
                                }}
                                className="mt-0.5"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-medium text-foreground">
                                  {option.label}
                                </span>
                                {option.description ? (
                                  <span className="block text-xs text-muted-foreground">
                                    {option.description}
                                  </span>
                                ) : null}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              );
            }

            if (filter.type === "boolean") {
              return (
                <div
                  key={filter.key}
                  className={cn(
                    "space-y-1.5",
                    inline ? "" : "mx-auto w-full max-w-[26rem]",
                  )}
                >
                  <Label className="text-xs font-medium">{filter.label}</Label>
                  <div className="flex h-9 items-center justify-between rounded-lg px-1">
                    <p className="text-xs font-medium text-foreground">
                      {typeof current === "boolean"
                        ? current
                          ? filter.trueLabel || "Đã bật"
                          : filter.falseLabel || "Đã tắt"
                        : `Bật hoặc tắt ${filter.label.toLowerCase()}`}
                    </p>
                    <Switch
                      checked={typeof current === "boolean" ? current : false}
                      onCheckedChange={(checked) =>
                        onValueChange(filter.key, checked)
                      }
                    />
                  </div>
                </div>
              );
            }

            if (filter.type === "number-range") {
              const range =
                current && typeof current === "object"
                  ? (current as NumberRangeValue)
                  : {};
              const minValue = range.min;
              const maxValue = range.max;
              const minKey = getNumberFieldKey(filter.key, "min");
              const maxKey = getNumberFieldKey(filter.key, "max");
              const minDraft = getRangeDraftValue(filter.key, "min", minValue);
              const maxDraft = getRangeDraftValue(filter.key, "max", maxValue);
              const minError = numberErrors[minKey];
              const maxError = numberErrors[maxKey];

              return (
                <div
                  key={filter.key}
                  className={cn(
                    "space-y-1.5",
                    inline ? "" : "mx-auto w-full max-w-[26rem]",
                  )}
                >
                  <Label className="text-xs font-medium">{filter.label}</Label>
                  {filter.showSlider &&
                  typeof filter.min === "number" &&
                  typeof filter.max === "number" ? (
                    <div className="space-y-3 rounded-lg border border-border/80 px-2.5 py-3">
                      <Slider
                        min={filter.min}
                        max={filter.max}
                        step={filter.step || 1}
                        value={[minValue ?? filter.min, maxValue ?? filter.max]}
                        onValueChange={([min, max]) => {
                          onValueChange(filter.key, { min, max });
                          setNumberDrafts((prev) => ({
                            ...prev,
                            [minKey]: String(min),
                            [maxKey]: String(max),
                          }));
                          clearRangeError(filter.key, "min");
                          clearRangeError(filter.key, "max");
                        }}
                      />
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Input
                            type="number"
                            min={filter.min ?? 0}
                            max={filter.max}
                            step={filter.step || 1}
                            value={minDraft}
                            onChange={(event) =>
                              setNumberDrafts((prev) => ({
                                ...prev,
                                [minKey]: event.target.value,
                              }))
                            }
                            onBlur={(event) =>
                              commitRangeValue(
                                filter,
                                "min",
                                event.target.value,
                                range,
                              )
                            }
                            placeholder="Tối thiểu"
                            className="h-9 rounded-lg border-border bg-card text-xs ring-0 outline-none focus:border-primary focus:ring-0 focus-visible:border-primary focus-visible:ring-0"
                          />
                          {minError ? (
                            <p className="text-[11px] text-destructive">{minError}</p>
                          ) : null}
                        </div>
                        <div className="space-y-1">
                          <Input
                            type="number"
                            min={filter.min ?? 0}
                            max={filter.max}
                            step={filter.step || 1}
                            value={maxDraft}
                            onChange={(event) =>
                              setNumberDrafts((prev) => ({
                                ...prev,
                                [maxKey]: event.target.value,
                              }))
                            }
                            onBlur={(event) =>
                              commitRangeValue(
                                filter,
                                "max",
                                event.target.value,
                                {
                                  min: parseNumericInput(minDraft, {
                                    min: filter.min ?? 0,
                                    max: filter.max,
                                    integer: false,
                                  }),
                                  max: range.max,
                                },
                              )
                            }
                            placeholder="Tối đa"
                            className="h-9 rounded-lg border-border bg-card text-xs ring-0 outline-none focus:border-primary focus:ring-0 focus-visible:border-primary focus-visible:ring-0"
                          />
                          {maxError ? (
                            <p className="text-[11px] text-destructive">{maxError}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Input
                          type="number"
                          min={filter.min ?? 0}
                          max={filter.max}
                          step={filter.step || 1}
                          value={minDraft}
                          onChange={(event) =>
                            setNumberDrafts((prev) => ({
                              ...prev,
                              [minKey]: event.target.value,
                            }))
                          }
                          onBlur={(event) =>
                            commitRangeValue(
                              filter,
                              "min",
                              event.target.value,
                              range,
                            )
                          }
                          placeholder="Tối thiểu"
                          className="h-9 rounded-lg border-border bg-card text-xs ring-0 outline-none focus:border-primary focus:ring-0 focus-visible:border-primary focus-visible:ring-0"
                        />
                        {minError ? (
                          <p className="text-[11px] text-destructive">{minError}</p>
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <Input
                          type="number"
                          min={filter.min ?? 0}
                          max={filter.max}
                          step={filter.step || 1}
                          value={maxDraft}
                          onChange={(event) =>
                            setNumberDrafts((prev) => ({
                              ...prev,
                              [maxKey]: event.target.value,
                            }))
                          }
                          onBlur={(event) =>
                            commitRangeValue(
                              filter,
                              "max",
                              event.target.value,
                              {
                                min: parseNumericInput(minDraft, {
                                  min: filter.min ?? 0,
                                  max: filter.max,
                                  integer: false,
                                }),
                                max: range.max,
                              },
                            )
                          }
                          placeholder="Tối đa"
                          className="h-9 rounded-lg border-border bg-card text-xs ring-0 outline-none focus:border-primary focus:ring-0 focus-visible:border-primary focus-visible:ring-0"
                        />
                        {maxError ? (
                          <p className="text-[11px] text-destructive">{maxError}</p>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            if (filter.type === "date-range") {
              const range =
                current && typeof current === "object"
                  ? (current as { from?: string; to?: string })
                  : {};

              return (
                <div
                  key={filter.key}
                  className={cn(
                    "space-y-1.5",
                    inline ? "" : "mx-auto w-full max-w-[26rem]",
                  )}
                >
                  {!filter.hideLabel ? (
                    <Label className="text-xs font-medium">{filter.label}</Label>
                  ) : null}
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Từ ngày
                      </span>
                      <Input
                        type={filter.showTime ? "datetime-local" : "date"}
                        value={range.from || ""}
                        onChange={(event) =>
                          onValueChange(filter.key, {
                            from: event.target.value || undefined,
                            to: range.to,
                          })
                        }
                        className="h-9 rounded-lg border-border bg-card text-xs ring-0 outline-none focus:border-primary focus:ring-0 focus-visible:border-primary focus-visible:ring-0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Đến ngày
                      </span>
                      <Input
                        type={filter.showTime ? "datetime-local" : "date"}
                        value={range.to || ""}
                        onChange={(event) =>
                          onValueChange(filter.key, {
                            from: range.from,
                            to: event.target.value || undefined,
                          })
                        }
                        className="h-9 rounded-lg border-border bg-card text-xs ring-0 outline-none focus:border-primary focus:ring-0 focus-visible:border-primary focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>

      {!inline ? (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClearWithReset}
            className="h-8 rounded-lg px-3 text-xs"
          >
            Xóa bộ lọc
          </Button>
        </div>
      ) : null}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="max-h-[78vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">{content}</div>
          <DrawerFooter className="px-4 pb-6" />
        </DrawerContent>
      </Drawer>
    );
  }

  if (inline) {
    return <section className={cn("w-full", className)}>{content}</section>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[clamp(15.5rem,30vw,27rem)] max-w-[90vw] min-w-[15.5rem] max-h-[80vh] p-0"
      >
        <div className="p-2.5">{content}</div>
      </PopoverContent>
    </Popover>
  );
}

