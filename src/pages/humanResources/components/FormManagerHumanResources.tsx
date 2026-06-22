import { formRules } from "@/components/constants";
import { Gender } from "@/enums";
import {
  Button,
  DatePicker,
  Form,
  Input,
  notification,
  Select,
  Radio,
  Upload,
} from "antd";
import axios, { HttpStatusCode } from "axios";
import dayjs from "dayjs";
import { Upload as UploadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { BASE_URL } from "@/apis";
import {
  updateHumanResource,
  getListHumanResource,
  createHumanResource,
} from "../api";
import {
  SelectGender,
  SelectHumanResourcesPosition,
  SelectHumanResourcesStatus,
} from "../constants";
import { useHumanResourceDetail } from "../hooks";
import type { CreateHumanResources } from "../interfaces";
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
  const [fileList, setFileList] = useState<any[]>([]);
  const { data: detailData, isLoading: isLoadingHumanResource } =
    useHumanResourceDetail(Number(id));

  const evidenceType = Form.useWatch("evidenceType", form) || "image";

  const [provinces, setProvinces] = useState<{ code: number; name: string }[]>(
    [],
  );
  const [wards, setWards] = useState<{ code: number; name: string }[]>([]);

  const handleProvinceChange = (provinceName: string) => {
    form.setFieldsValue({ ward: undefined } as any);
    setWards([]);
    if (!provinceName) return;

    const selectedProvince = provinces.find((p) => p.name === provinceName);
    if (!selectedProvince) return;

    BASE_URL.get("/wards", { params: { provinceCode: selectedProvince.code } })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setWards(list);
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (detailData?.data) {
      let provinceValue = "";
      let wardValue = "";
      let detailAddressValue = "";
      if (detailData.data.address) {
        const parts = detailData.data.address
          .split(",")
          .map((p: string) => p.trim());
        if (parts.length >= 3) {
          provinceValue = parts[parts.length - 1];
          wardValue = parts[parts.length - 2];
          detailAddressValue = parts.slice(0, parts.length - 2).join(", ");
        } else {
          detailAddressValue = detailData.data.address;
        }
      }

      form.setFieldsValue({
        ...detailData.data,
        province: provinceValue || undefined,
        ward: wardValue || undefined,
        detailAddress: detailAddressValue,
        dateBirth: detailData.data.dateBirth
          ? dayjs(detailData.data.dateBirth)
          : null,
      } as any);
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
  const handleLogin = async (values: CreateHumanResources) => {
    setIsLoading(true);
    try {
      if (mode === "add") {
        // A. Kiểm tra trong hệ thống chính DA-TTTN
        const activeCheck = await getListHumanResource(
          values.employeeCode,
          1,
          1,
        );
        const codeExistsInActive = activeCheck?.data?.some(
          (hr) =>
            hr.employeeCode.trim().toLowerCase() ===
            values.employeeCode.trim().toLowerCase(),
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
      }

      let avatarUrl = undefined;
      if (mode === "add" && values.evidenceFile) {
        const formData = new FormData();
        formData.append("file", values.evidenceFile);
        try {
          const uploadRes = await BASE_URL.post<{ url: string }>(
            "/upload/file",
            formData,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                "Content-Type": "multipart/form-data",
              },
            },
          );
          if (uploadRes?.data?.url) {
            avatarUrl = uploadRes.data.url;
          }
        } catch (uploadError) {
          console.error("Upload evidence file failed:", uploadError);
          notification.error({
            message: "Tải file lên thất bại",
            description: "Không thể tải tài liệu minh chứng lên Cloudinary.",
          });
          setIsLoading(false);
          return;
        }
      }

      const creator = JSON.parse(localStorage.getItem("user") || "null");
      const {
        province,
        ward,
        detailAddress,
        evidenceFile,
        evidenceType,
        ...otherValues
      } = values as any;
      const combinedAddress = `${detailAddress}, ${ward}, ${province}`;
      const payload: any = {
        ...otherValues,
        address: combinedAddress,
        dateBirth: values.dateBirth
          ? dayjs(values.dateBirth).toISOString()
          : undefined,
        creator: creator
          ? {
              id: creator.id,
              fullName: creator.fullName,
              phoneNumber: creator.phoneNumber,
              email: creator.email,
              employeeCode: creator.employeeCode,
              position:
                creator.role?.roleName || creator.role?.roleCode || "Quản lý",
            }
          : null,
      };

      if (avatarUrl) {
        payload.avatar = avatarUrl;
      }

      if (mode === "edit" && id) {
        const response = await updateHumanResource(
          payload as CreateHumanResources,
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
        const response = await createHumanResource(payload);
        if (
          response?.statusCode === 201 ||
          response?.statusCode === HttpStatusCode.Ok
        ) {
          notification.success({
            title: "Thành Công",
            description: response?.message || "Thêm nhân sự thành công",
          });
          onCancel();
          refetch();
          form.resetFields();
          setFileList([]);
        }
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
      setFileList([]);
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
        <div className="grid lg:grid-cols-2 grid-cols-1 lg:gap-4">
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
            <Input
              allowClear
              autoFocus
              className="w-full h-10!"
              placeholder="Nhập mã nhân sự"
            />
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
            <Input
              allowClear
              className="w-full h-10!"
              placeholder="Nhập tên nhân sự"
            />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-2 grid-cols-1 lg:gap-4">
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
            <Input
              allowClear
              className="w-full h-10!"
              placeholder="Nhập email"
            />
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
            <Input
              allowClear
              className="w-full h-10!"
              placeholder="Nhập số điện thoại"
            />
          </Form.Item>
        </div>

        <div className="grid lg:grid-cols-2 grid-cols-1 lg:gap-4">
          <Form.Item
            required={false}
            rules={formRules.address()}
            name="detailAddress"
            label={
              <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                Địa chỉ chi tiết
                <span className="text-[#D32F2F] ml-1">*</span>
              </p>
            }
            validateTrigger={["onBlur", "onChange"]}
          >
            <Input
              allowClear
              className="w-full h-10!"
              placeholder="Nhập số nhà, tên đường..."
            />
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
              showSearch
              optionFilterProp="label"
              className="w-full h-10!"
              allowClear
              options={SelectHumanResourcesPosition}
              placeholder="Nhập chức vụ"
            />
          </Form.Item>
        </div>
        <div className="grid lg:grid-cols-2 grid-cols-1 lg:gap-4">
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
              showSearch
              optionFilterProp="label"
              className="w-full h-10!"
              allowClear
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
              showSearch
              optionFilterProp="label"
              className="w-full h-10!"
              options={SelectHumanResourcesStatus}
              placeholder="Nhập trạng thái"
              allowClear
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
            allowClear
          />
        </Form.Item>
        {mode === "add" && (
          <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
            <Form.Item<CreateHumanResources>
              name="evidenceType"
              initialValue="image"
              label={
                <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                  Loại tài liệu minh chứng
                </p>
              }
            >
              <Radio.Group className="w-full">
                <Radio value="image">Hình ảnh</Radio>
                <Radio value="document">Văn bản</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item<CreateHumanResources>
              name="evidenceFile"
              label={
                <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                  Minh chứng kèm theo
                </p>
              }
              valuePropName="file"
              getValueFromEvent={(e) => {
                if (Array.isArray(e)) return e;
                return e && e.fileList && e.fileList[0]?.originFileObj;
              }}
            >
              <Upload
                maxCount={1}
                beforeUpload={() => false}
                fileList={fileList}
                accept={
                  evidenceType === "image"
                    ? ".jpg,.jpeg,.png,.gif"
                    : ".pdf,.doc,.docx"
                }
                onChange={({ fileList: newList }) => {
                  setFileList(newList.slice(-1));
                }}
              >
                <Button
                  className="w-full h-10! flex items-center justify-center gap-2"
                  icon={<UploadIcon size={16} />}
                >
                  Chọn tệp (
                  {evidenceType === "image"
                    ? "Ảnh quyết định"
                    : "Văn bản PDF/Word"}
                  )
                </Button>
              </Upload>
            </Form.Item>
          </div>
        )}
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
              allowClear
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
