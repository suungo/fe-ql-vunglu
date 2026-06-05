import { formRules } from "@/components/constants";
import { Gender } from "@/enums";
import { useHRVerificationSocket } from "@/hooks/useHRVerificationSocket";
import { Button, DatePicker, Form, Input, notification, Select } from "antd";
import { HttpStatusCode } from "axios";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { updateHumanResource, getListHumanResource, getHRVerificationHistory } from "../api";
import { SelectGender, SelectHumanResourcesPosition, SelectHumanResourcesStatus } from "../constants";
import { useHumanResourceDetail } from "../hooks";
import type { CreateHumanResources, UpdateHumanResources } from "../interfaces";
import { HumanResourcesPosition } from "../enum";

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
  const { emitNewHRRegistration } = useHRVerificationSocket();

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
      if (mode === "add") {
        // A. Kiểm tra trong hệ thống chính DA-TTTN
        const activeCheck = await getListHumanResource(values.employeeCode, 1, 1);
        const codeExistsInActive = activeCheck?.data?.some(
          (hr) => hr.employeeCode.trim().toLowerCase() === values.employeeCode.trim().toLowerCase()
        );

        if (codeExistsInActive) {
          notification.error({
            message: "Trùng mã nhân sự",
            title: "Trùng mã nhân sự",
            description: `Mã nhân sự "${values.employeeCode}" đã tồn tại và đang hoạt động trên hệ thống.`,
          });
          setIsLoading(false);
          return;
        }

        // B. Kiểm tra trong hệ thống xác thực (đang chờ duyệt hoặc đã duyệt)
        try {
          const verifyCheck = await getHRVerificationHistory(values.employeeCode);
          const hasPendingOrApproved = verifyCheck?.data?.some(
            (item) => item.status === "PENDING" || item.status === "APPROVED"
          );

          if (hasPendingOrApproved) {
            notification.error({
              message: "Yêu cầu đã tồn tại",
              title: "Yêu cầu đã tồn tại",
              description: `Mã nhân sự "${values.employeeCode}" đã có hồ sơ đang chờ duyệt hoặc đã xác thực trên hệ thống xác minh.`,
            });
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Skip verification history check error", e);
        }
      }

      const creator = JSON.parse(localStorage.getItem("user") || "null");
      const payload = {
        ...values,
        dateBirth: values.dateBirth
          ? dayjs(values.dateBirth).toISOString()
          : undefined,
        creator: creator ? {
          id: creator.id,
          fullName: creator.fullName,
          phoneNumber: creator.phoneNumber,
          email: creator.email,
          employeeCode: creator.employeeCode,
          position: creator.role?.roleName || creator.role?.roleCode || "Quản lý",
        } : null,
      };
 
      if (mode === "edit" && id) {
        const response = await updateHumanResource(
          payload as UpdateHumanResources,
          id,
        );
        if (
          response?.statusCode === 201 ||
          response?.statusCode === HttpStatusCode.Ok
        ) {
          notification.success({
            title: "Thành Công",
            description: response?.message || "Cập nhật nhân sự thành công",
          });
          onCancel();
          refetch();
        }
      } else {
        // Thay vì gọi createHumanResource, gửi data tới hệ thống duyệt
        emitNewHRRegistration(payload);
        notification.success({
          title: "Đã gửi yêu cầu",
          description:
            "Yêu cầu đăng ký nhân sự đã được gửi đến hệ thống quản lý để chờ duyệt.",
        });
        onCancel();
        form.resetFields();
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
              options={SelectHumanResourcesPosition}
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
              options={SelectGender}
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
              options={SelectHumanResourcesStatus}
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
