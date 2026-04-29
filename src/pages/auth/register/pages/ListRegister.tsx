import { Role } from "@/enums";
import useDebounce from "@/hooks/useDebounce";
import {
    Button,
    Dropdown,
    Empty,
    Input,
    Modal,
    notification,
    Spin,
    Table,
    Tag,
    Tooltip,
} from "antd";
import type { ColumnType } from "antd/es/table";
import { AxiosError } from "axios";
import {
    EllipsisVertical,
    Eye,
    RefreshCw,
    Search,
    Trash,
    UserPlus,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDeleteUser, useUsers } from "../hooks";
import type { User } from "../interfaces";

export default function ListRegister() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const keywordFromUrl = searchParams.get("keyword") || "";
  const [keyword, setKeyword] = useState(keywordFromUrl);
  const [page, setPage] = useState<number>(
    Number(searchParams.get("page")) || 1,
  );
  const [limit, setLimit] = useState<number>(
    Number(searchParams.get("limit")) || 10,
  );
  const [id, setId] = useState<number | null>(null);
  const [isOpenModalDelete, setIsOpenModalDelete] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);

  const debouncedKeyword = useDebounce(keyword, 500);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedKeyword.trim()) {
      params.set("keyword", debouncedKeyword.trim());
    }
    if (page > 1) params.set("page", page.toString());
    if (limit !== 10) params.set("limit", limit.toString());
    setSearchParams(params, { replace: true });
  }, [debouncedKeyword, page, limit, setSearchParams]);

  const {
    data: listUsers,
    isLoading,
    refetch,
  } = useUsers({
    keyword: debouncedKeyword,
    page,
    limit,
  });
  const listUserFilter = listUsers?.data.filter(
    (user) => user.role.roleCode !== Role.ADMIN,
  );
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
    setPage(1);
  };

  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setLimit(newPageSize);
  };

  const deleteUserMutation = useDeleteUser();
  const handleDeleteUser = async (id: number) => {
    setIsLoadingDelete(true);
    try {
      const response = await deleteUserMutation.mutateAsync(id);
      if (response?.statusCode === 200) {
        notification.success({
          message: "Thành công",
          description: response?.message,
        });
        refetch();
        setIsOpenModalDelete(false);
        setId(null);
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        notification.error({
          message: "Thất bại",
          description: error?.response?.data?.message,
        });
      }
    } finally {
      setIsLoadingDelete(false);
    }
  };

  const genderLabel: Record<string, string> = {
    MALE: "Nam",
    FEMALE: "Nữ",
    OTHER: "Khác",
  };

  const roleColor: Record<string, string> = {
    ADMIN: "red",
    MANAGER: "blue",
    LEADER: "orange",
    STAFF: "green",
    RESIDENT: "default",
  };

  const columns: ColumnType<User>[] = [
    {
      width: 80,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">STT</span>
      ),
      key: "stt",
      render: (_val: unknown, _record: User, index: number) => (
        <span className="text-[#000000] lg:text-[16px] text-[14px]">
          {(page - 1) * limit + index + 1}
        </span>
      ),
    },
    {
      width: 220,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Họ tên
        </span>
      ),
      dataIndex: "fullName",
      key: "fullName",
      render: (text: string, record: User) => (
        <div className="flex items-center gap-2">
          {record.avatar ? (
            <img
              src={record.avatar}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#144c65]/10 flex items-center justify-center text-[#144c65] text-xs font-semibold">
              {text?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
          <span className="text-[#000000] lg:text-[16px] text-[14px] font-medium">
            {text}
          </span>
        </div>
      ),
    },
    {
      width: 160,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Số điện thoại
        </span>
      ),
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      render: (text: string) => (
        <span className="text-[#000000] lg:text-[16px] text-[14px]">
          {text}
        </span>
      ),
    },
    {
      width: 250,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">Email</span>
      ),
      dataIndex: "email",
      key: "email",
      render: (text: string) => (
        <span className="text-[#000000] lg:text-[16px] text-[14px]">
          {text || "—"}
        </span>
      ),
    },
    {
      width: 120,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Giới tính
        </span>
      ),
      dataIndex: "gender",
      key: "gender",
      render: (text: string) => (
        <span className="text-[#000000] lg:text-[16px] text-[14px]">
          {genderLabel[text] || text}
        </span>
      ),
    },
    {
      width: 130,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Vai trò
        </span>
      ),
      dataIndex: "role",
      key: "role",
      render: (role: User["role"]) => (
        <Tag
          color={roleColor[role?.roleCode] || "default"}
          className="text-[14px]"
        >
          {role?.roleName || role?.roleCode}
        </Tag>
      ),
    },

    {
      width: 160,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Ngày tạo
        </span>
      ),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => (
        <span className="text-[#000000] lg:text-[16px] text-[14px]">
          {text ? new Date(text).toLocaleDateString("vi-VN") : "—"}
        </span>
      ),
    },
    {
      width: 130,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px] flex justify-center">
          Trạng thái
        </span>
      ),
      dataIndex: "status",
      key: "status",
      render: (text: string, record: User) => (
        <div className="flex gap-2 justify-end">
          <Tag
            color={
              text === "ACTIVE"
                ? "green"
                : text === "INACTIVE"
                  ? "orange"
                  : "red"
            }
            className="text-[14px]"
          >
            {text === "ACTIVE"
              ? "Đang hoạt động"
              : text === "INACTIVE"
                ? "Không hoạt động"
                : "Bị khóa"}
          </Tag>
          <span className="text-[#000000] lg:text-[16px] text-[14px]">
            <Dropdown
              menu={{
                items: [
                  {
                    key: "delete",
                    label: (
                      <span
                        onClick={() => {
                          setIsOpenModalDelete(true);
                          setId(record.id);
                        }}
                        className="text-red-500 text-[16px] cursor-pointer flex items-center gap-2"
                      >
                        {" "}
                        <Trash size={16} /> Xóa
                      </span>
                    ),
                  },
                  {
                    key: "detail",
                    label: (
                      <span
                        onClick={() =>
                          navigate(`/app/account-manager/detail/${record.id}`)
                        }
                        className="text-[#000000] text-[16px] cursor-pointer flex items-center gap-2"
                      >
                        {" "}
                        <Eye size={16} /> Chi tiết
                      </span>
                    ),
                  },
                ],
              }}
              placement="bottom"
              arrow
            >
              <EllipsisVertical size={20} className="cursor-pointer" />
            </Dropdown>
          </span>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Modal xóa */}
      <Modal
        centered
        maskClosable={false}
        closeIcon={false}
        className="xl:min-w-[500px] lg:min-w-[500px] z-100 my-10"
        title={
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] xl:text-[24px] flex items-center gap-2">
              Xóa người dùng
            </h3>
            <Tooltip placement="bottom" title="Đóng" arrow={false}>
              <div
                onClick={() => {
                  setIsOpenModalDelete(false);
                  setId(null);
                }}
                className="hover:bg-gray-200 p-2 transition-all cursor-pointer rounded-full"
              >
                <X className="text-slate-700 hover:text-slate-600" size={24} />
              </div>
            </Tooltip>
          </div>
        }
        open={isOpenModalDelete}
        footer={null}
      >
        <p className="text-[16px] mb-6">
          Bạn có chắc chắn muốn xóa người dùng này không?
        </p>
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => {
              setIsOpenModalDelete(false);
              setId(null);
            }}
            className="text-[16px] font-medium h-9!"
          >
            Hủy
          </Button>
          <Button
            onClick={() => handleDeleteUser(id!)}
            loading={isLoadingDelete}
            type="primary"
            danger
            className="text-[16px] font-medium h-9!"
          >
            Xóa
          </Button>
        </div>
      </Modal>

      <div className="space-y-4">
        <div className="rounded-2xl bg-white/80 p-4 shadow-[0_20px_80px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="2xl:text-[26px] xl:text-[22px] text-[18px] font-semibold text-[#272727]">
                Danh sách tài khoản
              </div>
            </div>
            <Button
              onClick={() => navigate("/app/account-manager/create")}
              type="primary"
              icon={<UserPlus size={18} />}
              className="text-[16px] font-medium h-9! bg-[#144c65] hover:bg-[#144c65]/90!"
            >
              Thêm tài khoản
            </Button>
          </div>

          <div className="flex items-center gap-2 justify-end mb-2">
            <Input
              value={keyword}
              onChange={handleSearch}
              className="w-[300px]! h-8!"
              prefix={<Search className="text-[#ACACAC]" size={14} />}
              placeholder="Tìm kiếm theo tên, số điện thoại..."
            />
            <Tooltip placement="bottom" title="Tải lại" arrow={false}>
              <RefreshCw
                onClick={() => refetch()}
                size={20}
                className="cursor-pointer text-[#ACACAC] hover:text-[#144c65] transition-colors"
              />
            </Tooltip>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spin size="large" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
              <Table
                loading={isLoading}
                dataSource={listUserFilter || []}
                columns={columns}
                rowKey="id"
                scroll={{ x: 1200 }}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Không có dữ liệu"
                    />
                  ),
                }}
                pagination={{
                  current: page,
                  pageSize: limit,
                  total: listUsers?.meta?.total || 0,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50", "100"],
                  onChange: handlePaginationChange,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
