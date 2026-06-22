import { Role } from "@/enums";
import "../../floodDamages/styles/floodDamages.css";
import { getProfileApi } from "@/pages/profile/api";
import { exportToExcel, exportToWord } from "@/utils/exportUtils";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Dropdown,
  Empty,
  Input,
  Modal,
  Select,
  Spin,
  Table,
  Tag,
  Tooltip,
  notification,
} from "antd";
import type { ColumnType } from "antd/es/table";
import {
  AlertTriangle,
  CloudRain,
  EllipsisVertical,
  Eye,
  FileSpreadsheet,
  FileText,
  MapPin,
  Pencil,
  Search,
  Settings,
  ShieldAlert,
  Trash,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { deleteReflectionApi, getReflectionsApi } from "../api";
import { Category, EventType, Priority, ReflectionStatus } from "../enum";
import type { Reflection } from "../interfaces";
import ReflectionFilter, {
  type ReflectionFilterParams,
} from "../components/ReflectionFilter";

export default function ListReflection() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filterParams, setFilterParams] = useState<ReflectionFilterParams>(
    () => {
      return {
        keyword: searchParams.get("keyword") || undefined,
        category: (searchParams.get("category") as Category) || undefined,
        status: (searchParams.get("status") as ReflectionStatus) || undefined,
        priority: (searchParams.get("priority") as Priority) || undefined,
      };
    },
  );
  const [page, setPage] = useState<number>(
    Number(searchParams.get("page")) || 1,
  );
  const [limit, setLimit] = useState<number>(
    Number(searchParams.get("limit")) || 10,
  );

  const [isOpenModalDelete, setIsOpenModalDelete] = useState(false);
  const [idDelete, setIdDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // API lấy danh sách
  const {
    data: reflections,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "reflections",
      page,
      limit,
      filterParams.status,
      filterParams.keyword,
      filterParams.category,
      filterParams.priority,
    ],
    queryFn: () =>
      getReflectionsApi({
        page: page,
        limit: limit,
        status: filterParams.status,
        keyword: filterParams.keyword,
        category: filterParams.category,
        priority: filterParams.priority,
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
        return "Cán bộ tăng cường";
      case "INSPECTOR":
        return "Hậu kiểm";
      case "PATROL":
        return "Cán bộ tuần tra";
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

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterParams.keyword?.trim()) {
      params.set("keyword", filterParams.keyword.trim());
    }
    if (page > 1) params.set("page", page.toString());
    if (limit !== 10) params.set("limit", limit.toString());
    if (filterParams.category) params.set("category", filterParams.category);
    if (filterParams.status) params.set("status", filterParams.status);
    if (filterParams.priority) params.set("priority", filterParams.priority);

    setSearchParams(params, { replace: true });
  }, [filterParams, page, limit, setSearchParams]);

  const handleFilter = (params: ReflectionFilterParams) => {
    setFilterParams(params);
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
      notification.success({
        title: "Thành công",
        description: "Xóa phản ánh thành công",
      });
      refetch();
    } catch (error) {
      console.error(error);
      notification.error({
        title: "Thất bại",
        description: "Xóa phản ánh thất bại",
      });
    } finally {
      setIsDeleting(false);
      setIsOpenModalDelete(false);
      setIdDelete(null);
    }
  };

  const HEADER_MAP_RF: Record<string, string> = {
    userName: "Người phản ánh",
    category: "Danh mục",
    priority: "Mức độ",
    typeOfIncident: "Loại sự cố",
    content: "Nội dung",
    description: "Mô tả",
    address: "Địa chỉ",
    response: "Phản hồi",
    status: "Trạng thái",
  };

  const WORD_WIDTHS_RF: Record<string, number> = {
    userName: 100,
    category: 80,
    priority: 60,
    typeOfIncident: 80,
    content: 130,
    description: 130,
    address: 150,
    response: 110,
    status: 80,
  };

  const getCatText = (cat?: Category) => {
    switch (cat) {
      case Category.INFRASTRUCTURE:
        return "Hạ tầng";
      case Category.ENVIRONMENT:
        return "Môi trường";
      case Category.SECURITY:
        return "An ninh trật tự";
      default:
        return "Khác";
    }
  };

  const getPriorityText = (p?: Priority) => {
    switch (p) {
      case Priority.LOW:
        return "Thấp";
      case Priority.MEDIUM:
        return "Trung bình";
      case Priority.HIGH:
        return "Cao";
      default:
        return "Chưa xác định";
    }
  };

  const getStatusText = (s?: ReflectionStatus) => {
    switch (s) {
      case ReflectionStatus.PENDING:
        return "Chờ xác minh";
      case ReflectionStatus.VERIFIED:
        return "Đã xác minh";
      case ReflectionStatus.ASSIGNED:
        return "Đã phân công";
      case ReflectionStatus.IN_PROGRESS:
        return "Đang xử lý";
      case ReflectionStatus.COMPLETED:
        return "Chờ xác nhận";
      case ReflectionStatus.RESOLVED:
        return "Đã hoàn thành";
      case ReflectionStatus.REJECTED:
        return "Từ chối";
      default:
        return "Mới";
    }
  };

  const getEventTypeText = (e?: EventType) => {
    switch (e) {
      case EventType.RAIN:
        return "Mưa";
      case EventType.TIDE:
        return "Mực nước";
      case EventType.FLOOD:
        return "Lũ lụt";
      case EventType.DYKE_BREAK:
        return "Vỡ đê";
      case EventType.LANDSLIDE:
        return "Sạt lở";
      default:
        return "Khác";
    }
  };

  const formatRFData = (data: Reflection[]) =>
    data.map((item) => ({
      userName: item.user?.fullName || "Khách",
      category: getCatText(item.category),
      priority: getPriorityText(item.priority),
      typeOfIncident: getEventTypeText(item.typeOfIncident),
      content: item.content || "",
      description: item.description || "",
      address: item.address || `${item.lat}, ${item.lng}`,
      response: item.response || "Chưa có phản hồi",
      status: getStatusText(item.status),
    }));

  const handleExportExcelRF = () => {
    const raw = reflections?.data || [];
    if (!raw.length) {
      notification.warning({
        title: "Cảnh báo",
        description: "Không có dữ liệu để xuất",
      });
      return;
    }
    exportToExcel(formatRFData(raw), "Danh_Sach_Phan_Anh", HEADER_MAP_RF);
    notification.success({
      title: "Thành công",
      description: "Xuất file Excel thành công",
    });
  };

  const handleExportWordRF = () => {
    const raw = reflections?.data || [];
    if (!raw.length) {
      notification.warning({
        title: "Cảnh báo",
        description: "Không có dữ liệu để xuất",
      });
      return;
    }
    exportToWord(
      formatRFData(raw),
      "Danh_Sach_Phan_Anh",
      HEADER_MAP_RF,
      "DANH SÁCH PHẢN ÁNH / SỰ KIỆN",
      WORD_WIDTHS_RF,
    );
    notification.success({
      title: "Thành công",
      description: "Xuất file Word thành công",
    });
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
    const cfg: Record<string, { color: string; label: string }> = {
      PENDING: { color: "orange", label: "Chờ xác minh" },
      VERIFIED: { color: "blue", label: "Đã xác minh" },
      ASSIGNED: { color: "purple", label: "Đã phân công" },
      IN_PROGRESS: { color: "geekblue", label: "Đang xử lý" },
      COMPLETED: { color: "cyan", label: "Chờ xác nhận" },
      RESOLVED: { color: "green", label: "Đã hoàn thành" },
      REJECTED: { color: "red", label: "Từ chối" },
    };
    const c = cfg[status ?? ""] ?? { color: "default", label: "Mới" };
    return <Tag color={c.color}>{c.label}</Tag>;
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
      width: isMobile ? 140 : 220,
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
                  ...(record?.status === ReflectionStatus.PENDING &&
                  (record?.user?.id === profileData?.id ||
                    (record as any)?.userId === profileData?.id)
                    ? [
                        {
                          key: "edit",
                          label: (
                            <div
                              onClick={() => {
                                navigate(
                                  `/app/reflection-manager/edit/${record?.id}`,
                                );
                              }}
                              className="text-[16px] flex items-center gap-2 text-blue-500 cursor-pointer"
                            >
                              <Pencil size={16} /> Sửa
                            </div>
                          ),
                        },
                      ]
                    : []),
                  ...(record?.status === ReflectionStatus.PENDING &&
                  (record?.user?.id === profileData?.id ||
                    (record as any)?.userId === profileData?.id)
                    ? [
                        {
                          key: "delete",
                          label: (
                            <div
                              onClick={() => {
                                setIsOpenModalDelete(true);
                                setIdDelete(record?.id as number);
                              }}
                              className="text-[16px] flex items-center gap-2 text-red-500 cursor-pointer"
                            >
                              <Trash size={16} /> Xóa
                            </div>
                          ),
                        },
                      ]
                    : []),
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
            <div className="flex flex-wrap gap-2">
              {(isAdmin || isManager) && (
                <>
                  <Button
                    onClick={handleExportExcelRF}
                    className="fd-btn-outline-green"
                  >
                    <FileSpreadsheet size={16} /> Xuất Excel
                  </Button>
                  <Button
                    onClick={handleExportWordRF}
                    className="fd-btn-outline-blue"
                  >
                    <FileText size={16} /> Xuất Word
                  </Button>
                </>
              )}
              {(isAdmin ||
                isManager ||
                profileData?.role?.roleCode === Role.RESIDENT) && (
                <Button
                  onClick={() => navigate("/app/reflection-manager/create")}
                  type="primary"
                  className="text-[16px] w-full md:w-auto font-medium h-9!"
                >
                  + Thêm phản ánh
                </Button>
              )}
            </div>
          </div>
          <div className="mb-4">
            <ReflectionFilter
              onFilter={handleFilter}
              onRefresh={() => refetch()}
              loading={isLoading}
            />
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spin size="large" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
              <Table
                loading={isLoading}
                dataSource={reflections?.data}
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
