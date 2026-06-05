import { formRules } from "@/components/constants";
import { getDeviceInfo, getOrCreateDeviceId } from "@/utils/device";
import { Button, Form, Input, Select, notification } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerWithVerificationApi } from "../apis";
import type { RegisterRequest } from "../interfaces";

const { Option } = Select;

export default function Login() {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [provinces, setProvinces] = useState<{ code: number; name: string }[]>(
    [],
  );
  const [wards, setWards] = useState<{ code: number; name: string }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Gọi API lấy danh sách Tỉnh/Thành phố
    axios.get("https://provinces.open-api.vn/api/p/").then((res) => {
      setProvinces(res.data);
    });
  }, []);

  const handleProvinceChange = (provinceName: string) => {
    form.setFieldsValue({ wards: undefined });
    setWards([]);
    if (!provinceName) return;

    // Tìm code của Tỉnh/Thành phố được chọn
    const selectedProvince = provinces.find((p) => p.name === provinceName);
    if (!selectedProvince) return;

    // Gọi API lấy Quận/Huyện và Xã/Phường của Tỉnh đó (depth=3)
    axios
      .get(
        `https://provinces.open-api.vn/api/p/${selectedProvince.code}?depth=3`,
      )
      .then((res) => {
        // Gộp tất cả Phường/Xã của các Quận/Huyện lại và kèm tên Quận/Huyện
        const allWards = res.data.districts.flatMap((d: any) =>
          d.wards.map((w: any) => ({
            code: w.code,
            name: `${w.name}`, // Vd: Phường 1 - Quận 3
          })),
        );
        setWards(allWards);
      })
      .catch(console.error);
  };
  // Hàm xử lý đăng ký
  const handleRegister = async (values: RegisterRequest) => {
    setIsLoading(true);
    try {
      // 🔥 Lấy hoặc tạo deviceId
      const deviceId = getOrCreateDeviceId();
      const { deviceName, deviceType } = getDeviceInfo();

      await registerWithVerificationApi(values);

      notification.success({
        message: "Đăng ký thành công",
        description: "Hệ thống đã ghi nhận thông tin xác thực cư dân của bạn.",
      });

      navigate("/login");
    } catch (error: unknown) {
      const errorMsg =
        (
          error as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (error as { message?: string })?.message ||
        "Lỗi kết nối đến máy chủ";
      notification.error({
        message: "Thất bại",
        description: Array.isArray(errorMsg) ? errorMsg[0] : errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <div className="w-full h-screen bg-[url('/image-auth.png')] bg-no-repeat  bg-left bg-cover relative overflow-hidden">
        <div className="z-10 flex items-center justify-center min-h-screen p-4">
          <div className="z-50 p-6 bg-white rounded-[20px] shadow-sm lg:w-[655px] md:w-[555px] w-[335px] transition-all duration-100 ease-in-out">
            <div className="relative flex justify-center mb-2 gap-1">
              <div className="lg:w-[180px] lg:h-[180px] w-[120px] h-[120px] rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100/50">
                <img
                  loading="lazy"
                  alt="Image Auth"
                  className="w-[105%] h-[105%] max-w-[105%] object-cover"
                  src="/image-logo.png"
                />
              </div>
            </div>
            <h3 className="lg:text-[30px] text-[24px] mb-2 text-center font-semibold text-[#144c65]">
              Đăng ký tài khoản
            </h3>
            <Form
              layout="vertical"
              initialValues={{ remember: true }}
              onFinish={handleRegister}
              scrollToFirstError
              form={form}
            >
              <div className="mb-2 lg:h-full h-[300px] overflow-y-auto hide-scrollbar">
                <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
                  <Form.Item<RegisterRequest>
                    required={false}
                    name="fullName"
                    label={
                      <p className="lg:text-[16px] md:text-[15px] text-[14px] text-[#464646] font-medium">
                        Họ và tên
                        <span className="text-[#D32F2F] ml-[4px]">*</span>
                      </p>
                    }
                    rules={[
                      {
                        required: true,

                        validator: (_, value) => {
                          return new Promise((resolve, reject) => {
                            const characterFormat = /^[\p{L}\s.,!?]+$/u;
                            const phoneRegex = /^[0-9]/; // Loại bỏ khoảng trăng ở đầu và cuối
                            const spaceValue = (value || "").trim();
                            if (!spaceValue) {
                              reject(
                                new Error("Vui lòng nhập họ và tên của bạn"),
                              );
                            } else if (phoneRegex.test(value)) {
                              reject(
                                new Error(
                                  "Trường này không được nhập kí tự đặc biệt",
                                ),
                              );
                            } else {
                              if (
                                spaceValue.length < 2 ||
                                spaceValue.length > 50
                              ) {
                                reject(
                                  new Error(
                                    "Họ và tên phải có ít nhất 2 đến 50 kí tự",
                                  ),
                                );
                              } else {
                                if (!characterFormat.test(value)) {
                                  reject(
                                    new Error("Họ và tên không đúng định dạng"),
                                  );
                                } else {
                                  resolve("");
                                }
                              }
                            }
                          });
                        },
                      },
                    ]}
                    validateTrigger={["onBlur", "onChange"]}
                  >
                    <Input
                      placeholder="Nhập họ và tên của bạn"
                      autoComplete="fullName"
                      className="h-9! bg-[#F5F5F5] rounded-[10px]"
                      allowClear
                      autoFocus
                      maxLength={50}
                    />
                  </Form.Item>
                  <Form.Item<RegisterRequest>
                    name="phoneNumber"
                    required={false}
                    label={
                      <p className="text-[16px] text-[#464646] font-medium">
                        Số điện thoại
                        <span className="text-[#D32F2F] ml-1">*</span>
                      </p>
                    }
                    validateTrigger={["onBlur", "onChange"]}
                    rules={[
                      {
                        required: true,

                        validator: (_, value) => {
                          return new Promise((resolve, reject) => {
                            const phoneRegex =
                              /^(0[1|3|5|7|8|9])([0-9]{8}|[0-9]{9})$/;
                            if (!value) {
                              reject(new Error("Vui lòng nhập số điện thoại"));
                            } else {
                              if (!phoneRegex.test(value)) {
                                return reject(
                                  new Error(
                                    "Số điện thoại không đúng định dạng",
                                  ),
                                );
                              }
                              return resolve("");
                            }
                          });
                        },
                      },
                    ]}
                  >
                    <Input
                      placeholder="Nhập số điện thoại"
                      className="bg-[#F5F5F5] rounded-[10px] h-9! flex justify-center"
                      allowClear
                    />
                  </Form.Item>
                </div>
                <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
                  <Form.Item<RegisterRequest>
                    name="province"
                    required={false}
                    label={
                      <p className="text-[16px] text-[#464646] font-medium">
                        Tỉnh/Thành phố
                        <span className="text-[#D32F2F] ml-1">*</span>
                      </p>
                    }
                    validateTrigger={["onBlur", "onChange"]}
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn Tỉnh/Thành phố",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Chọn Tỉnh/Thành phố"
                      className="bg-[#F5F5F5] rounded-[10px] h-9! flex justify-center"
                      allowClear
                      onChange={handleProvinceChange}
                    >
                      {provinces.map((province) => (
                        <Option key={province.code} value={province.name}>
                          {province.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item<RegisterRequest>
                    name="wards"
                    required={false}
                    label={
                      <p className="text-[16px] text-[#464646] font-medium">
                        Xã/Phường
                        <span className="text-[#D32F2F] ml-1">*</span>
                      </p>
                    }
                    validateTrigger={["onBlur", "onChange"]}
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn Xã/Phường",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Chọn Xã/Phường"
                      className="bg-[#F5F5F5] rounded-[10px] h-9! flex justify-center"
                      allowClear
                      disabled={!wards.length}
                    >
                      {wards.map((ward) => (
                        <Option key={ward.code} value={ward.name}>
                          {ward.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>

                <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
                  <Form.Item<RegisterRequest>
                    name="email"
                    required={false}
                    className="lg:[&_.ant-form-item-explain-error]:w-[491px] md:[&_.ant-form-item-explain-error]:w-[400px] [&_.ant-form-item-explain-error]:w-[315px]"
                    label={
                      <p className="lg:text-[16px] md:text-[15px] text-[14px] text-[#464646] font-medium">
                        Email
                        <span className="text-[#D32F2F] ml-[4px]">*</span>
                      </p>
                    }
                    rules={[
                      {
                        required: true,
                        validator: (_, value) =>
                          new Promise((resolve, reject) => {
                            if (!value) {
                              reject(new Error("Vui lòng nhập email"));
                            } else {
                              const DoudleDoRegex = /\.{2,}/;
                              if (
                                !value.includes("@") ||
                                DoudleDoRegex.test(value)
                              ) {
                                reject(
                                  new Error(
                                    "Email không hợp lệ. Vui lòng kiểm tra lại",
                                  ),
                                );
                              } else {
                                resolve("");
                              }
                            }
                          }),
                      },
                    ]}
                    validateTrigger={["onBlur", "onChange"]}
                  >
                    <Input
                      placeholder="Nhập email"
                      autoComplete="email"
                      className="h-9! bg-[#F5F5F5] rounded-[10px]"
                      maxLength={200}
                      allowClear
                    />
                  </Form.Item>
                  <Form.Item<RegisterRequest>
                    rules={formRules.address()}
                    name="address"
                    required={false}
                    label={
                      <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                        Địa chỉ chi tiết
                        <span className="text-[#D32F2F] ml-1">*</span>
                      </p>
                    }
                    validateTrigger={["onBlur", "onChange"]}
                  >
                    <Input className="w-full h-9!" placeholder="Nhập địa chỉ" />
                  </Form.Item>
                </div>
              </div>

              <Form.Item className="">
                <Button
                  loading={isLoading}
                  htmlType="submit"
                  className="font-bold xl:text-[18px]! text-[16px]! h-9! w-full rounded-[10px] text-[#FFFFFF] bg-(--color-primary)"
                  type="primary"
                >
                  Đăng ký
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}
