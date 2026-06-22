import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Select, Input, DatePicker } from "antd";
import dayjs from "dayjs";
import { Priority } from "@/pages/reflection/enum";

const { TextArea } = Input;

interface CreateDispatchModalProps {
  open: boolean;
  onCancel: () => void;
  loading: boolean;
  onCreate: (values: any) => void;
  reflectionList: any[];
  staffList: any[];
  initReflectionId: number | null;
}

export const CreateDispatchModal: React.FC<CreateDispatchModalProps> = ({
  open,
  onCancel,
  loading,
  onCreate,
  reflectionList,
  staffList,
  initReflectionId,
}) => {
  const [form] = Form.useForm();
  const [assignedTo, setAssignedTo] = useState<number | string | null>(null);
  const urgency = Form.useWatch("urgency", form);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ reflectionId: initReflectionId || undefined });
      setAssignedTo(null);
    }
  }, [open, initReflectionId, form]);

  const disabledDate = (current: dayjs.Dayjs) => {
    return current && current.isBefore(dayjs().startOf("day"));
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onCreate(values);
    } catch (err) {
      console.log("Validation failed:", err);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <span>Tạo yêu cầu tuần tra</span>
        </div>
      }
      open={open}
      width={"35vw"}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="create"
          type="primary"
          loading={loading}
          onClick={handleOk}
        >
          Xác nhận yêu cầu
        </Button>,
      ]}
    >
      <div className="space-y-4 py-2">
        <Form form={form} layout="vertical" onFinish={handleOk}>
          <Form.Item
            required={false}
            validateTrigger={["onBlur", "onChange"]}
            label={
              <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                Phản ánh<span className="text-[#D32F2F] ml-1">*</span>
              </p>
            }
            name="reflectionId"
            rules={[{ required: true, message: "Vui lòng chọn phản ánh" }]}
          >
            <Select
              placeholder="Chọn phản ánh"
              className="w-full h-9!"
              options={reflectionList.map((r: any) => ({
                value: r.id,
                label: `#${r.id} — ${r.title || r.content?.slice(0, 50)}`,
              }))}
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              notFoundContent={
                <div className="text-center text-slate-400 py-3 text-sm">
                  Không có phản ánh nào phù hợp
                </div>
              }
            />
          </Form.Item>

          <Form.Item
            required={false}
            validateTrigger={["onBlur", "onChange"]}
            label={
              <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                Cán bộ tuần tra
                <span className="text-[#D32F2F] ml-1">*</span>
              </p>
            }
            name="assignedTo"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn cán bộ tuần tra hoặc chọn Khác",
              },
            ]}
          >
            <Select
              placeholder="Chọn cán bộ tuần tra..."
              className="w-full"
              value={assignedTo}
              onChange={(val) => setAssignedTo(val)}
              options={[
                ...staffList.map((u: any) => ({
                  value: u.userId || u.id,
                  label: u.fullName,
                })),
                { value: "OTHER", label: "Khác" },
              ]}
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              allowClear
            />
          </Form.Item>

          {assignedTo === "OTHER" && (
            <Form.Item
              required={false}
              validateTrigger={["onBlur", "onChange"]}
              label={
                <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                  Tên người xử lý khác
                  <span className="text-[#D32F2F] ml-1">*</span>
                </p>
              }
              name="customHandler"
              rules={[
                { required: true, message: "Vui lòng nhập tên người xử lý" },
              ]}
            >
              <Input placeholder="Nhập tên người xử lý..." className="w-full" />
            </Form.Item>
          )}

          {assignedTo !== "OTHER" && (
            <>
              <Form.Item
                required={false}
                validateTrigger={["onBlur", "onChange"]}
                label={
                  <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                    Cấp độ xử lý
                    <span className="text-[#D32F2F] ml-1">*</span>
                  </p>
                }
                name="urgency"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn cấp độ xử lý",
                  },
                ]}
              >
                <Select
                  placeholder="Chọn cấp độ xử lý..."
                  className="w-full h-9!"
                  options={[
                    { value: Priority.HIGH, label: "Cực kỳ khẩn cấp" },
                    { value: Priority.MEDIUM, label: "Khẩn cấp" },
                    { value: Priority.LOW, label: "Thông thường" },
                  ]}
                />
              </Form.Item>
              <Form.Item
                required={false}
                dependencies={["urgency"]}
                validateTrigger={["onBlur", "onChange"]}
                label={
                  <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                    Thời gian dự kiến hoàn thành
                    <span className="text-[#D32F2F] ml-1">*</span>
                  </p>
                }
                name="expectedTime"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn thời gian dự kiến",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value) return Promise.resolve();
                      const selectedUrgency = getFieldValue("urgency");
                      const today = dayjs().startOf("day");
                      if (value.isBefore(today)) {
                        return Promise.reject(new Error("Thời gian không được chọn trước ngày hôm nay"));
                      }
                      if (selectedUrgency === Priority.MEDIUM) {
                        const maxDate = today.add(2, "day").endOf("day");
                        if (value.isAfter(maxDate)) {
                          return Promise.reject(
                            new Error("Cấp độ khẩn cấp chỉ được chọn thời gian hoàn thành trong 2 ngày")
                          );
                        }
                      } else if (selectedUrgency === Priority.HIGH) {
                        const maxDate = today.endOf("day");
                        if (value.isAfter(maxDate)) {
                          return Promise.reject(
                            new Error("Cấp độ cực kỳ khẩn cấp chỉ được chọn thời gian hoàn thành trong ngày")
                          );
                        }
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <DatePicker
                  placeholder="Chọn thời gian dự kiến..."
                  className="w-full h-9!"
                  format={"DD/MM/YYYY"}
                  disabledDate={disabledDate}
                />
              </Form.Item>
            </>
          )}

          <Form.Item
            required={false}
            validateTrigger={["onBlur", "onChange"]}
            label={
              <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                Mô tả chi tiết
              </p>
            }
            name="description"
          >
            <TextArea
              placeholder="Nhập mô tả chi tiết..."
              className="w-full"
              rows={3}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
