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
import {
  HasBusiness,
  HasChildren,
  HasElderly,
  HasPregnant,
  HasSick,
  HouseType,
} from "../enum";

// ─── Options ──────────────────────────────────────────────
const HOUSE_TYPE_OPTIONS = [
  { label: "Nhà cấp 4", value: HouseType.HOUSE_LEVEL_4 },
  { label: "Nhà phố (Nhà ống)", value: HouseType.HOUSE_STREET },
  { label: "Nhà trong hẻm", value: HouseType.HOUSE_ALLEY },
  { label: "Nhà mặt tiền", value: HouseType.HOUSE_FRONTAGE },
  { label: "Chung cư / căn hộ", value: HouseType.APARTMENT },
  { label: "Nhà trọ / phòng trọ", value: HouseType.RENTAL_HOUSE },
  { label: "Biệt thự / nhà liền kề", value: HouseType.VILLA },
];

const YES_NO_OPTIONS = [
  { label: "Có", value: "YES" },
  { label: "Không", value: "NO" },
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
    key: "houseType",
    label: "Loại nhà",
    type: "select",
    options: HOUSE_TYPE_OPTIONS,
    placeholder: "Chọn loại nhà",
  },
  {
    key: "hasElderly",
    label: "Có người già",
    type: "select",
    options: YES_NO_OPTIONS,
    placeholder: "Chọn",
  },
  {
    key: "hasChildren",
    label: "Có trẻ em",
    type: "select",
    options: YES_NO_OPTIONS,
    placeholder: "Chọn",
  },
  {
    key: "hasPregnantWomen",
    label: "Có phụ nữ mang thai",
    type: "select",
    options: YES_NO_OPTIONS,
    placeholder: "Chọn",
  },
  {
    key: "hasChronicDisease",
    label: "Có người bệnh nền",
    type: "select",
    options: YES_NO_OPTIONS,
    placeholder: "Chọn",
  },
  {
    key: "hasBusiness",
    label: "Có kinh doanh",
    type: "select",
    options: YES_NO_OPTIONS,
    placeholder: "Chọn",
  },
];

// ─── Filter Output ─────────────────────────────────────────
export interface ResidentFilterParams {
  keyword?: string;
  houseType?: HouseType;
  hasElderly?: HasElderly;
  hasChildren?: HasChildren;
  hasPregnantWomen?: HasPregnant;
  hasChronicDisease?: HasSick;
  hasBusiness?: HasBusiness;
}

// ─── Internal condition ────────────────────────────────────
interface Condition {
  id: string;
  fieldKey: string;
}

let _id = 0;
const nextId = () => `rf_${++_id}`;

// ─── Props ─────────────────────────────────────────────────
type Props = {
  onFilter: (params: ResidentFilterParams) => void;
  onRefresh?: () => void;
  loading?: boolean;
};

// ─── Component ─────────────────────────────────────────────
export default function ResidentFilter({ onFilter, onRefresh, loading }: Props) {
  const [searchValue, setSearchValue] = useState("");
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [filterOpen, setFilterOpen] = useState(false);

  const onFilterRef = useRef(onFilter);
  useEffect(() => {
    onFilterRef.current = onFilter;
  });

  const prevOutputRef = useRef("");
  const isResettingRef = useRef(false);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(searchValue), 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
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
    const output: ResidentFilterParams = {};
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
          options={field.options}
        />
      );
    }
    return (
      <Select
        {...commonProps}
        placeholder={field.placeholder}
        value={values[field.key] as string | undefined}
        onChange={(v) => updateValue(field.key, v)}
        options={field.options}
      />
    );
  };

  // Panel content
  const panelContent = (
    <div className="w-[480px] max-w-[90vw]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          Lọc hộ dân
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
        <div className="flex items-center gap-3 ml-auto">
          <Input
            style={{ width: 300 }}
            placeholder="Tìm kiếm theo mã, tên hộ dân, SĐT..."
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
