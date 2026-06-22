import React, { useState, useEffect } from "react";
import { Modal, Select, Switch } from "antd";
import { CheckCircle2, Compass, Send, UserCheck, XCircle } from "lucide-react";
import { Priority } from "../enum";

interface ReflectionActionModalProps {
  modalType:
    | "REJECT"
    | "ASSIGN"
    | "DISPATCH"
    | "REPORT"
    | "CONFIRM"
    | "VERIFY"
    | null;
  open: boolean;
  onCancel: () => void;
  confirmLoading: boolean;
  onOk: (values: {
    textInput: string;
    extraInput: string;
    selectedUserId: number | null;
    selectedPriority: Priority;
    resolvedInput: boolean;
  }) => void;
  inspectors: { id: number; fullName: string }[];
  patrols: { id: number; fullName: string }[];
}

export const ReflectionActionModal: React.FC<ReflectionActionModalProps> = ({
  modalType,
  open,
  onCancel,
  confirmLoading,
  onOk,
  inspectors,
  patrols,
}) => {
  // Local input states
  const [textInput, setTextInput] = useState("");
  const [extraInput, setExtraInput] = useState("");
  const [booleanInput, setBooleanInput] = useState(false);
  const [resolvedInput, setResolvedInput] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<Priority>(
    Priority.MEDIUM,
  );

  // Reset inputs when modal type changes or modal opens
  useEffect(() => {
    if (open) {
      setTextInput("");
      setExtraInput("");
      setBooleanInput(false);
      setResolvedInput(true);
      setSelectedUserId(null);
      setSelectedPriority(Priority.MEDIUM);
    }
  }, [modalType, open]);

  const handleOk = () => {
    onOk({
      textInput,
      extraInput,
      selectedUserId,
      selectedPriority,
      resolvedInput,
    });
  };

  if (!modalType) return null;

  let title: React.ReactNode = "";
  let content: React.ReactNode = null;

  switch (modalType) {
    case "VERIFY": {
      const PRIORITY_OPTIONS = [
        {
          value: Priority.LOW,
          label: "Thấp",
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          border: "border-emerald-400",
        },
        {
          value: Priority.MEDIUM,
          label: "Trung bình",
          color: "text-amber-600",
          bg: "bg-amber-50",
          border: "border-amber-400",
        },
        {
          value: Priority.HIGH,
          label: "Cao / Khẩn cấp",
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-400",
        },
      ];
      title = (
        <span className="text-indigo-600 flex items-center gap-2">
          <CheckCircle2 size={18} /> Xác nhận phản ánh hợp lệ
        </span>
      );
      content = (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">
              Bạn có chắc muốn xác nhận phản ánh này là hợp lệ?
            </p>
            <p className="text-xs text-slate-400 mb-3">
              Sau khi xác nhận, Quản lý phường sẽ nhận được thông báo để tạo yêu
              cầu xử lý.
            </p>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">
              Mức độ khẩn cấp <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setSelectedPriority(p.value)}
                  className={`flex-1 py-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                    selectedPriority === p.value
                      ? `${p.bg} ${p.border} ${p.color}`
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">
              Ghi chú
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
              rows={3}
              placeholder="Nhập ghi chú thêm về sự cố..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          </div>
        </div>
      );
      break;
    }
    case "REJECT":
      title = (
        <span className="text-red-600 flex items-center gap-2">
          <XCircle size={18} /> Từ chối phản ánh
        </span>
      );
      content = (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Nhập lý do từ chối để thông báo đến người dân.
          </p>
          <textarea
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 bg-slate-50"
            rows={4}
            placeholder="Nhập lý do từ chối..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          />
        </div>
      );
      break;
    case "ASSIGN":
      title = (
        <span className="text-purple-600 flex items-center gap-2">
          <UserCheck size={18} /> Phân công Hậu kiểm
        </span>
      );
      content = (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">
              Chọn cán bộ Hậu kiểm <span className="text-red-500">*</span>
            </label>
            <Select
              placeholder="Chọn Hậu kiểm..."
              className="w-full"
              value={selectedUserId}
              onChange={setSelectedUserId}
              options={inspectors.map((u) => ({
                value: u.id,
                label: u.fullName,
              }))}
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">
              Ghi chú (Tùy chọn)
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50"
              rows={3}
              placeholder="Ghi chú cho Hậu kiểm..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          </div>
        </div>
      );
      break;
    case "DISPATCH":
      title = (
        <span className="text-blue-600 flex items-center gap-2">
          <Compass size={18} /> Điều động cán bộ Tuần tra
        </span>
      );
      content = (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">
              Chọn cán bộ Tuần tra <span className="text-red-500">*</span>
            </label>
            <Select
              placeholder="Chọn Tuần tra..."
              className="w-full"
              value={selectedUserId}
              onChange={setSelectedUserId}
              options={patrols.map((u) => ({
                value: u.id,
                label: u.fullName,
              }))}
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">
              Thời gian xử lý dự kiến (phút){" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50"
              placeholder="VD: 30"
              value={extraInput}
              onChange={(e) => setExtraInput(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">
              Ghi chú (Tùy chọn)
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50"
              rows={2}
              placeholder="Ghi chú cho cán bộ tuần tra..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          </div>
        </div>
      );
      break;
    case "REPORT":
      title = (
        <span className="text-sky-600 flex items-center gap-2">
          <Send size={18} /> Báo cáo kết quả thực địa
        </span>
      );
      content = (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-bold text-slate-700">Đã xử lý xong?</p>
              <p className="text-xs text-slate-400">
                Bật nếu sự cố đã được khắc phục hoàn toàn
              </p>
            </div>
            <Switch checked={resolvedInput} onChange={setResolvedInput} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">
              Nội dung báo cáo{" "}
              {!resolvedInput && <span className="text-red-500">*</span>}
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-400 bg-slate-50"
              rows={4}
              placeholder="Mô tả tình trạng hiện trường và kết quả xử lý..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          </div>
          {!resolvedInput && (
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">
                Lý do chưa hoàn thành <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 bg-slate-50"
                rows={2}
                placeholder="Nêu lý do chưa xử lý xong..."
                value={extraInput}
                onChange={(e) => setExtraInput(e.target.value)}
              />
            </div>
          )}
        </div>
      );
      break;
    case "CONFIRM":
      title = (
        <span className="text-emerald-600 flex items-center gap-2">
          <CheckCircle2 size={18} /> Xác nhận hoàn thành sự cố
        </span>
      );
      content = (
        <div className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <p className="text-sm text-emerald-700">
              Xác nhận sẽ: đánh dấu phản ánh là <strong>Đã giải quyết</strong>,
              và gửi thông báo đến tất cả bên liên quan.
            </p>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">
              Ghi chú xác nhận (Tùy chọn)
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
              rows={3}
              placeholder="Ghi chú của Quản lý..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          </div>
        </div>
      );
      break;
    default:
      break;
  }

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      onOk={handleOk}
      okText="Xác nhận"
      cancelText="Hủy"
      centered
      okButtonProps={{
        danger: modalType === "REJECT",
        style:
          modalType !== "REJECT"
            ? { backgroundColor: "#2563eb", borderColor: "#2563eb" }
            : undefined,
      }}
      width={520}
    >
      {content}
    </Modal>
  );
};
