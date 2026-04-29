import { Gender } from "@/enums";
import useDebounce from "@/hooks/useDebounce"; // giả sử hook này return [debouncedValue]
import useStyle from "@/interfaces/useStyle";
import {
  Button,
  Dropdown,
  Empty,
  Input,
  Modal,
  notification,
  Select,
  Table,
  Tooltip,
} from "antd";
import type { ColumnType } from "antd/es/table";
import { AxiosError } from "axios";
import dayjs from "dayjs";
import { EllipsisVertical, Eye, Pencil, Search, Trash, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { deteleHumanResource } from "../api";
import FormManagerHumanResources from "../components/FormManagerHumanResources";
import { HumanResourcesPosition, HumanResourcesStatus } from "../enum";
import { useHumanResources } from "../hooks";
import type { HumanResources } from "../interfaces";

export default function HumanResourcesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isOpenModalAdd, setIsOpenModalAdd] = useState(false);
  const { styles } = useStyle();
  const [statusAction, setStatus] = useState<"add" | "edit">("add");
  // Lấy keyword từ URL khi vào trang hoặc refresh
  const keywordFromUrl = searchParams.get("keyword") || "";
  const [id, setId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState(keywordFromUrl);
  const [page, setPage] = useState<number>(
    Number(searchParams.get("page")) || 1,
  );
  const [limit, setLimit] = useState<number>(
    Number(searchParams.get("limit")) || 10,
  );
  const [filterStatus, setFilterStatus] = useState<string | undefined>(
    searchParams.get("status") || undefined,
  );
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const [isOpenModalDelete, setIsOpenModalDelete] = useState(false);

  // Debounce keyword
  const debouncedKeyword = useDebounce(keyword, 500);

  // ==================== CẬP NHẬT URL KHI DEBOUNCE HOẶC PHÂN TRANG THAY ĐỔI ====================
  useEffect(() => {
    const params = new URLSearchParams();

    if (debouncedKeyword.trim()) {
      params.set("keyword", debouncedKeyword.trim());
    }
    if (page > 1) params.set("page", page.toString());
    if (limit !== 10) params.set("limit", limit.toString());
    if (filterStatus) params.set("status", filterStatus);

    setSearchParams(params, { replace: true });
  }, [debouncedKeyword, page, limit, filterStatus, setSearchParams]);

  // Gọi API (hook của bạn)
  const {
    data: ListHumanResources,
    isLoading,
    refetch,
  } = useHumanResources(
    debouncedKeyword, // dùng debouncedKeyword thay vì keyword
    limit,
    page,
    filterStatus,
  );

  // Xử lý khi người dùng gõ tìm kiếm
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
    setPage(1); // reset về trang 1 khi search
  };

  // Xử lý phân trang
  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setLimit(newPageSize);
  };

  const handleDeleteHumanResource = async (id: number) => {
    setIsLoadingDelete(true);
    try {
      const response = await deteleHumanResource(id);
      if (response?.statusCode === 200) {
        notification.success({
          title: "Thành công",
          description: response?.message,
        });
        refetch();
        setIsOpenModalDelete(false);
        setId(null);
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        notification.error({
          title: "Thất bại",
          description: error?.response?.data?.message,
        });
      }
    } finally {
      setIsLoadingDelete(false);
    }
  };

  const columns: ColumnType<HumanResources>[] = useMemo(() => {
    return [
      {
        width: 150,
        title: (
          <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
            Mã nhân sự
          </span>
        ),
        dataIndex: "employeeCode",
        key: "employeeCode",
        render: (text: string) => (
          <span className="text-[#000000] lg:text-[16px] text-[14px]">
            {text}
          </span>
        ),
      },
      {
        width: 200,
        title: (
          <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">Tên</span>
        ),
        dataIndex: "fullName",
        key: "fullName",
        render: (text: string) => (
          <span className="text-[#000000] lg:text-[16px] text-[14px]">
            {text}
          </span>
        ),
      },
      {
        width: 250,
        title: (
          <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
            Email
          </span>
        ),
        dataIndex: "email",
        key: "email",
        render: (text: string) => (
          <span className="text-[#000000] lg:text-[16px] text-[14px]">
            {text ?? "Chưa có dữ liệu"}
          </span>
        ),
      },
      {
        width: 150,
        title: (
          <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
            Số điện thoại
          </span>
        ),
        dataIndex: "phoneNumber",
        key: "phoneNumber",
        render: (text: string) => (
          <span className="text-[#000000] lg:text-[16px] text-[14px]">
            {text ?? "Chưa có dữ liệu"}
          </span>
        ),
      },
      {
        width: 250,
        title: (
          <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
            Địa chỉ
          </span>
        ),
        dataIndex: "address",
        key: "address",
        render: (text: string) => (
          <span className="text-[#000000] lg:text-[16px] text-[14px]">
            {text || "Chưa có dữ liệu"}
          </span>
        ),
      },
      {
        width: 150,
        title: (
          <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
            Ngày sinh
          </span>
        ),
        dataIndex: "dateBirth",
        key: "dateBirth",
        render: (text: string) => (
          <span className="text-[#000000] lg:text-[16px] text-[14px]">
            {dayjs(text).format("DD/MM/YYYY")}
          </span>
        ),
      },
      {
        width: 250,
        title: (
          <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
            Chức vụ
          </span>
        ),
        dataIndex: "position",
        key: "position",
        render: (text: string) => (
          <span className="text-[#000000] lg:text-[16px] text-[14px]">
            {text === HumanResourcesPosition.OFFICER
              ? "Cán bộ phường (công an cấp xã)"
              : text === HumanResourcesPosition.LEADER
                ? "Tình nguyện viên"
                : text === HumanResourcesPosition.STAFF
                  ? "Nhân viên y tế"
                  : "Cư dân"}
          </span>
        ),
      },
      {
        width: 150,
        title: (
          <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
            Giới tính
          </span>
        ),
        dataIndex: "gender",
        key: "gender",
        render: (text: string) => (
          <span className="text-[#000000] lg:text-[16px] text-[14px]">
            {text === Gender.MALE ? "Nam" : "Nữ"}
          </span>
        ),
      },
      {
        title: (
          <span className="text-[#ACACAC] lg:text-[16px] text-[14px] flex justify-center">
            Trạng thái
          </span>
        ),
        dataIndex: "status",
        fixed: "right",
        width: 220,
        key: "status",
        render: (__, record) => (
          <div className="flex gap-2 justify-end">
            <span
              className={`lg:text-[16px] text-[14px] font-medium ${
                record?.status === HumanResourcesStatus.ACTIVE
                  ? "text-[#008000]"
                  : record?.status === HumanResourcesStatus.INACTIVE
                    ? "text-[#D32F2F]"
                    : "text-[#431cf3]"
              }`}
            >
              {record?.status === HumanResourcesStatus.ACTIVE
                ? "Đang làm việc"
                : record?.status === HumanResourcesStatus.INACTIVE
                  ? "Dừng làm việc"
                  : "Chưa làm việc"}
            </span>
            <span className="text-[#000000] text-[16px]">
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "edit",
                      label: (
                        <span
                          className="text-blue-500 text-[16px] cursor-pointer flex items-center gap-2"
                          onClick={() => {
                            setIsOpenModalAdd(true);
                            setId(Number(record?.id));
                            setStatus("edit");
                          }}
                        >
                          {" "}
                          <Pencil size={16} /> Chỉnh sửa
                        </span>
                      ),
                    },
                    {
                      key: "delete",
                      label: (
                        <span
                          className="text-red-500 text-[16px] cursor-pointer flex items-center gap-2"
                          onClick={() => {
                            setIsOpenModalDelete(true);
                            setId(Number(record?.id));
                          }}
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
                          className="text-[#000000] text-[16px] cursor-pointer flex items-center gap-2"
                          onClick={() =>
                            navigate(
                              `/app/human-resources-manager/detail/${record?.id}`,
                            )
                          }
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
  }, [ListHumanResources]); // ← Giữ dependency này nếu cần, nhưng thường columns không phụ thuộc vào ListHumanResources

  return (
    <>
      {/* Modal thêm mới và cập nhật nhân sự */}
      <Modal
        centered
        maskClosable={false}
        closeIcon={false}
        className="xl:min-w-[1108px] lg:min-w-[960px] z-100 my-10"
        title={
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] xl:text-[24px]">
              {id ? "Cập nhật nhân sự" : "Thêm nhân sự"}
            </h3>
            <Tooltip placement="bottom" title="Đóng" arrow={false}>
              <div
                onClick={() => {
                  setIsOpenModalAdd(false);
                  setId(null);
                }}
                className="hover:bg-gray-200 p-2 transition-all cursor-pointer rounded-full"
              >
                <X className="text-slate-700 hover:text-slate-600" size={24} />
              </div>
            </Tooltip>
          </div>
        }
        open={isOpenModalAdd}
        footer={null}
      >
        <FormManagerHumanResources
          id={id}
          mode={statusAction}
          refetch={refetch}
          onCancel={() => {
            setIsOpenModalAdd(false);
            setId(null);
          }}
        />
      </Modal>

      {/* Modal xóa nhân sự */}
      <Modal
        centered
        maskClosable={false}
        closeIcon={false}
        className="xl:min-w-[500px] lg:min-w-[500px] z-100 my-10"
        title={
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] xl:text-[24px] flex items-center gap-2">
              Xóa nhân sự
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
        <p>Bạn có chắc chắn muốn xóa nhân sự này không?</p>
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => {
              setIsOpenModalDelete(false);
              setId(null);
            }}
            type="primary"
            className="text-[16px] font-medium h-9!"
          >
            Hủy
          </Button>
          <Button
            onClick={() => handleDeleteHumanResource(id!)}
            type="primary"
            className="text-[16px] font-medium h-9!"
          >
            Xóa
          </Button>
        </div>
      </Modal>

      <div className="space-y-4">
        <div className="rounded-2xl bg-white/80 p-4 shadow-[0_20px_80px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="2xl:text-[26px] xl:text-[22px] text-[18px] font-semibold text-[#272727]">
              Danh sách nhân sự
            </div>
            <Button
              onClick={() => {
                setIsOpenModalAdd(true);
                setStatus("add");
              }}
              type="primary"
              className="text-[16px] font-medium h-9!"
            >
              + Thêm nhân sự
            </Button>
          </div>

          <div className="flex justify-between mb-4">
            <div>
              <Select
                placeholder="Chọn trạng thái"
                className="h-8! w-[200px]"
                allowClear
                value={filterStatus}
                onChange={(value) => {
                  setFilterStatus(value);
                  setPage(1);
                }}
                options={[
                  {
                    label: "Đang làm việc",
                    value: HumanResourcesStatus.ACTIVE,
                  },
                  {
                    label: "Dừng làm việc",
                    value: HumanResourcesStatus.INACTIVE,
                  },
                  {
                    label: "Chưa làm việc",
                    value: HumanResourcesStatus.PENDING,
                  },
                ]}
              />
            </div>

            <div>
              <Input
                prefix={<Search size={14} />}
                className="h-8! w-[300px]!"
                allowClear
                value={keyword}
                placeholder="Tìm kiếm theo mã, tên, email..."
                onChange={handleSearch}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
            <Table
              loading={isLoading}
              dataSource={ListHumanResources?.data || []}
              columns={columns as ColumnType<HumanResources>[]}
              rowKey="id"
              scroll={{ x: 1500 }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Không có dữ liệu"
                  />
                ),
              }}
              onRow={(record) => ({
                onDoubleClick: () =>
                  navigate(`/app/human-resources-manager/detail/${record?.id}`),
              })}
              pagination={{
                current: page,
                pageSize: limit,
                total: ListHumanResources?.meta?.total || 0,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                onChange: handlePaginationChange,
              }}
              className={styles?.customTable}
            />
          </div>
        </div>
      </div>
    </>
  );
}
