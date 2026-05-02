import { Role } from "@/enums";
import useDebounce from "@/hooks/useDebounce";
import { getProfileApi } from "@/pages/profile/api";
import { useQuery } from "@tanstack/react-query";
import {
    Button,
    Drawer,
    Dropdown,
    Empty,
    Input,
    Modal,
    Select,
    Spin,
    Table,
    Tag,
    Tooltip,
    message,
} from "antd";
import type { ColumnType } from "antd/es/table";
import {
    AlertTriangle,
    CheckCheck,
    CloudRain,
    EllipsisVertical,
    Eye,
    Filter,
    MapPin,
    Pencil,
    RefreshCw,
    Search,
    Settings,
    ShieldAlert,
    Trash,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    deleteReflectionApi,
    getReflectionsApi,
    updateReflectionStatusApi,
} from "../api";
import { Category, EventType, Priority, ReflectionStatus } from "../enum";
import type { Reflection } from "../interfaces";

export default function ListReflection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState<Category | undefined>(
    (searchParams.get("category") as Category) || undefined,
  );
  const [status, setStatus] = useState<ReflectionStatus | undefined>(
    (searchParams.get("status") as ReflectionStatus) || undefined,
  );

  const keywordFromUrl = searchParams.get("keyword") || "";
  const [keyword, setKeyword] = useState(keywordFromUrl);
  const [page, setPage] = useState<number>(
    Number(searchParams.get("page")) || 1,
  );
  const [limit, setLimit] = useState<number>(
    Number(searchParams.get("limit")) || 10,
  );

  const [isOpenModalDelete, setIsOpenModalDelete] = useState(false);
  const [idDelete, setIdDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [openFilter, setOpenFilter] = useState(false);
  // API lấy danh sách
  const {
    data: reflections,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["reflections", page, limit, status, keyword, category],
    queryFn: () =>
      getReflectionsApi({
        page: page,
        limit: limit,
        status: status,
        keyword: keyword,
        category: category,
      }),
    // thời gian cache là 1 phút
    staleTime: 60 * 1000,
  });

  // Kiểm tra role nếu là admin có quyền xóa
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await getProfileApi();
      return response?.data;
    },
  });

  const isAdmin = profileData?.role?.roleCode === Role.ADMIN;
  const isManager = profileData?.role?.roleCode === Role.MANAGER;

  const getRoleName = (roleCode?: string) => {
    switch (roleCode) {
      case Role.ADMIN:
        return "Quản trị viên";
      case Role.MANAGER:
        return "Quản lý phường";
      case Role.OFFICER:
        return "Cán bộ phường";
      case Role.LEADER:
        return "Quản lý khu phố";
      case Role.STAFF:
        return "Nhân viên y tế";
      case Role.RESIDENT:
        return "Hộ dân / Cư dân";
      default:
        return "Chưa xác định";
    }
  };

  const debouncedKeyword = useDebounce(keyword, 500);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedKeyword.trim()) {
      params.set("keyword", debouncedKeyword.trim());
    }
    if (page > 1) params.set("page", page.toString());
    if (limit !== 10) params.set("limit", limit.toString());
    if (category) params.set("category", category);
    if (status) params.set("status", status);

    setSearchParams(params, { replace: true });
  }, [debouncedKeyword, page, limit, category, status, setSearchParams]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
    setPage(1);
  };

  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setLimit(newPageSize);
  };

  const handleDelete = async () => {
    if (!idDelete) return;
    try {
      setIsDeleting(true);
      await deleteReflectionApi(idDelete);
      message.success("Xóa phản ánh thành công");
      refetch();
    } catch (error) {
      console.error(error);
      message.error("Xóa phản ánh thất bại");
    } finally {
      setIsDeleting(false);
      setIsOpenModalDelete(false);
      setIdDelete(null);
    }
  };

  const getCategoryLabel = (cat?: Category) => {
    switch (cat) {
      case Category.INFRASTRUCTURE:
        return (
          <span className="flex items-center gap-1">
            <Settings size={16} /> Hạ tầng
          </span>
        );
      case Category.ENVIRONMENT:
        return (
          <span className="flex items-center gap-1">
            <CloudRain size={16} /> Môi trường
          </span>
        );
      case Category.SECURITY:
        return (
          <span className="flex items-center gap-1">
            <ShieldAlert size={16} /> An ninh trật tự
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1">
            <AlertTriangle size={16} /> Khác
          </span>
        );
    }
  };

  const getPriorityTag = (priority?: Priority) => {
    switch (priority) {
      case Priority.LOW:
        return <Tag color="green">Thấp</Tag>;
      case Priority.MEDIUM:
        return <Tag color="gold">Trung bình</Tag>;
      case Priority.HIGH:
        return <Tag color="red">Cao</Tag>;
      default:
        return <Tag color="default">Chưa xác định</Tag>;
    }
  };

  const getStatusTag = (status?: ReflectionStatus) => {
    switch (status) {
      case ReflectionStatus.PENDING:
        return <Tag color="orange">Đang chờ xử lý</Tag>;
      case ReflectionStatus.IN_PROGRESS:
        return <Tag color="blue">Đang xử lý</Tag>;
      case ReflectionStatus.RESOLVED:
        return <Tag color="green">Đã xử lý</Tag>;
      case ReflectionStatus.REJECTED:
        return <Tag color="red">Từ chối</Tag>;
      default:
        return <Tag color="default">Mới</Tag>;
    }
  };

  const getEventTypeLabel = (eventType?: EventType) => {
    switch (eventType) {
      case EventType.RAIN:
        return (
          <span className="flex items-center gap-1">
            <CloudRain size={16} /> Mưa
          </span>
        );
      case EventType.TIDE:
        return (
          <span className="flex items-center gap-1 text-blue-500">
            <AlertTriangle size={16} /> Mực nước
          </span>
        );
      case EventType.FLOOD:
        return (
          <span className="flex items-center gap-1 text-red-500">
            <AlertTriangle size={16} /> Lũ lụt
          </span>
        );
      case EventType.DYKE_BREAK:
        return (
          <span className="flex items-center gap-1 text-red-600 font-medium">
            <AlertTriangle size={16} /> Vỡ đê
          </span>
        );
      case EventType.LANDSLIDE:
        return (
          <span className="flex items-center gap-1 text-orange-600">
            <AlertTriangle size={16} /> Sạt lở
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1">
            <AlertTriangle size={16} /> Khác
          </span>
        );
    }
  };

  const columns: ColumnType<Reflection>[] = [
    ...(isAdmin || isManager
      ? [
          {
            width: 170,
            title: (
              <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
                Người phản ánh
              </span>
            ),
            key: "user",
            render: (_, record: Reflection) => (
              <div className="flex flex-col">
                <span className="text-[#000000] lg:text-[14px] text-[12px] font-semibold line-clamp-1">
                  {record?.user?.fullName || "Khách"}
                </span>
                <span className="text-[#646464] text-[12px] line-clamp-1">
                  {getRoleName(record?.user?.role?.roleCode)}
                </span>
              </div>
            ),
          } as ColumnType<Reflection>,
        ]
      : []),
    {
      width: 150,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Danh mục
        </span>
      ),
      dataIndex: "category",
      key: "category",
      render: (value: Category) => (
        <span className="text-[#000000] lg:text-[14px] text-[12px]">
          {getCategoryLabel(value)}
        </span>
      ),
    },
    {
      width: 130,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Mức độ
        </span>
      ),
      dataIndex: "priority",
      key: "priority",
      render: (value: Priority) => (
        <span className="text-[#000000] lg:text-[14px] text-[12px]">
          {getPriorityTag(value)}
        </span>
      ),
    },
    {
      width: 180,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Loại sự cố
        </span>
      ),
      dataIndex: "typeOfIncident",
      key: "typeOfIncident",
      render: (value: EventType) => (
        <span className="text-[#000000] lg:text-[14px] text-[12px]">
          {getEventTypeLabel(value)}
        </span>
      ),
    },
    {
      width: 200,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Nội dung / Mô tả
        </span>
      ),
      key: "content",
      render: (_, record: Reflection) => (
        <div className="flex flex-col">
          <span className="text-[#000000] lg:text-[14px] text-[12px] line-clamp-1">
            {record?.content}
          </span>
          <span className="text-[#646464] text-[12px] line-clamp-1">
            {record?.description}
          </span>
        </div>
      ),
    },

    {
      width: 300,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Vị trí
        </span>
      ),
      key: "location",
      render: (_, record: Reflection) => (
        <span className="text-[#000000] lg:text-[14px] text-[12px] flex items-center gap-1">
          <MapPin size={14} className="shrink-0" />
          <span className="line-clamp-2">
            {record?.address || `${record?.lat}, ${record?.lng}`}
          </span>
        </span>
      ),
    },
    {
      width: 150,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Phản hồi
        </span>
      ),
      dataIndex: "response",
      key: "response",
      render: (text: string) => (
        <span className="text-[#000000] lg:text-[14px] text-[12px] line-clamp-2">
          {text || "Chưa có phản hồi"}
        </span>
      ),
    },
    {
      width: 220,
      fixed: "right",
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px] flex justify-center">
          Trạng thái
        </span>
      ),
      key: "status",
      render: (_, record: Reflection) => (
        <div className="flex gap-2 justify-end">
          <span className="text-[#000000] lg:text-[14px] text-[12px]">
            {getStatusTag(record?.status)}
          </span>
          <span className="text-[#000000] lg:text-[16px] text-[14px]">
            <Dropdown
              menu={{
                items: [
                  {
                    key: "edit",
                    disabled:
                      record?.status === ReflectionStatus.RESOLVED && !isAdmin,
                    label: (
                      <div
                        onClick={() => {
                          if (
                            record?.status !== ReflectionStatus.RESOLVED ||
                            isAdmin
                          ) {
                            navigate(
                              `/app/reflection-manager/edit/${record?.id}`,
                            );
                          }
                        }}
                        className={`text-[16px] flex items-center gap-2 ${record?.status === ReflectionStatus.RESOLVED && !isAdmin ? "text-gray-400 cursor-not-allowed" : "text-blue-500 cursor-pointer"}`}
                      >
                        <Pencil size={16} /> Sửa
                      </div>
                    ),
                  },
                  // Chỉ hiển thị nút Hoàn tất nếu đang xử lý và là Quản lý
                  ...(record?.status === ReflectionStatus.IN_PROGRESS &&
                  isManager
                    ? [
                        {
                          key: "resolve",
                          label: (
                            <div
                              onClick={() => {
                                Modal.confirm({
                                  title: "Xác nhận hoàn tất sự cố",
                                  content:
                                    "Bạn có chắc chắn sự cố này đã được xử lý xong?",
                                  onOk: async () => {
                                    try {
                                      await updateReflectionStatusApi(
                                        record.id as number,
                                        ReflectionStatus.RESOLVED,
                                      );
                                      message.success(
                                        "Cập nhật trạng thái thành công",
                                      );
                                      refetch();
                                    } catch {
                                      message.error("Cập nhật thất bại");
                                    }
                                  },
                                });
                              }}
                              className="text-[16px] flex items-center gap-2 text-green-600 cursor-pointer"
                            >
                              <CheckCheck size={16} /> Hoàn tất
                            </div>
                          ),
                        },
                      ]
                    : []),
                  {
                    key: "delete",
                    disabled:
                      record?.status === ReflectionStatus.RESOLVED && !isAdmin,
                    label: (
                      <div
                        onClick={() => {
                          if (
                            record?.status !== ReflectionStatus.RESOLVED ||
                            isAdmin
                          ) {
                            setIsOpenModalDelete(true);
                            setIdDelete(record?.id as number);
                          }
                        }}
                        className={`text-[16px] flex items-center gap-2 ${record?.status === ReflectionStatus.RESOLVED && !isAdmin ? "text-gray-400 cursor-not-allowed" : "text-red-500 cursor-pointer"}`}
                      >
                        <Trash size={16} /> Xóa
                      </div>
                    ),
                  },
                  {
                    key: "detail",
                    label: (
                      <span
                        onClick={() =>
                          navigate(
                            `/app/reflection-manager/detail/${record?.id}`,
                          )
                        }
                        className="text-[#000000] text-[16px] cursor-pointer flex items-center gap-2"
                      >
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
      <Drawer
        title="Lọc phản ánh / sự kiện"
        closable={{ "aria-label": "Close Button" }}
        onClose={() => setOpenFilter(false)}
        open={openFilter}
      >
        <div className="flex flex-col gap-4">
          <Select
            placeholder="Danh mục"
            className="w-full h-8!"
            allowClear
            value={category}
            onChange={(value) => setCategory(value)}
            options={[
              { value: Category.INFRASTRUCTURE, label: "Hạ tầng" },
              { value: Category.ENVIRONMENT, label: "Môi trường" },
              { value: Category.SECURITY, label: "An ninh trật tự" },
              { value: Category.OTHER, label: "Khác" },
            ]}
          />
          <Select
            placeholder="Trạng thái"
            className="w-full h-8!"
            allowClear
            value={status}
            onChange={(value) => setStatus(value)}
            options={[
              { value: ReflectionStatus.PENDING, label: "Đang chờ xử lý" },
              { value: ReflectionStatus.IN_PROGRESS, label: "Đang xử lý" },
              { value: ReflectionStatus.RESOLVED, label: "Đã xử lý" },
              { value: ReflectionStatus.REJECTED, label: "Từ chối" },
            ]}
          />
        </div>
      </Drawer>

      {/* Modal xoa */}
      <Modal
        centered
        maskClosable={false}
        closeIcon={false}
        className="xl:min-w-[500px] lg:min-w-[500px] z-100 my-10"
        title={
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] xl:text-[24px] flex items-center gap-2">
              Xóa phản ánh
            </h3>
            <Tooltip placement="bottom" title="Đóng" arrow={false}>
              <div
                onClick={() => {
                  setIsOpenModalDelete(false);
                  setIdDelete(null);
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
        <p>Bạn có chắc chắn muốn xóa phản ánh này không?</p>
        <div className="flex justify-end gap-2 mt-6">
          <Button
            onClick={() => {
              setIsOpenModalDelete(false);
              setIdDelete(null);
            }}
            type="primary"
            className="text-[16px] font-medium h-9!"
          >
            Hủy
          </Button>
          <Button
            onClick={handleDelete}
            type="primary"
            danger
            loading={isDeleting}
            className="text-[16px] font-medium h-9!"
          >
            Xóa
          </Button>
        </div>
      </Modal>

      <div className="space-y-4">
        <div className="rounded-2xl bg-white/80 p-4 shadow-[0_20px_80px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
          <div className="mb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-2">
            <div>
              <div className="2xl:text-[26px] xl:text-[22px] text-[18px] font-semibold text-[#272727]">
                Danh sách phản ánh, báo cáo sự kiện
              </div>
            </div>
            <Button
              onClick={() => navigate("/app/reflection-manager/create")}
              type="primary"
              className="text-[16px] w-full md:w-auto font-medium h-9!"
            >
              + Đăng phản ánh
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between mb-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                onClick={() => setOpenFilter(true)}
                type="primary"
                className="text-[16px] w-full md:w-auto font-medium h-9!"
              >
                Lọc <Filter size={16} className="cursor-pointer" />
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Input
                value={keyword}
                onChange={handleSearch}
                className="w-full md:w-[300px]! h-9!"
                prefix={<Search className="text-[#ACACAC]" size={14} />}
                placeholder="Tìm kiếm theo tiêu đề, mô tả, ..."
              />
              <Tooltip placement="bottom" title="Tải lại" arrow={false}>
                <RefreshCw
                  onClick={() => refetch()}
                  size={20}
                  className={`cursor-pointer ${isLoading ? "animate-spin text-blue-500" : ""}`}
                />
              </Tooltip>
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spin size="large" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
              <Table
                loading={isLoading}
                dataSource={
                  isManager
                    ? reflections?.data?.filter(
                        (r: Reflection) =>
                          r.status === ReflectionStatus.RESOLVED,
                      )
                    : reflections?.data
                }
                columns={columns as ColumnType<Reflection>[]}
                rowKey={(record) =>
                  record?.id?.toString() || Math.random().toString()
                }
                scroll={{ x: 1300 }}
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
                    navigate(`/app/reflection-manager/detail/${record?.id}`),
                })}
                pagination={{
                  current: page,
                  pageSize: limit,
                  total: reflections?.meta?.total || 0,
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
