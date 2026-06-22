import React from "react";
import { Modal, Form, InputNumber, Button, Avatar, Input } from "antd";
import { Award } from "lucide-react";
import type { FormInstance } from "antd";
import type { UserReputation } from "../hook/useReputationData";
import { getInitials, AVATAR_COLORS } from "../utils/reputationHelpers";

interface ReputationModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (val: boolean) => void;
  selectedUser: UserReputation | null;
  setSelectedUser: (user: UserReputation | null) => void;
  form: FormInstance;
  isSubmitting: boolean;
  handleUpdate: () => void;
}

export default function ReputationModal({
  isModalOpen,
  setIsModalOpen,
  selectedUser,
  setSelectedUser,
  form,
  isSubmitting,
  handleUpdate,
}: ReputationModalProps) {
  return (
    <Modal
      title={null}
      open={isModalOpen}
      onCancel={() => {
        setIsModalOpen(false);
        setSelectedUser(null);
        form.resetFields();
      }}
      footer={null}
      width={440}
      centered
      className="reputation-modal"
    >
      {selectedUser && (
        <div className="pt-2">
          {/* Modal Header */}
          <h1 className="text-[18px] lg:text-[20px] font-bold text-[#272727] mb-6">
            Điều chỉnh điểm uy tín
          </h1>

          {/* User Info */}
          <div className="bg-slate-50 rounded-xl p-4 mb-5 flex items-center gap-3">
            <Avatar
              size={44}
              style={{
                backgroundColor:
                  AVATAR_COLORS[selectedUser.id % AVATAR_COLORS.length],
              }}
              className="font-bold text-sm shrink-0"
            >
              {getInitials(selectedUser.fullName)}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-800 truncate">
                {selectedUser.fullName || "Ẩn danh"}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {selectedUser.phoneNumber} ·{" "}
                {selectedUser.role?.roleName || "Cư dân"}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-slate-800">
                {selectedUser.reputationPoints ?? 10}
                <span className="text-sm text-slate-400 font-normal">/10</span>
              </div>
              <div className="text-xs text-slate-500">Hiện tại</div>
            </div>
          </div>

          {/* Form */}
          <Form form={form} layout="vertical">
            <Form.Item
              required={false}
              label={
                <span className="text-sm font-medium text-slate-700">
                  Điểm uy tín mới (0 – 10)
                  <span className="text-red-600">*</span>
                </span>
              }
              name="reputationPoints"
              rules={[
                { required: true, message: "Vui lòng nhập điểm uy tín" },
                {
                  type: "number",
                  min: 0,
                  max: 10,
                  message: "Điểm uy tín phải từ 0 đến 10",
                },
              ]}
            >
              <InputNumber
                min={0}
                max={10}
                className="w-full! rounded-lg "
                size="large"
                placeholder="Nhập điểm từ 0 đến 10"
              />
            </Form.Item>

            <Form.Item
              required={false}
              label={
                <span className="text-sm font-medium text-slate-700">
                  Lý do điều chỉnh
                  <span className="text-red-600">*</span>
                </span>
              }
              name="reason"
              rules={[
                { required: true, message: "Vui lòng nhập lý do điều chỉnh" },
                { max: 1000, message: "Tối đa 1000 ký tự" },
              ]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Nhập lý do điều chỉnh"
                className="rounded-lg"
              />
            </Form.Item>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-xs text-amber-700">
              <strong>Lưu ý:</strong> Điểm &lt; 5 sẽ hiển thị cảnh báo khi cư dân gửi phản ánh. Điểm = 0 sẽ tạm khóa chức năng gửi phản ánh trong 15 ngày.
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 rounded-lg"
                size="large"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedUser(null);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                size="large"
                loading={isSubmitting}
                onClick={handleUpdate}
                className="flex-1 rounded-lg"
                style={{ background: "#6366f1", borderColor: "#6366f1" }}
              >
                Lưu thay đổi
              </Button>
            </div>
          </Form>
        </div>
      )}
    </Modal>
  );
}
