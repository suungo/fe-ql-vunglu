import {
  Button,
  Form,
  Input,
  message,
  notification,
  type FormProps,
} from "antd";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerApi } from "../apis";
import type { AccountRequest } from "../interfaces";

export default function FormAccount() {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const handleRegister: FormProps<AccountRequest>["onFinish"] = async (
    values,
  ) => {
    setIsLoading(true);
    try {
      const data = {
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        email: values.email,
        password: values.password,
      };
      const response = await registerApi(data);
      if (response.statusCode === 201) {
        notification.success({
          message: "Thành công",
          description: response.message,
        });
        navigate("/app/account-manager/list");
      } else {
        notification.error({
          message: "Thất bại",
          description: response.message,
        });
      }
    } catch (error: unknown) {
      const errorMsg =
        (
          error as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        ).response?.data?.message || (error as { message?: string }).message;
      message.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <main className=" w-full">
        <div className=" bg-white p-6 rounded-lg shadow-sm">
          <h3 className="2xl:text-[22px] xl:text-[20px] text-[18px] mb-2 font-semibold text-[#000000]">
            Thêm tài khoản quản lý
          </h3>
          <Form
            layout="vertical"
            initialValues={{ remember: true }}
            onFinish={handleRegister}
            autoComplete="off"
            form={form}
          >
            <div className=" ">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Form.Item<AccountRequest>
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
                    className="h-10! bg-[#F5F5F5] rounded-[10px]"
                    allowClear
                    maxLength={50}
                  />
                </Form.Item>

                <Form.Item<AccountRequest>
                  name="phoneNumber"
                  required={false}
                  label={
                    <p className="lg:text-[16px] md:text-[15px] text-[14px] text-[#464646] font-medium">
                      Số điện thoại
                      <span className="text-[#D32F2F] ml-[4px]">*</span>
                    </p>
                  }
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
                              reject(
                                new Error("Số điện thoại không đúng định dạng"),
                              );
                            }
                            return resolve("");
                          }
                        });
                      },
                    },
                  ]}
                  validateTrigger={["onBlur", "onChange"]}
                >
                  <Input
                    placeholder="Nhập số điện thoại"
                    autoComplete="phoneNumber"
                    className="h-10! bg-[#F5F5F5] rounded-[10px]"
                    maxLength={11}
                    allowClear
                  />
                </Form.Item>
              </div>

              <Form.Item<AccountRequest>
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
                  className="h-10! bg-[#F5F5F5] rounded-[10px]"
                  maxLength={200}
                  allowClear
                />
              </Form.Item>
              <div className="grid lg:grid-cols-2 gap-4 grid-cols-1">
                <Form.Item<AccountRequest>
                  required={false}
                  name="password"
                  label={
                    <p className="lg:text-[16px] md:text-[15px] text-[14px] text-[#464646] font-medium">
                      Mật khẩu
                      <span className="text-[#D32F2F] ml-[4px]">*</span>
                    </p>
                  }
                  rules={[
                    {
                      required: true,
                      validator: (_, value) => {
                        return new Promise((resolve, reject) => {
                          if (!value) {
                            return reject(new Error("Vui lòng nhập mật khẩu"));
                          } else {
                            const passwordRegex =
                              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
                            if (
                              !passwordRegex.test(value) ||
                              value.length < 8
                            ) {
                              return reject(
                                new Error(
                                  "Mật khẩu tối thiểu 8 ký tự bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
                                ),
                              );
                            } else {
                              return resolve("");
                            }
                          }
                        });
                      },
                    },
                  ]}
                  validateTrigger={["onBlur", "onChange"]}
                >
                  <Input.Password
                    placeholder="Nhập mật khẩu"
                    autoComplete="password"
                    className="h-10! bg-[#F5F5F5] rounded-[10px]"
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
                  name={"rePassword"}
                  label={
                    <p className="lg:text-[16px] md:text-[15px] text-[14px] text-[#464646] font-medium">
                      Nhập lại mật khẩu
                      <span className="text-[#D32F2F] ml-[4px]">*</span>
                    </p>
                  }
                  dependencies={["password"]}
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập lại mật khẩu mới",
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        return new Promise((resolve, reject) => {
                          if (!value || getFieldValue("password") === value) {
                            resolve("");
                          } else {
                            reject(new Error("Mật khẩu không khớp"));
                          }
                        });
                      },
                    }),
                  ]}
                  validateTrigger={["onBlur", "onChange"]}
                >
                  <Input.Password
                    placeholder="Xác nhận lại mật khẩu"
                    autoComplete="rePassword"
                    className="h-10! bg-[#F5F5F5] rounded-[10px]"
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
            </div>

            <Form.Item>
              <div className="flex gap-2 justify-end">
                <Button
                  className="h-9! lg:text-[16px]! text-[14px]!"
                  type="default"
                  onClick={() => navigate("/app/account-manager/list")}
                >
                  Hủy
                </Button>
                <Button
                  loading={isLoading}
                  htmlType="submit"
                  className="h-9! lg:text-[16px]! text-[14px]!"
                  type="primary"
                >
                  Đăng ký
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      </main>
    </>
  );
}
