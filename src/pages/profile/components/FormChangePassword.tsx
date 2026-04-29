import { Button, Form, Input, notification } from "antd";
import { HttpStatusCode } from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { changePassword } from "../api";
import type { ChangePasswordRequest } from "../interfaces";

type PropType = {
  onCancel: () => void;
};

export default function FormChangePassword({ onCancel }: PropType) {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [checkPhoneNumber, setCheckPhoneNumber] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const handleLogin = async (values: ChangePasswordRequest) => {
    setIsLoading(true);
    try {
      const data = {
        // phoneNumber,
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      };
      console.log("data", data);
      const response = await changePassword(data);
      if (
        response?.statusCode === 200 ||
        response?.statusCode === HttpStatusCode.Ok
      ) {
        notification.success({
          title: "Thành công",
          description: response?.message || "Đổi mật khẩu thành công",
        });
        onCancel();
      }
    } catch (error: any) {
      const messageError =
        error.response.data?.message ||
        error.response.data?.error ||
        "Lỗi từ server";

      notification.error({
        title: "Thất bại",
        description: messageError,
      });
      setIsLoading(false);
      setCheckPhoneNumber(false);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Form
      layout="vertical"
      initialValues={{ remember: true }}
      onFinish={handleLogin}
      requiredMark="optional"
      form={form}
    >
      <div className="mb-2">
        {" "}
        {checkPhoneNumber ? (
          <>
            <Form.Item<ChangePasswordRequest>
              name="oldPassword"
              label={
                <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                  Mật khẩu cũ<span className="text-[#D32F2F] ml-1">*</span>
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
                        if (!passwordRegex.test(value) || value.length < 8) {
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
            <Form.Item<ChangePasswordRequest>
              name="newPassword"
              label={
                <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                  Mật khẩu mới<span className="text-[#D32F2F] ml-1">*</span>
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
                        reject(new Error("Vui lòng nhập mật khẩu mới"));
                      } else {
                        if (!passwordRegex.test(value) || value.length < 8) {
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
                placeholder="Nhập mật khẩu mới"
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
            <Form.Item className="">
              <Button
                loading={isLoading}
                htmlType="submit"
                className="font-bold xl:text-[18px]! text-[16px]! h-11! w-full rounded-[10px] text-[#FFFFFF] bg-(--color-primary)"
                type="primary"
              >
                Xác nhận
              </Button>
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item
              name="phoneNumber"
              label={
                <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
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
                      const phoneRegex = /^(0[3|5|7|8|9])([0-9]{8})$/;
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
                onChange={(e) => setPhoneNumber(e.target.value)}
                value={phoneNumber}
              />
            </Form.Item>
            <Form.Item className="">
              <Button
                loading={isLoading}
                onClick={() => setCheckPhoneNumber(!checkPhoneNumber)}
                htmlType="button"
                className="font-bold xl:text-[18px]! text-[16px]! h-11! w-full rounded-[10px] text-[#FFFFFF] bg-(--color-primary)"
                type="primary"
              >
                Xác nhận
              </Button>
            </Form.Item>
          </>
        )}
      </div>
    </Form>
  );
}
