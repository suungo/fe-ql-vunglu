import { normalizeCurrency, parseCurrency } from "@/components/utils/currency";
import { formatNumber } from "@/components/utils/formatData";
import {
  Button,
  Form,
  Input,
  InputNumber,
  notification,
  Select,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { categoryOptions } from "../constants";
import { useFloodDamageDetail, useUpdateFloodDamage } from "../hooks";
import type { IUpdateFloodDamageRequest } from "../interfaces";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function FormFloodDamages() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);

  const { data: floodDamageDetail } = useFloodDamageDetail(
    id ? Number(id) : undefined,
  );

  useEffect(() => {
    if (floodDamageDetail?.data && id) {
      form.setFieldsValue({
        ...floodDamageDetail.data,
        estimatedValue: normalizeCurrency(
          floodDamageDetail?.data?.estimatedValue,
          "VND",
        ),
      });
    } else {
      form.resetFields();
    }
  }, [floodDamageDetail, id, form]);

  const updateFloodDamage = useUpdateFloodDamage();
  const handleSubmit = async (values: IUpdateFloodDamageRequest) => {
    setIsLoading(true);

    try {
      const data = {
        ...values,
        injuredCount: Number(values.injuredCount) || 0,
        deathCount: Number(values.deathCount) || 0,
        // Parse đúng định dạng tiền VND: loại bỏ dấu chấm phân cách hàng nghìn
        estimatedValue: parseCurrency(
          String(values.estimatedValue ?? "0"),
          "VND",
        ),
      };
      const response = await updateFloodDamage.mutateAsync({
        id: Number(id),
        data: data,
      });
      if (response?.statusCode === 200) {
        notification.success({
          title: "Thành công",
          description: response.message,
        });
        navigate("/app/flood-damages-manager/list");
      }
    } catch (error: unknown) {
      const err = error as { message?: string } | undefined;
      notification.error({
        title: "Lỗi",
        description: err?.message || "Có lỗi xảy ra",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl w-full! p-4 shadow">
      <Title level={4}>Cập nhật thiệt hại</Title>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Form.Item
            name="id"
            label={
              <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                Mã thiệt hại
                <span className="text-[#D32F2F] ml-1">*</span>
              </p>
            }
            required={false}
            rules={[
              { required: true, message: "Vui lòng chọn loại thiệt hại" },
            ]}
          >
            <Input disabled className="h-9! w-full" />
          </Form.Item>
          <Form.Item
            name="damageCategory"
            validateTrigger={["onChange", "onBlur"]}
            label={
              <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                Loại thiệt hại
                <span className="text-[#D32F2F] ml-1">*</span>
              </p>
            }
            required={false}
            rules={[
              { required: true, message: "Vui lòng chọn loại thiệt hại" },
            ]}
          >
            <Select placeholder="Chọn loại thiệt hại" className="h-9! w-full">
              {categoryOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="estimatedValue"
            validateTrigger={["onChange", "onBlur"]}
            required={false}
            label={
              <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                Giá trị ước tính (VND)
                <span className="text-[#D32F2F] ml-1">*</span>
              </p>
            }
            rules={[{ required: true, message: "Vui lòng nhập giá trị" }]}
            normalize={(val) => normalizeCurrency(val, "VND")}
          >
            <Input className="w-full h-9!" placeholder="Nhập số tiền" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Form.Item
            name="injuredCount"
            label={
              <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                Số người bị thương
              </p>
            }
            tooltip="Nhập 0 nếu không có"
            normalize={(val) => formatNumber(val)}
          >
            <Input className="w-full h-9!" placeholder="0" />
          </Form.Item>

          <Form.Item
            name="deathCount"
            label={
              <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                Số người tử vong
              </p>
            }
            tooltip="Nhập 0 nếu không có"
            normalize={(val) => formatNumber(val)}
          >
            <Input className="w-full h-9!" placeholder="0" />
          </Form.Item>
        </div>

        <Form.Item
          name="description"
          validateTrigger={["onChange", "onBlur"]}
          required={false}
          label={
            <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
              Mô tả chi tiết
              <span className="text-[#D32F2F] ml-1">*</span>
            </p>
          }
          rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
        >
          <TextArea
            rows={4}
            placeholder="Mô tả chi tiết về thiệt hại..."
            maxLength={5000}
            showCount
          />
        </Form.Item>

        {id && (
          <Form.Item name="id" hidden>
            <InputNumber />
          </Form.Item>
        )}

        <Form.Item hidden name="reflectionId">
          <InputNumber />
        </Form.Item>

        <div className="flex justify-end gap-1">
          <Button
            onClick={() => navigate("/app/flood-damages-manager/list")}
            size="large"
            className="h-8!"
          >
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            size="large"
            className="h-8!"
          >
            Cập nhật
          </Button>
        </div>
      </Form>
    </div>
  );
}
