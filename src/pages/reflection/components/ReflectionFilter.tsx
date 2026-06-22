import { Badge, Button, Input, Popover, Select, Tooltip } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleHelp,
  ListFilter,
  Plus,
  RefreshCcw,
  Search,
  X,
} from "lucide-react";
import { Category, Priority, ReflectionStatus } from "../enum";

// ─── Options ──────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { label: "Hạ tầng", value: Category.INFRASTRUCTURE },
  { label: "Môi trường", value: Category.ENVIRONMENT },
  { label: "An ninh trật tự", value: Category.SECURITY },
  { label: "Khác", value: Category.OTHER },
];

const PRIORITY_OPTIONS = [
  { label: "Thấp", value: Priority.LOW },
  { label: "Trung bình", value: Priority.MEDIUM },
  { label: "Cao", value: Priority.HIGH },
];

const STATUS_OPTIONS = [
  { label: "Chờ xác minh", value: ReflectionStatus.PENDING },
  { label: "Đã xác minh", value: ReflectionStatus.VERIFIED },
  { label: "Đã phân công", value: ReflectionStatus.ASSIGNED },
  { label: "Đang xử lý", value: ReflectionStatus.IN_PROGRESS },
  { label: "Chờ xác nhận", value: ReflectionStatus.COMPLETED },
  { label: "Đã hoàn thành", value: ReflectionStatus.RESOLVED },
  { label: "Từ chối", value: ReflectionStatus.REJECTED },
];

// ─── Field Configs ──────────────────────────────────────────
type FilterFieldType = "select" | "multi-select";

interface FilterField {
  key: string;
  label: string;
  type: FilterFieldType;
  options: { label: string; value: string }[];
  placeholder?: string;
}

const FILTER_FIELDS: FilterField[] = [
  {
    key: "category",
    label: "Danh mục",
    type: "select",
    options: CATEGORY_OPTIONS,
    placeholder: "Chọn danh mục",
  },
  {
    key: "status",
    label: "Trạng thái",
    type: "select",
    options: STATUS_OPTIONS,
    placeholder: "Chọn trạng thái",
  },
  {
    key: "priority",
    label: "Mức độ",
    type: "select",
    options: PRIORITY_OPTIONS,
    placeholder: "Chọn mức độ",
  },
];

// ─── Filter Output ─────────────────────────────────────────
export interface ReflectionFilterParams {
  keyword?: string;
  category?: Category;
  status?: ReflectionStatus;
  priority?: Priority;
}

// ─── Internal condition ────────────────────────────────────
interface Condition {
  id: string;
  fieldKey: string;
}

let _id = 0;
const nextId = () => `reff_${++_id}`;

// ─── Props ─────────────────────────────────────────────────
type Props = {
  onFilter: (params: ReflectionFilterParams) => void;
  onRefresh?: () => void;
  loading?: boolean;
};

