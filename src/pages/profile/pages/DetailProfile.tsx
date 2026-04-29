import { Gender, Role } from "@/enums";
import { useQuery } from "@tanstack/react-query";
import { Button, Modal, Spin, Tooltip } from "antd";
import dayjs from "dayjs";
import { Edit3, KeyRound, X } from "lucide-react";
import { useState } from "react";
import { getProfileApi } from "../api";
import FormChangePassword from "../components/FormChangePassword";
import FormManagerUpdateProfile from "../components/FormManagerProfile";
import { ProfileStatus } from "../enum";

export default function DetailProfile() {
  const [isOpenModalUpdate, setIsOpenModalUpdate] = useState(false);
  const [isOpenModalChangePassword, setIsOpenModalChangePassword] =
    useState(false);
  const {
    data: profileData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await getProfileApi();
      return response?.data;
    },
  });

  const getRoleText = (role?: Role) => {
    switch (role) {
      case Role.ADMIN:
        return "Quản trị viên";
      case Role.MANAGER:
        return "Quản lý phường";
      case Role.OFFICER:
        return "Cán bộ phường (công an)";
      case Role.LEADER:
        return "Tình nguyện viên";
      case Role.STAFF:
        return "Nhân viên y tế";
      default:
        return "Cư dân";
    }
  };
  if (isLoading) return <Spin />;
  return (
    <>
      {/* Modal đổi mật khẩu */}
      <Modal
        centered
        maskClosable={false}
        closeIcon={false}
        open={isOpenModalChangePassword}
        className="lg:w-[655px] md:w-[555px] w-[335px]"
        onCancel={() => setIsOpenModalChangePassword(false)}
        footer={null}
      >
        <div className="z-50 bg-white rounded-[20px] shadow-sm  transition-all duration-100 ease-in-out">
          <Tooltip placement="bottomRight" title="Đóng" arrow={false}>
            <div
              onClick={() => setIsOpenModalChangePassword(false)}
              className="cursor-pointer flex justify-end"
            >
              <X className="text-slate-700 hover:text-slate-600" size={24} />
            </div>
          </Tooltip>
          <div className="flex justify-center mb-2 bg-[#FAFAFA]!">
            <img
              loading="lazy"
              alt="Image Auth"
              className="lg:w-[217px] lg:h-[139px] md:w-[143px] md:h-[90px] w-[101px] rounded-[10px] h-[70px] mix-blend-multiply"
              src="/image-logo.png"
            />
          </div>
          <h3 className="lg:text-[30px] text-[24px] mb-2 text-center font-semibold text-[#144c65]">
            Đổi mật khẩu
          </h3>
          <FormChangePassword
            onCancel={() => setIsOpenModalChangePassword(false)}
          />
        </div>
      </Modal>

      {/* Modal cập nhật thông tin cá nhân */}
      <Modal
        centered
        maskClosable={false}
        closeIcon={false}
        className="xl:min-w-[1108px] lg:min-w-[960px] z-100 my-10"
        title={
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] xl:text-[24px]">
              Cập nhật thông tin
            </h3>
            <Tooltip placement="bottom" title="Đóng" arrow={false}>
              <div
                onClick={() => setIsOpenModalUpdate(false)}
                className="hover:bg-gray-200 p-2 transition-all cursor-pointer rounded-full"
              >
                <X className="text-slate-700 hover:text-slate-600" size={24} />
              </div>
            </Tooltip>
          </div>
        }
        open={isOpenModalUpdate}
        footer={null}
      >
        <FormManagerUpdateProfile
          onCancel={() => setIsOpenModalUpdate(false)}
          initialValues={profileData}
          onSuccess={() => refetch()}
        />
      </Modal>

      <div className="space-y-4">
        <div className="rounded-2xl bg-white/80 p-6 shadow-[0_20px_80px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Thông tin cá nhân
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Quản lý thông tin tài khoản và cài đặt cá nhân
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="primary"
                icon={<Edit3 size={16} />}
                onClick={() => setIsOpenModalUpdate(true)}
                className="h-9! font-medium text-[16px]"
              >
                Cập nhât thông tin
              </Button>

              <Button
                type="default"
                icon={<KeyRound size={16} />}
                onClick={() => setIsOpenModalChangePassword(true)}
                className="h-9! font-medium text-[16px]"
              >
                Đổi mật khẩu
              </Button>
            </div>
          </div>

          <div>
            <ul className="flex flex-col gap-2">
              <li className="flex items-center justify-between">
                <span className="text-[16px] text-[#ACACAC]">Họ và tên</span>
                <span className="text-[16px] text-[#000000]">
                  {profileData?.fullName}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[16px] text-[#ACACAC]">
                  Số điện thoại
                </span>
                <span className="text-[16px] text-[#000000]">
                  {profileData?.phoneNumber}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[16px] text-[#ACACAC]">Email</span>
                <span className="text-[16px] text-[#000000]">
                  {profileData?.email}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[16px] text-[#ACACAC]">Giới tính</span>
                <span className="text-[16px] text-[#000000]">
                  {profileData?.gender === Gender.MALE ? "Nam" : "Nữ"}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[16px] text-[#ACACAC]">Ngày sinh</span>
                <span className="text-[16px] text-[#000000]">
                  {profileData?.dateBirth
                    ? dayjs(profileData?.dateBirth).format("DD/MM/YYYY")
                    : "Chưa cập nhật"}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[16px] text-[#ACACAC]">Địa chỉ</span>
                <span className="text-[16px] text-[#000000]">
                  {profileData?.address || "Chưa cập nhật"}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[16px] text-[#ACACAC]">Vai trò</span>
                <span className="text-[16px] text-[#000000]">
                  {getRoleText(profileData?.role?.roleCode)}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[16px] text-[#ACACAC]">Trạng thái</span>
                <span
                  className={`text-[16px] ${
                    profileData?.status === ProfileStatus.ACTIVE
                      ? "text-green-500"
                      : "text-shadow-amber-400"
                  }`}
                >
                  {profileData?.status === ProfileStatus.ACTIVE
                    ? "Đang hoạt động"
                    : "Tạm ngừng hoạt động"}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[16px] text-[#ACACAC]">Ngày tạo</span>
                <span className="text-[16px] text-[#000000]">
                  {dayjs(profileData?.createdAt).format("DD/MM/YYYY")}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
