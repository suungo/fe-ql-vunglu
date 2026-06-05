import { Button, Form, Input, notification } from "antd";
import axios, { HttpStatusCode } from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPassword, sendPhoneNumber } from "../apis";
import type { ResetPasswordRequest } from "../interfaces";

export default function ResetPasswordPage() {
  const navigator = useNavigate();
  const [isResetPassword, setIsResetPassword] = useState(true);
  const [form] = Form.useForm<ResetPasswordRequest>();
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otpRequest, setOtpRequest] = useState<string>("");
  const [isHaveOtp, setIsHaveOtp] = useState<boolean>(false);
  const [isLoadingSendOtp, setIsLoadingSendOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [isNumber] = useState(1);

  // Hàm xử lý gửi mã OTP
  const handleSendOtp = async () => {
    setIsLoadingSendOtp(true);

    try {
      const response = await sendPhoneNumber(phoneNumber);
      notification.success({
        title: "Thành công",
        description: response?.data?.message || "Lấy mã OTP thành công",
      });

      setIsHaveOtp(true);
    } catch (error: unknown) {
      console.error("❌ Lỗi gửi OTP chi tiết:", error);

      let messageError = "Lấy mã OTP thất bại. Vui lòng thử lại sau.";

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          messageError =
            "Hết thời gian chờ. Backend không phản hồi (có thể server chưa chạy hoặc sai URL).";
        } else if (error.response) {
          // Lỗi từ NestJS (400, 500, ...)
          messageError =
            error.response.data?.message ||
            error.response.data?.error ||
            "Lỗi từ server";
        } else if (error.request) {
          messageError =
            "Không kết nối được đến server. Kiểm tra backend có đang chạy không?";
        }
      }

      notification.error({
        title: "Thất bại",
        description: messageError,
      });
    } finally {
      setIsLoadingSendOtp(false);
    }
  };
  // Hàm xử lý xác nhận mã OTP
  const handleVerifyOtp = async () => {
    setIsResetPassword(false);
    try {
      // verify OTP step
    } catch (error) {
      console.error(error);
    }
  };

  // Hàm xử lý reset password
  const handleResetPassword = async (values: ResetPasswordRequest) => {
    setIsLoading(true);

    try {
      const payload = {
        phoneNumber: phoneNumber,
        otp: otpRequest,
        newPassword: values.newPassword, // ưu tiên newPassword, fallback password
      };
      const response = await createPassword(payload);
      if (
        response?.statusCode === 200 ||
        response?.statusCode === HttpStatusCode.Ok
      ) {
        notification.success({
          title: "Thành công",
          description: response?.message,
        });
        navigator("/login");
      } else if (response?.statusCode === 400) {
        notification.error({
          title: "Thất bại",
          description: response?.message,
        });
        setIsLoading(false);
        setIsResetPassword(true);
        setIsHaveOtp(false);
      }
    } catch (error: unknown) {
      const messageError =
        (
          error as {
            response?: { data?: { message?: string; error?: string } };
          }
        )?.response?.data?.message ||
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        "Lỗi từ server";
      notification.error({
        title: "Thất bại",
        description: messageError || "Đổi mật khẩu không thành công",
      });
      setIsLoading(false);
      setIsResetPassword(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="h-screen w-full bg-[url('/image-auth.png')] bg-no-repeat  bg-left bg-cover flex items-center justify-center">
      <div className="z-50 bg-white rounded-[20px] lg:min-w-[655px] md:w-[495px] min-w-[335px] py-5 px-5">
        <div className="flex items-center mb-6 flex-col">
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
          <h3 className="lg:text-[30px] text-[24px] mb-2 text-center font-semibold text-[#144C65]">
            {isResetPassword ? "Quên mật khẩu" : "Tạo mật khẩu mới"}
          </h3>
        </div>
        {isResetPassword ? (
          <>
            <Form
              layout="vertical"
              initialValues={{ remember: true }}
              onFinish={handleVerifyOtp}
              autoComplete="off"
              className="[&_.ant-form-item]:pl-[29px] md:[&_.ant-form-item]:pl-[8px]"
            >
              <Form.Item
                className=""
                name="phoneNumber"
                required={false}
                validateTrigger={["onBlur", "onChange"]}
                label={
                  <p className="lg:text-[16px] md:text-[15px] text-[14px] text-[#464646] font-medium">
                    Số điện thoại
                    <span className="text-[#D32F2F] ml-[4px]">*</span>
                  </p>
                }
                rules={[
                  {
                    validator: (_, value) =>
                      new Promise((resolve, reject) => {
                        const phoneRegex =
                          /^(0[1|3|5|7|8|9])([0-9]{8}|[0-9]{9})$/;

                        if (!value) {
                          reject("Vui lòng nhập số điện thoại");
                        } else {
                          if (!phoneRegex.test(value)) {
                            reject(
                              new Error("Số điện thoại không đúng định dạng"),
                            );
                          }
                          return resolve("");
                        }
                      }),
                  },
                ]}
              >
                <Input
                  placeholder="Nhập số điện thoại"
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full h-10! bg-[#F5F5F5] text-[#989898] lg:placeholder:text-[16px] md:placeholder:text-[15px] placeholder:text-[14px] rounded-[10px]"
                  allowClear
                  maxLength={12}
                />
              </Form.Item>
              <Form.Item
                name="codePassword"
                required={false}
                validateTrigger={["onBlur", "onChange"]}
                label={
                  <p className="lg:text-[16px] md:text-[15px] text-[14px] text-[#464646] font-medium">
                    Xác nhận mã OTP
                    <span className="text-[#D32F2F] ml-[4px]">*</span>
                  </p>
                }
                rules={[
                  {
                    required: true,
                    validator: (_, value) => {
                      return new Promise((resolve, reject) => {
                        if (!value) {
                          return reject(new Error("Vui lòng nhập mã OTP"));
                        } else {
                          return resolve("");
                        }
                      });
                    },
                  },
                ]}
              >
                <Input
                  maxLength={6}
                  placeholder="Nhập nhận mã OTP"
                  allowClear
                  value={otpRequest}
                  onChange={(e) => setOtpRequest(e.target.value)}
                  disabled={!isHaveOtp}
                  className="w-full rounded-[10px] h-10! bg-[#F5F5F5] text-[#989898] lg:placeholder:text-[16px] md:placeholder:text-[15px] placeholder:text-[14px]"
                  suffix={
                    phoneNumber && !isHaveOtp ? (
                      <div
                        onClick={handleSendOtp}
                        className={`${
                          phoneNumber &&
                          !isHaveOtp &&
                          /^(0[3|5|7|8|9])([0-9]{8})$/.test(phoneNumber)
                            ? "text-[#cc5002] cursor-pointer"
                            : "text-[#fa8c48] cursor-not-allowed"
                        } font-semibold`}
                      >
                        {isLoadingSendOtp ? (
                          <div className="flex items-center gap-1">
                            <span>Đang gửi</span>
                            <div className="size-4 border-2 border-[#cc5002] rounded-full border-t-transparent animate-spin"></div>
                          </div>
                        ) : isNumber === 1 ? (
                          "Gửi mã"
                        ) : (
                          "Gửi lại mã"
                        )}
                      </div>
                    ) : phoneNumber === "" ? (
                      <div className="text-[#989898] lg:text-[12px] text-[10px] cursor-not-allowed font-semibold">
                        Send OTP
                      </div>
                    ) : (
                      <div className="text-[#989898] lg:text-[12px] text-[10px] cursor-not-allowed font-semibold">
                        Gửi lại mã
                      </div>
                    )
                  }
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <Button
                  loading={isLoading}
                  disabled={!otpRequest || otpRequest.length < 6}
                  htmlType="submit"
                  className="w-full disabled:text-[#FFFFFF] rounded-[10px] h-10! lg:text-[18px]! text-[16px]! text-[#FFFFFF]"
                  type="primary"
                >
                  Xác nhận
                </Button>
              </Form.Item>
            </Form>
          </>
        ) : (
          <>
            <Form
              form={form}
              layout="vertical"
              initialValues={{ remember: true }}
              onFinish={handleResetPassword}
              onValuesChange={(_, values) => {
                if (values) {
                  setDisabled(false);
                }
              }}
              autoComplete="off"
            >
              <Form.Item<ResetPasswordRequest>
                required={false}
                name="newPassword"
                validateTrigger={["onBlur", "onChange"]}
                label={
                  <p className="lg:text-[16px] md:text-[15px] text-[14px] text-[#464646] font-medium">
                    Mật khẩu mới
                    <span className="text-[#D32F2F] ml-[4px]">*</span>
                  </p>
                }
                rules={[
                  {
                    required: true,
                    validator: (_, value) => {
                      return new Promise((resolve, reject) => {
                        const phoneRegex =
                          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])([A-Za-z\d@$!%*?&#^])+$/;

                        if (!value) {
                          reject(new Error("Vui lòng nhập mật khẩu"));
                        } else if (value && value.length < 8) {
                          reject("Độ khó mật khẩu chưa đạt yêu cầu");
                        } else {
                          if (!phoneRegex.test(value)) {
                            reject(
                              "Mật khẩu tối thiểu 8 ký tự bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
                            );
                          } else {
                            resolve("");
                          }
                        }
                      });
                    },
                  },
                ]}
              >
                <Input.Password
                  placeholder="Nhập mật khẩu mới"
                  className="w-full rounded-[10px] h-10! bg-[#F5F5F5] text-[#989898] lg:placeholder:text-[16px] md:placeholder:text-[15px] placeholder:text-[14px]"
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

              <Form.Item
                required={false}
                name="confirmPassword"
                dependencies={["newPassword"]}
                validateTrigger={["onBlur", "onChange"]}
                label={
                  <p className="lg:text-[16px] md:text-[15px] text-[14px] text-[#464646] font-medium">
                    Nhập lại mật khẩu mới
                    <span className="text-[#D32F2F] ml-[4px]">*</span>
                  </p>
                }
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập lại mật khẩu mới",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (value && value.length < 6) {
                        return Promise.reject(
                          "Độ khó mật khẩu chưa đạt yêu cầu",
                        );
                      } else if (
                        !value ||
                        getFieldValue("newPassword") === value
                      ) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Mật khẩu không khớp"));
                    },
                  }),
                ]}
              >
                <Input.Password
                  placeholder="Nhập lại mật khẩu"
                  className="w-full rounded-[10px] h-10! bg-[#F5F5F5] text-[#989898] lg:placeholder:text-[16px] md:placeholder:text-[15px] placeholder:text-[14px]"
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

              <Form.Item className="mb-0">
                <Button
                  loading={isLoading}
                  disabled={disabled}
                  htmlType="submit"
                  className="w-full rounded-[10px] h-10! lg:text-[18px]! text-[16px]! text-[#FFFFFF]"
                  type="primary"
                >
                  Xác nhận
                </Button>
              </Form.Item>
            </Form>
          </>
        )}
      </div>
    </main>
  );
}