// ─── Component ─────────────────────────────────────────────
export default function ReflectionFilter({ onFilter, onRefresh, loading }: Props) {
  // Đồng bộ trạng thái ban đầu từ URL params để tránh bị mất filter khi reload
  const [searchValue, setSearchValue] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("keyword") || "";
  });

  const [conditions, setConditions] = useState<Condition[]>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialConditions: Condition[] = [];
    FILTER_FIELDS.forEach((f) => {
      const val = urlParams.get(f.key);
      if (val) {
        initialConditions.push({ id: nextId(), fieldKey: f.key });
      }
    });
    return initialConditions;
  });

  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialValues: Record<string, unknown> = {};
    FILTER_FIELDS.forEach((f) => {
      const val = urlParams.get(f.key);
      if (val) {
        initialValues[f.key] = val;
      }
    });
    return initialValues;
  });

  const [filterOpen, setFilterOpen] = useState(false);

  const onFilterRef = useRef(onFilter);
  useEffect(() => {
    onFilterRef.current = onFilter;
  });

  // Khởi tạo prevOutputRef khớp với URL ban đầu
  const initialOutputJson = useMemo(() => {
    const output: ReflectionFilterParams = {};
    if (searchValue) output.keyword = searchValue;
    for (const [key, val] of Object.entries(values)) {
      if (val !== undefined && val !== null && val !== "") {
        (output as Record<string, unknown>)[key] = val;
      }
    }
    return JSON.stringify(output);
  }, []);

  const prevOutputRef = useRef(initialOutputJson);
  const isResettingRef = useRef(false);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchValue);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(searchValue), 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchValue]);

  const usedFieldKeys = useMemo(
    () => new Set(conditions.map((c) => c.fieldKey)),
    [conditions],
  );

  const activeFilterCount = useMemo(
    () =>
      Object.values(values).filter(
        (v) => v !== undefined && v !== null && v !== "",
      ).length,
    [values],
  );

  // Auto-emit
  useEffect(() => {
    if (isResettingRef.current) {
      isResettingRef.current = false;
      return;
    }
    const output: ReflectionFilterParams = {};
    if (debouncedSearch) output.keyword = debouncedSearch;
    for (const [key, val] of Object.entries(values)) {
      if (val !== undefined && val !== null && val !== "") {
        (output as Record<string, unknown>)[key] = val;
      }
    }
    const json = JSON.stringify(output);
    if (json !== prevOutputRef.current) {
      prevOutputRef.current = json;
      onFilterRef.current(output);
    }
  }, [values, debouncedSearch]);

  // Helpers
  const updateValue = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const clearValue = (key: string) => {
    setValues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const addCondition = () => {
    const available = FILTER_FIELDS.find((f) => !usedFieldKeys.has(f.key));
    if (!available) return;
    setConditions((prev) => [...prev, { id: nextId(), fieldKey: available.key }]);
  };

  const removeCondition = (id: string) => {
    const target = conditions.find((c) => c.id === id);
    if (!target) return;
    clearValue(target.fieldKey);
    setConditions((prev) => prev.filter((c) => c.id !== id));
  };

  const changeConditionField = (id: string, newKey: string) => {
    const cond = conditions.find((c) => c.id === id);
    if (!cond) return;
    clearValue(cond.fieldKey);
    setConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, fieldKey: newKey } : c)),
    );
  };

  const handleReset = () => {
    isResettingRef.current = true;
    setSearchValue("");
    setConditions([]);
    setValues({});
    prevOutputRef.current = "{}";
    onFilterRef.current({});
  };

  // Render input per field
  const renderInput = (cond: Condition) => {
    // Dynamically filter STATUS_OPTIONS if user is MANAGER
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isManager = user?.role?.roleCode === "MANAGER";
    
    let fieldOptions = FILTER_FIELDS.find((f) => f.key === cond.fieldKey)?.options || [];
    if (cond.fieldKey === "status" && isManager) {
      fieldOptions = fieldOptions.filter(opt => 
        opt.value !== ReflectionStatus.PENDING &&
        opt.value !== ReflectionStatus.VERIFIED &&
        opt.value !== ReflectionStatus.COMPLETED
      );
    }
    
    const field = FILTER_FIELDS.find((f) => f.key === cond.fieldKey);
    if (!field) return null;
    const commonProps = {
      className: "flex-1 min-w-[160px]",
      size: "middle" as const,
      allowClear: true,
      getPopupContainer: (t: HTMLElement) => t.parentElement || document.body,
    };
    if (field.type === "multi-select") {
      return (
        <Select
          {...commonProps}
          mode="multiple"
          placeholder={field.placeholder}
          maxTagCount="responsive"
          value={(values[field.key] as string[]) || []}
          onChange={(v) => updateValue(field.key, v)}
          options={fieldOptions}
        />
      );
    }
    return (
      <Select
        {...commonProps}
        placeholder={field.placeholder}
        value={values[field.key] as string | undefined}
        onChange={(v) => updateValue(field.key, v)}
        options={fieldOptions}
      />
    );
  };

  // Panel content
  const panelContent = (
    <div className="w-[480px] max-w-[90vw]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          Lọc phản ánh
          <Tooltip title="Bộ lọc ảnh hưởng đến dữ liệu hiển thị trên màn hình.">
            <CircleHelp
              size={14}
              className="text-gray-400 hover:text-blue-500 cursor-help transition-colors"
            />
          </Tooltip>
        </span>
        {conditions.length > 0 && (
          <Button
            type="link"
            size="small"
            danger
            onClick={handleReset}
            className="px-0! text-xs!"
          >
            Xóa tất cả
          </Button>
        )}
      </div>

      {/* Empty state */}
      {conditions.length === 0 && (
        <div className="text-sm leading-8 text-gray-400 py-6 text-center select-none">
          <ListFilter size={32} className="mx-auto mb-2 opacity-40" />
          Chưa có điều kiện lọc nào.
          <br />
          Nhấn{" "}
          <button
            type="button"
            onClick={addCondition}
            className="text-blue-600 font-medium bg-transparent border-none cursor-pointer p-0 hover:underline"
          >
            + Thêm điều kiện
          </button>{" "}
          để bắt đầu.
        </div>
      )}

      {/* Condition rows */}
      {conditions.length > 0 && (
        <div className="flex flex-col gap-2.5 mb-3">
          {conditions.map((cond) => (
            <div
              key={cond.id}
              className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center relative group p-2.5 sm:p-0 bg-slate-50 sm:bg-transparent rounded-xl border border-slate-200/50 sm:border-transparent"
            >
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Field picker */}
                <Select
                  size="middle"
                  className="flex-1 sm:flex-none sm:w-[180px]"
                  value={cond.fieldKey}
                  onChange={(v) => changeConditionField(cond.id, v)}
                  options={FILTER_FIELDS.filter(
                    (f) => f.key === cond.fieldKey || !usedFieldKeys.has(f.key),
                  ).map((f) => ({ label: f.label, value: f.key }))}
                  getPopupContainer={(t) => t.parentElement || document.body}
                  popupMatchSelectWidth={false}
                />

                {/* Remove button for mobile */}
                <button
                  type="button"
                  onClick={() => removeCondition(cond.id)}
                  className="sm:hidden shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 border-none cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Value input and desktop remove */}
              <div className="flex-1 flex items-center gap-2">
                {renderInput(cond)}

                {/* Remove button for desktop */}
                <button
                  type="button"
                  onClick={() => removeCondition(cond.id)}
                  className="hidden sm:flex shrink-0 w-7 h-7 items-center justify-center rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all duration-150 opacity-0 group-hover:opacity-100 bg-transparent border-none cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add condition button */}
      {conditions.length > 0 && usedFieldKeys.size < FILTER_FIELDS.length && (
        <button
          type="button"
          onClick={addCondition}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700
            font-medium transition-colors mt-1 mb-1 cursor-pointer
            bg-transparent border-none p-0"
        >
          <Plus size={14} />
          Thêm điều kiện
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-2.5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left: Filter button */}
        <div className="flex items-center gap-2 flex-wrap">
          <Popover
            content={panelContent}
            trigger="click"
            placement="bottomLeft"
            arrow={false}
            open={filterOpen}
            onOpenChange={setFilterOpen}
          >
            <Badge count={activeFilterCount} size="small" offset={[-4, 4]}>
              <Button icon={<ListFilter size={16} />} className="flex items-center gap-1">
                Bộ lọc
              </Button>
            </Badge>
          </Popover>
        </div>

        {/* Right: Search + Refresh */}
        <div className="flex items-center gap-3 ml-auto w-full md:w-auto">
          <Input
            className="w-full md:w-[300px]!"
            placeholder="Tìm kiếm theo tiêu đề, mô tả..."
            allowClear
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            prefix={<Search size={16} className="text-gray-400" />}
          />
          <Tooltip title="Tải lại dữ liệu">
            <RefreshCcw
              className={`text-gray-400 hover:text-gray-600 cursor-pointer transition-colors ${loading ? "animate-spin" : ""}`}
              size={20}
              onClick={onRefresh}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
