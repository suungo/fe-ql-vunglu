import { getDeviceInfo, getOrCreateDeviceId } from "@/utils/device";
import { setupWebPushNotifications } from "@/utils/pushNotification";
import { Button, Form, Input, Modal, notification } from "antd";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginApi } from "../apis";
import type { LoginRequest } from "../interfaces";
import ReCAPTCHA from "react-google-recaptcha";

export default function Login() {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"resident" | "staff" | null>(
    null,
  );
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // States phục vụ xác thực mã cán bộ
  const [isVerifyModalVisible, setIsVerifyModalVisible] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");

  // reCAPTCHA state & ref
  const recaptchaRef = useRef<any>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
      setIsRoleModalVisible(true);
    }, 1000); // Giả lập quá trình tải trang trong 1 giây
    return () => clearTimeout(timer);
  }, []);

  // Hàm xử lý khi cán bộ xác thực mã
  const handleVerifyStaff = () => {
    if (verifyCode === "1234") {
      setSelectedRole("staff");
      localStorage.setItem("selectedRole", "staff");
      setIsVerifyModalVisible(false);
      setVerifyCode("");
      setVerifyError("");
      notification.success({
        message: "Xác thực thành công",
        description: "Chào mừng Cán bộ truy cập hệ thống.",
      });
    } else {
      setVerifyError("Mã xác thực không chính xác. Vui lòng thử lại!");
    }
  };

  // Hàm xử lý đăng nhập
  const handleLogin = async (values: LoginRequest) => {
    if (selectedRole === "resident" && !recaptchaToken) {
      notification.error({
        message: "Yêu cầu xác thực",
        description: "Vui lòng tick chọn hộp xác nhận reCAPTCHA để tiếp tục.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // 🔥 Lấy hoặc tạo deviceId
      const deviceId = getOrCreateDeviceId();
      const { deviceName, deviceType } = getDeviceInfo();

      // Thêm deviceId vào request. Đối với người dân thì bỏ qua mật khẩu.
      const loginData: LoginRequest = {
        ...values,
        password: selectedRole === "resident" ? "" : values.password,
        deviceId,
        deviceName,
        deviceType,
      };

      const response = await loginApi(loginData);
      if (response?.statusCode === 200) {
        localStorage.setItem("accessToken", response?.data?.accessToken || "");
        localStorage.setItem("user", JSON.stringify(response?.data?.user));

        // 🔥 Lưu deviceId từ server (nếu có)
        if (response?.data?.deviceId) {
          localStorage.setItem("deviceId", response.data.deviceId);
        }

        // 🔥 Đăng ký Web Push Notifications
        setupWebPushNotifications(deviceId).catch((err) => {
          console.error("❌ Lỗi cấu hình Web Push Notifications:", err);
        });

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
        if (selectedRole === "resident") {
          setRecaptchaToken(null);
          recaptchaRef.current?.reset();
        }
      }
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
      if (selectedRole === "resident") {
        setRecaptchaToken(null);
        recaptchaRef.current?.reset();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-[#0b2340] via-[#0f345f] to-[#1a5d9f]">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/10 blur-2xl" />
        </div>

        {/* Logo + Spinner + Text */}
        <div className="relative flex flex-col items-center gap-10">
          {/* Spinner + Logo group */}
          <div className="relative flex items-center justify-center">
            {/* Outer slow spinner ring */}
            <div
              className="absolute h-64 w-64 rounded-full sm:h-72 sm:w-72"
              style={{ animation: "spin-slow 4s linear infinite" }}
            >
              <div className="h-full w-full rounded-full border-2 border-transparent border-t-cyan-400/70 border-r-cyan-400/30" />
            </div>

            {/* Middle medium spinner ring */}
            <div
              className="absolute h-52 w-52 rounded-full sm:h-60 sm:w-60"
              style={{ animation: "spin-slow 2.5s linear infinite reverse" }}
            >
              <div className="h-full w-full rounded-full border-2 border-transparent border-t-blue-400/60 border-l-blue-400/20" />
            </div>

            {/* Inner fast spinner ring */}
            <div
              className="absolute h-40 w-40 rounded-full sm:h-48 sm:w-48"
              style={{ animation: "spin-slow 1.5s linear infinite" }}
            >
              <div className="h-full w-full rounded-full border border-transparent border-t-sky-300/80" />
            </div>

            {/* Pulse glow ring */}
            <div
              className="absolute h-56 w-56 rounded-full bg-cyan-400/5 sm:h-64 sm:w-64"
              style={{ animation: "pulse-glow 2s ease-in-out infinite" }}
            />

            {/* Logo image */}
            <div
              className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full overflow-hidden ring-2 ring-cyan-400/30 sm:h-36 sm:w-36"
              style={{
                background: "linear-gradient(180deg,#0e2d4d 0%,#113c6b 100%)",
              }}
            >
              <img
                src="/image-logo.png"
                alt="logo"
                className="w-[110%] h-[110%] max-w-[110%] object-cover shrink-0 transition-transform duration-300 hover:scale-105"
              />
            </div>
          </div>

          {/* Loading text */}
          <p
            className="text-sm font-medium tracking-widest text-cyan-200/80 sm:text-base animate-pulse"
            style={{ animation: "blink-text 1.6s ease-in-out infinite" }}
          >
            ĐANG TẢI HỆ THỐNG QUẢN LÝ LŨ LỤT...
          </p>
        </div>

        {/* CSS animations */}
        <style>{`
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50%       { opacity: 0.9; transform: scale(1.08); }
          }
          @keyframes blink-text {
            0%, 100% { opacity: 0.4; }
            50%       { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div className="w-full min-h-screen bg-[url('/image-auth.png')] bg-no-repeat bg-left bg-cover relative overflow-y-auto">
        <div className="z-10 flex items-center justify-center min-h-screen p-4 py-8">
          <div className="z-50 p-6 bg-white rounded-[20px] shadow-sm lg:w-[655px] md:w-[555px] w-[335px] transition-all duration-100 ease-in-out">
            <div className="relative flex justify-center mb-2 gap-1">
              {/* Ẩn nút Khẩn cấp nếu là Người dân */}
              {selectedRole === "staff" && (
                <Link
                  to="/messages-realtime"
                  className="absolute right-0 top-1 inline-flex items-center gap-1.5 rounded-[8px] bg-[#e53935] px-2 py-1.5 text-[10px] font-extrabold tracking-wide text-white shadow-md transition hover:bg-[#d32f2f] focus:outline-none focus:ring-2 focus:ring-[#e53935]/40 sm:gap-2 sm:px-3 sm:py-2 sm:text-[12px]"
                  aria-label="Khẩn cấp - xem cảnh báo"
                  title="Khẩn cấp"
                >
                  <AlertTriangle className="shrink-0" size={16} />
                  KHẨN CẤP
                </Link>
              )}
              <div className="lg:w-[180px] lg:h-[180px] w-[120px] h-[120px] rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100/50">
                <img
                  loading="lazy"
                  alt="Image Auth"
                  className="w-[105%] h-[105%] max-w-[105%] object-cover"
                  src="/image-logo.png"
                />
              </div>
            </div>
            <h3 className="lg:text-[30px] text-[24px] mb-1 text-center font-semibold text-[#144c65]">
              {selectedRole === "staff"
                ? "Đăng nhập dành cho Cán bộ"
                : "Đăng nhập dành cho Người dân"}
            </h3>
            {selectedRole && (
              <p className="text-center text-[14px] text-gray-500 mb-4">
                Vai trò truy cập:{" "}
                <span className="font-semibold text-[#00B4DB]">
                  {selectedRole === "staff" ? "Cán bộ / Nhân sự" : "Người dân"}
                </span>{" "}
                <span
                  onClick={() => setIsRoleModalVisible(true)}
                  className="text-[#D32F2F] cursor-pointer hover:underline font-medium ml-1"
                >
                  (Thay đổi)
                </span>
              </p>
            )}
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

                {/* Chỉ hiển thị Mật khẩu nếu chọn vai trò Cán bộ */}
                {selectedRole === "staff" && (
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
                )}
              </div>

              {selectedRole === "staff" && (
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
              )}

              {selectedRole === "resident" && (
                <div className="flex justify-center mb-4">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={
                      import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
                      "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                    }
                    onChange={(token: string | null) =>
                      setRecaptchaToken(token)
                    }
                  />
                </div>
              )}

              <Form.Item className="mt-2">
                <Button
                  loading={isLoading}
                  htmlType="submit"
                  className="font-bold xl:text-[18px]! text-[16px]! h-11! w-full rounded-[10px] text-[#FFFFFF] bg-(--color-primary)"
                  type="primary"
                >
                  Đăng nhập
                </Button>
              </Form.Item>

              {/* Ẩn Đăng ký tài khoản nếu là Người dân */}
              {selectedRole === "staff" && (
                <Form.Item
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
                </Form.Item>
              )}
              {selectedRole === "staff" && (
                <p className="text-[#000000] text-[14px] text-center mt-2">
                  Trường hợp khẩn cấp vui lòng nhấp vào nút{" "}
                  <span className="text-[#D32F2F]">khẩn cấp</span> ở trên để
                  được giúp đỡ trực tiếp
                </p>
              )}
            </Form>
          </div>
        </div>
      </div>

      {/* Modal lựa chọn vai trò */}
      <Modal
        title={
          <div className="text-center font-bold text-[20px] text-[#144c65] border-b border-gray-100 pb-3">
            XÁC THỰC VAI TRÒ
          </div>
        }
        open={isRoleModalVisible}
        closable={false}
        footer={null}
        centered
        maskClosable={false}
        width={420}
      >
        <div className="py-5 text-center">
          <p className="text-[15px] text-gray-500 mb-6 leading-relaxed">
            Bạn đang truy cập vào hệ thống với vai trò nào?
          </p>
          <div className="flex justify-center gap-4">
            <Button
              type="primary"
              size="large"
              className="bg-[#00B4DB] hover:bg-[#00B4DB]/80 font-bold w-36 h-12 rounded-[10px] text-[16px]"
              onClick={() => {
                setSelectedRole("resident");
                localStorage.setItem("selectedRole", "resident");
                setIsRoleModalVisible(false);
                setRecaptchaToken(null);
                recaptchaRef.current?.reset();
              }}
            >
              Người dân
            </Button>
            <Button
              type="default"
              size="large"
              className="border-[#144c65] text-[#144c65] hover:bg-gray-50 font-bold w-36 h-12 rounded-[10px] text-[16px]"
              onClick={() => {
                setIsRoleModalVisible(false);
                setIsVerifyModalVisible(true);
                setRecaptchaToken(null);
                recaptchaRef.current?.reset();
              }}
            >
              Cán bộ
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal nhập mã xác thực dành cho Cán bộ */}
      <Modal
        title={
          <div className="text-center font-bold text-[20px] text-[#144c65] border-b border-gray-100 pb-3">
            XÁC THỰC CÁN BỘ
          </div>
        }
        open={isVerifyModalVisible}
        closable={false}
        footer={null}
        centered
        maskClosable={false}
        width={400}
      >
        <div className="py-5 text-center">
          <p className="text-[15px] text-gray-500 mb-4 leading-relaxed">
            Vui lòng nhập mã xác thực dành cho Cán bộ hệ thống:
          </p>
          <div className="mb-4">
            <Input.Password
              maxLength={4}
              placeholder="Nhập mã 4 số"
              value={verifyCode}
              onChange={(e) => {
                setVerifyCode(e.target.value);
                setVerifyError("");
              }}
              className="bg-[#F5F5F5] rounded-[10px] h-11 text-center font-bold text-[18px] tracking-[4px]"
            />
            {verifyError && (
              <p className="text-[#D32F2F] text-[13px] mt-2 font-medium">
                {verifyError}
              </p>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-6">
            <Button
              type="default"
              size="large"
              className="border-gray-300 text-gray-500 hover:bg-gray-50 font-bold w-28 h-11 rounded-[10px] text-[14px]"
              onClick={() => {
                setIsVerifyModalVisible(false);
                setIsRoleModalVisible(true);
                setVerifyCode("");
                setVerifyError("");
              }}
            >
              Quay lại
            </Button>
            <Button
              type="primary"
              size="large"
              className="bg-[#144c65] hover:bg-[#144c65]/80 font-bold w-28 h-11 rounded-[10px] text-[14px]"
              onClick={handleVerifyStaff}
            >
              Xác thực
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
