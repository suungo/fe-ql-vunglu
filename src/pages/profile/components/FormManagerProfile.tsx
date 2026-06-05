import { formRules } from "@/components/constants";
import { Gender } from "@/enums";
import { Button, DatePicker, Form, Input, message, notification, Select } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { updateProfileApi } from "../api";
import { ProfileStatus } from "../enum";
import type { UpdateProfile } from "../interfaces";

interface FormValues extends Omit<UpdateProfile, "dateBirth"> {
  dateBirth?: Dayjs;
}

type Props = {
  onCancel: () => void;
  initialValues: UpdateProfile;
  onSuccess: () => void;
};

export default function FormManagerUpdateProfile({
  onCancel,
  initialValues,
  onSuccess,
}: Props) {
  const [form] = Form.useForm<FormValues>();
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    form.setFieldsValue({
      ...initialValues,
      dateBirth: initialValues?.dateBirth
        ? dayjs(initialValues.dateBirth)
        : undefined,
      gender: initialValues?.gender,
      status: initialValues?.status,
    });
  }, [initialValues]);

  const handleUpdateProfile = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const DataUpdate = {
        ...values,
        userId: initialValues?.userId,
        dateBirth: dayjs(values?.dateBirth).format("YYYY-MM-DD"),
        gender: values?.gender,
        status: values?.status,
      };
      const response = await updateProfileApi(DataUpdate);
      if (response?.statusCode === 200) {
        notification.success({title:"Thành công",description: "Cập nhật thông tin thành công"});
        onSuccess();
        onCancel();
        localStorage.setItem("user", JSON.stringify(response?.data));

      } else {
        notification.error({title: "Thất bại",description: response.message});
      }
    } catch (error: unknown) {
      const err = error as { message?: string } | undefined;
      notification.error({title: "Thất bại",description: err?.message || "Có lỗi xảy ra"});
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Form
      layout="vertical"
      initialValues={{ remember: true }}
      onFinish={handleUpdateProfile}
      form={form}
    >
      <div className="grid grid-cols-2 gap-4">
        <Form.Item<FormValues>
          required={false}
          rules={formRules.fullName()}
          name="fullName"
          label={
            <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
              Họ và tên
              <span className="text-[#D32F2F] ml-1">*</span>
            </p>
          }
          validateTrigger={["onBlur", "onChange"]}
        >
          <Input className="w-full h-10!" placeholder="Nhập họ và tên" />
        </Form.Item>
        <Form.Item<FormValues>
          required={false}
          rules={formRules.email()}
          name="email"
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
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Form.Item<FormValues>
          required={false}
          rules={formRules.phone()}
          name="phoneNumber"
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
        <Form.Item<FormValues>
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
      </div>
      <div className="">
        <Form.Item<FormValues>
          required={false}
          rules={formRules.address()}
          name="address"
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
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Form.Item<FormValues>
          required={false}
          rules={[{ required: true, message: "Vui lòng nhập giới tính" }]}
          name="gender"
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
            labelInValue
            options={[
              {
                label: "Nam",
                value: Gender.MALE,
              },
              {
                label: "Nữ",
                value: Gender.FEMALE,
              },
            ]}
            placeholder="Nhập giới tính"
          />
        </Form.Item>
        <Form.Item<FormValues>
          required={false}
          rules={[{ required: true, message: "Vui lòng nhập trạng thái" }]}
          name="status"
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
            labelInValue
            options={Object.values(ProfileStatus).map((status) => ({
              label:
                status === ProfileStatus.ACTIVE
                  ? "Đang hoạt động"
                  : "Tạm ngừng hoạt động",
              value: status,
            }))}
            placeholder="Nhập trạng thái"
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
            type="primary"
            className="text-[16px] font-medium h-9!"
            htmlType="submit"
            loading={isLoading}
          >
            Cập nhật thông tin
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
}
