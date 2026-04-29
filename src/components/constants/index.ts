export const formRules = {
  // 🧑 Họ tên
  fullName: () => [
    {
      validator: (_: unknown, value: string) => {
        return new Promise((resolve, reject) => {
          const characterFormat = /^[\p{L}\s.,!?]+$/u;
          const phoneRegex = /^[0-9]/;
          const spaceValue = (value || "").trim();

          if (!spaceValue) {
            return reject(new Error("Vui lòng nhập họ và tên"));
          }

          if (phoneRegex.test(value)) {
            return reject(new Error("Không được bắt đầu bằng số"));
          }

          if (spaceValue.length < 2 || spaceValue.length > 50) {
            return reject(
              new Error("Họ tên phải từ 2 đến 50 ký tự")
            );
          }

          if (!characterFormat.test(value)) {
            return reject(new Error("Họ tên không đúng định dạng"));
          }

          resolve("");
        });
      },
    },
  ],

  // 🏷️ Mã
  code: () => [
    { required: true, message: "Vui lòng nhập mã" },
    { min: 3, message: "Tối thiểu 3 ký tự" },
    { max: 10, message: "Tối đa 10 ký tự" },
  ],

  // 📧 Email
  email: () => [
    {
      validator: (_: unknown, value: string) => {
        if (!value) {
          return Promise.reject("Vui lòng nhập email");
        }

        const emailRegex =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(value)) {
          return Promise.reject("Email không đúng định dạng");
        }

        return Promise.resolve();
      },
    },
  ],

  // 📱 SĐT
  phone: () => [
    {
      validator: (_: unknown, value: string) => {
        if (!value) {
          return Promise.reject("Vui lòng nhập số điện thoại");
        }

        const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;

        if (!phoneRegex.test(value)) {
          return Promise.reject("Số điện thoại không đúng");
        }

        return Promise.resolve();
      },
    },
  ],

  // 🏠 Địa chỉ
  address: () => [
    {
      required: true,
      message: "Vui lòng nhập địa chỉ",
    },
    // {
    //   max: 1000,
    //   message: "Tối đa 1000 ký tự",
    // },
  ],
};