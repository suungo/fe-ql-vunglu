import { formRules } from "@/components/constants";
import { Gender } from "@/enums";
import { Button, DatePicker, Form, Input, notification, Select } from "antd";
import { HttpStatusCode } from "axios";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { createHumanResource, updateHumanResource } from "../api";
import { HumanResourcesPosition, HumanResourcesStatus } from "../enum";
import { useHumanResourceDetail } from "../hooks";
import type { CreateHumanResources, UpdateHumanResources } from "../interfaces";

type Props = {
  onCancel: () => void;
  mode: "edit" | "add";
  id: number | null;
  refetch: () => void;
};

export default function FormManagerHumanResources({
  onCancel,
  mode,
  refetch,
  id,
}: Props) {
  const [form] = Form.useForm<CreateHumanResources>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { data: detailData, isLoading: isLoadingHumanResource } =
    useHumanResourceDetail(Number(id));

  useEffect(() => {
    if (detailData?.data) {
      form.setFieldsValue({
        ...detailData.data,
        dateBirth: detailData.data.dateBirth
          ? dayjs(detailData.data.dateBirth)
          : null,
        // Thêm các trường select, date, ... cần format
      });
    }
  }, [detailData?.data, form]);

  if (isLoadingHumanResource) {
    return (
      <div className="flex justify-center items-center h-64">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!detailData?.data && id) {
    return <div>Không tìm thấy thông tin nhân sự</div>;
  }
  const handleLogin = async (
    values: CreateHumanResources | UpdateHumanResources,
  ) => {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        dateBirth: values.dateBirth
          ? dayjs(values.dateBirth).toISOString()
          : undefined,
      };

      const response =
        mode === "edit" && id
          ? await updateHumanResource(payload as UpdateHumanResources, id)
          : await createHumanResource(payload as CreateHumanResources);
      if (
        response?.statusCode === 201 ||
        response?.statusCode === HttpStatusCode.Ok
      ) {
        notification.success({
          title: "Thành Công",
          description:
            response?.message ||
            (mode === "edit"
              ? "Cập nhật nhân sự thành công"
              : "Thêm nhân sự thành công"),
        });
        onCancel();
        refetch();
      }
    } catch (error: unknown) {
      const errorMsg =
        (error as any)?.response?.data?.message ||
        (error as any)?.response?.data?.error ||
        "Lỗi từ server";
      notification.error({
        title: "Thất bại",
        description:
          errorMsg ||
          (mode === "edit"
            ? "Cập nhật nhân sự thất bại"
            : "Thêm nhân sự thất bại"),
      });
      setIsLoading(false);
      form.resetFields();
      onCancel();
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div>
      <Form
        layout="vertical"
        initialValues={{ remember: true }}
        onFinish={handleLogin}
        form={form}
      >
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
          <Form.Item<CreateHumanResources>
            rules={formRules.code()}
            name="employeeCode"
            required={false}
            label={
              <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                Mã nhân sự
                <span className="text-[#D32F2F] ml-1">*</span>
              </p>
            }
            validateTrigger={["onBlur", "onChange"]}
          >
            <Input className="w-full h-10!" placeholder="Nhập mã nhân sự" />
          </Form.Item>
          <Form.Item<CreateHumanResources>
            rules={formRules.fullName()}
            name="fullName"
            required={false}
            label={
              <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                Tên nhân sự
                <span className="text-[#D32F2F] ml-1">*</span>
              </p>
            }
            validateTrigger={["onBlur", "onChange"]}
          >
            <Input className="w-full h-10!" placeholder="Nhập tên nhân sự" />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
          <Form.Item<CreateHumanResources>
            rules={formRules.email()}
            name="email"
            required={false}
            label={
              <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                Email
                <span className="text-[#D32F2F] ml-1">*</span>
              </p>
            }
            validateTrigger={["onBlur", "onChange"]}
          >
            <Input className="w-full h-10!" placeholder="Nhập email" />
          </Form.Item>
          <Form.Item<CreateHumanResources>
            rules={formRules.phone()}
            name="phoneNumber"
            required={false}
            label={
              <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                Số điện thoại
                <span className="text-[#D32F2F] ml-1">*</span>
              </p>
            }
            validateTrigger={["onBlur", "onChange"]}
          >
            <Input className="w-full h-10!" placeholder="Nhập số điện thoại" />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
          <Form.Item<CreateHumanResources>
            rules={formRules.address()}
            name="address"
            required={false}
            label={
              <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                Địa chỉ
                <span className="text-[#D32F2F] ml-1">*</span>
              </p>
            }
            validateTrigger={["onBlur", "onChange"]}
          >
            <Input className="w-full h-10!" placeholder="Nhập địa chỉ" />
          </Form.Item>
          <Form.Item<CreateHumanResources>
            rules={[{ required: true, message: "Vui lòng nhập chức vụ" }]}
            name="position"
            required={false}
            label={
              <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                Chức vụ
                <span className="text-[#D32F2F] ml-1">*</span>
              </p>
            }
            validateTrigger={["onBlur", "onChange"]}
          >
            <Select
              className="w-full h-10!"
              options={[
                {
                  label: "Cán bộ (Công an xã)",
                  value: HumanResourcesPosition.OFFICER,
                },
                {
                  label: "Tình nguyện viên",
                  value: HumanResourcesPosition.LEADER,
                },
                {
                  label: "Nhân viên y tế",
                  value: HumanResourcesPosition.STAFF,
                },
              ]}
              placeholder="Nhập chức vụ"
            />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
          <Form.Item<CreateHumanResources>
            rules={[{ required: true, message: "Vui lòng nhập giới tính" }]}
            name="gender"
            required={false}
            label={
              <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                Giới tính
                <span className="text-[#D32F2F] ml-1">*</span>
              </p>
            }
            validateTrigger={["onBlur", "onChange"]}
          >
            <Select
              className="w-full h-10!"
              options={Object.values(Gender).map((status) => ({
                label: status === Gender.MALE ? "Nam" : "Nữ",
                value: status,
              }))}
              placeholder="Nhập giới tính"
            />
          </Form.Item>
          <Form.Item<CreateHumanResources>
            rules={[{ required: true, message: "Vui lòng nhập trạng thái" }]}
            name="status"
            required={false}
            label={
              <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                Trạng thái
                <span className="text-[#D32F2F] ml-1">*</span>
              </p>
            }
            validateTrigger={["onBlur", "onChange"]}
          >
            <Select
              className="w-full h-10!"
              options={[
                {
                  label: "Đang làm việc",
                  value: HumanResourcesStatus.ACTIVE,
                },
                {
                  label: "Chưa làm việc",
                  value: HumanResourcesStatus.PENDING,
                },
                {
                  label: "Dừng làm việc",
                  value: HumanResourcesStatus.INACTIVE,
                },
              ]}
              placeholder="Nhập trạng thái"
            />
          </Form.Item>
        </div>
        <Form.Item<CreateHumanResources>
          required={false}
          rules={[{ required: true, message: "Vui lòng nhập ngày sinh" }]}
          name="dateBirth"
          label={
            <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
              Ngày sinh
              <span className="text-[#D32F2F] ml-1">*</span>
            </p>
          }
          validateTrigger={["onBlur", "onChange"]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            className="w-full h-10!"
            placeholder="Nhập ngày sinh"
          />
        </Form.Item>
        <div>
          <Form.Item<CreateHumanResources>
            name="notes"
            required={false}
            label={
              <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                Mô tả
              </p>
            }
            validateTrigger={["onBlur", "onChange"]}
            rules={[{ max: 1000, message: "Tối đa 1000 ký tự" }]}
          >
            <Input.TextArea
              className="w-full"
              rows={3}
              placeholder="Nhập mô tả"
            />
          </Form.Item>
        </div>
        <Form.Item>
          <div className="flex justify-end gap-2">
            <Button
              color="danger"
              variant="solid"
              className="text-[16px] font-medium h-9!"
              onClick={onCancel}
            >
              Hủy
            </Button>
            <Button
              loading={isLoading}
              type="primary"
              className="text-[16px] font-medium h-9!"
              htmlType="submit"
            >
              {mode === "add" ? "Thêm Nhân Sự" : "Cập nhật"}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
}
