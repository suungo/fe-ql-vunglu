import { getDeviceInfo, getOrCreateDeviceId } from "@/utils/device";
import { Button, Form, Input, notification } from "antd";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginApi } from "../apis";
import type { LoginRequest } from "../interfaces";

export default function Login() {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  // Hàm xử lý đăng nhập
  const handleLogin = async (values: LoginRequest) => {
    setIsLoading(true);
    try {
      // 🔥 Lấy hoặc tạo deviceId
      const deviceId = getOrCreateDeviceId();
      const { deviceName, deviceType } = getDeviceInfo();

      // Thêm deviceId vào request
      const loginData: LoginRequest = {
        ...values,
        deviceId,
        deviceName,
        deviceType,
      };

      const response = await loginApi(loginData);
      if (response?.statusCode === 200) {
        localStorage.setItem("accessToken", response?.data?.accessToken);
        localStorage.setItem("user", JSON.stringify(response?.data?.user));

        // 🔥 Lưu deviceId từ server (nếu có)
        if (response?.data?.deviceId) {
          localStorage.setItem("deviceId", response.data.deviceId);
        }

        notification.success({
          message: "Thành công",
          description: response?.message,
        });
        navigate("/app/dashboard");
      } else {
        notification.error({
          message: "Thất bại",
          description: response?.message,
        });
      }
    } catch (error: unknown) {
      const errorMsg =
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
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
            <div className="relative flex justify-center mb-2 bg-[#FAFAFA]! gap-1">
              <Link
                to="/messages-realtime"
                className="absolute right-0 top-1 inline-flex items-center gap-1.5 rounded-[8px] bg-[#e53935] px-2 py-1.5 text-[10px] font-extrabold tracking-wide text-white shadow-md transition hover:bg-[#d32f2f] focus:outline-none focus:ring-2 focus:ring-[#e53935]/40 sm:gap-2 sm:px-3 sm:py-2 sm:text-[12px]"
                aria-label="Khẩn cấp - xem cảnh báo"
                title="Khẩn cấp"
              >
                <AlertTriangle className="shrink-0" size={16} />
                KHẨN CẤP
              </Link>
              <img
                loading="lazy"
                alt="Image Auth"
                className="lg:w-[217px] lg:h-[139px] md:w-[143px] md:h-[90px] w-[101px] rounded-[10px] h-[70px] mix-blend-multiply"
                src="/image-logo.png"
              />
            </div>
            <h3 className="lg:text-[30px] text-[24px] mb-2 text-center font-semibold text-[#144c65]">
              Đăng nhập tài khoản của bạn
            </h3>
            <Form
              layout="vertical"
              initialValues={{ remember: true }}
              onFinish={handleLogin}
              requiredMark="optional"
              form={form}
            >
              <div className="mb-2">
                <Form.Item<LoginRequest>
                  name="phoneNumber"
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
                                new Error("Số điện thoại không đúng định dạng"),
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
                    className="bg-[#F5F5F5] rounded-[10px] h-11 flex justify-center"
                    allowClear
                    autoFocus
                  />
                </Form.Item>
                <Form.Item<LoginRequest>
                  name="password"
                  label={
                    <p className="text-[16px] text-[#464646] font-medium">
                      Mật Khẩu<span className="text-[#D32F2F] ml-1">*</span>
                    </p>
                  }
                  validateTrigger={["onBlur", "onChange"]}
                  rules={[
                    {
                      required: true,
                      validator: (_, value) => {
                        return new Promise((resolve, reject) => {
                          const passwordRegex =
                            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
                          if (!value) {
                            reject(new Error("Vui lòng nhập mật khẩu"));
                          } else {
                            if (
                              !passwordRegex.test(value) ||
                              value.length < 8
                            ) {
                              return reject(
                                new Error(
                                  "Mật khẩu tối thiểu 8 ký tự bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
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
                  <Input.Password
                    placeholder="Nhập mật khẩu"
                    autoComplete="password"
                    className="bg-[#F5F5F5] rounded-[10px] h-11"
                    iconRender={(version) =>
                      version ? (
                        <Eye
                          size={24}
                          style={{
                            color: "#989898",
                            cursor: "pointer",
                          }}
                        />
                      ) : (
                        <EyeOff
                          size={24}
                          style={{
                            color: "#989898",
                            cursor: "pointer",
                          }}
                        />
                      )
                    }
                    allowClear
                  />
                </Form.Item>
              </div>
              <div className="flex justify-end items-center">
                <Form.Item>
                  <Link
                    className="text-[#D32F2F] hover:text-[#D32F2F]/60 transition-all hober text-[14px]"
                    to="/reset"
                  >
                    Quên mật khẩu?
                  </Link>
                </Form.Item>
              </div>
              <Form.Item className="">
                <Button
                  loading={isLoading}
                  htmlType="submit"
                  className="font-bold xl:text-[18px]! text-[16px]! h-11! w-full rounded-[10px] text-[#FFFFFF] bg-(--color-primary)"
                  type="primary"
                >
                  Đăng nhập
                </Button>
              </Form.Item>

              {/* <Form.Item
                className="text-center mb-0! flex items-center justify-center"
                label={null}
              >
                <span className="text-[#718096] text-[14px]">
                  Bạn chưa có tài khoản?{" "}
                  <Link
                    className="text-[#144c65] hover:text-[#144c65]/50 transition-all text-[14px]"
                    to="/register"
                  >
                    Đăng ký
                  </Link>{" "}
                  tại đây
                </span>
              </Form.Item> */}
              <p className="text-[#000000] text-[14px] text-center">
                Trường hợp khấn cấp vui lòng nhấp vào nút{" "}
                <span className="text-[#D32F2F]">khấn cấp</span> ở trên để được
                giúp đỡ trực tiếp
              </p>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}
