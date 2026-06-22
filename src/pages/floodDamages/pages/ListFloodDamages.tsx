import "../styles/floodDamages.css";
import {
  Button,
  DatePicker,
  Dropdown,
  Empty,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tooltip,
  Typography,
  notification,
} from "antd";
import type { ColumnType } from "antd/es/table";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  EllipsisVertical,
  Eye,
  HeartPulse,
  Leaf,
  Pencil,
  RefreshCw,
  Search,
  Trash,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  XCircle,
  ShieldAlert,
  BadgeDollarSign,
  Users,
  Skull,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DamageCategory, DamageStatus } from "../enum";
import {
  useFloodDamages,
  useDeleteFloodDamage,
  useUpdateFloodDamageStatus,
} from "../hooks";
import type { IFloodDamage } from "../interfaces";
import { exportToExcel, exportToWord } from "@/utils/exportUtils";
import { Role } from "@/enums";
import useStyle from "@/interfaces/useStyle";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const categoryConfig: Record<
  DamageCategory,
  {
    label: string;
    color: string;
    bg: string;
    textColor: string;
    icon: React.ReactNode;
  }
> = {
  [DamageCategory.ECONOMIC]: {
    label: "Kinh tế",
    color: "#16a34a",
    bg: "#f0fdf4",
    textColor: "#15803d",
    icon: <Leaf size={13} />,
  },
  [DamageCategory.PROPERTY]: {
    label: "Tài sản",
    color: "#2563eb",
    bg: "#eff6ff",
    textColor: "#1d4ed8",
    icon: <Building2 size={13} />,
  },
  [DamageCategory.BUSINESS]: {
    label: "Kinh doanh",
    color: "#d97706",
    bg: "#fffbeb",
    textColor: "#b45309",
    icon: <TrendingUp size={13} />,
  },
  [DamageCategory.HEALTH]: {
    label: "Sức khỏe",
    color: "#7c3aed",
    bg: "#f5f3ff",
    textColor: "#6d28d9",
    icon: <HeartPulse size={13} />,
  },
  [DamageCategory.FATALITY]: {
    label: "Thương vong",
    color: "#dc2626",
    bg: "#fef2f2",
    textColor: "#b91c1c",
    icon: <AlertTriangle size={13} />,
  },
  [DamageCategory.OTHER]: {
    label: "Khác",
    color: "#6b7280",
    bg: "#f9fafb",
    textColor: "#374151",
    icon: null,
  },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

export default function ListFloodDamages() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();
  const { styles } = useStyle();
  const isManager = [Role.ADMIN, Role.MANAGER, Role.OFFICER].includes(
    user?.role?.roleCode,
  );

  const HEADER_MAP_FD: Record<string, string> = {
    reflectionId: "Mã phản ánh",
    damageCategory: "Loại thiệt hại",
    description: "Mô tả",
    estimatedValue: "Giá trị ước tính (VNĐ)",
    injuredCount: "Số người bị thương",
    deathCount: "Số người tử vong",
    createdAt: "Thời gian",
    creatorName: "Người tạo",
    status: "Trạng thái",
  };

  const WORD_WIDTHS_FD: Record<string, number> = {
    reflectionId: 70,
    damageCategory: 90,
    description: 180,
    estimatedValue: 100,
    injuredCount: 60,
    deathCount: 60,
    createdAt: 80,
    creatorName: 100,
    status: 90,
  };

  const [filters, setFilters] = useState({
    category: undefined as DamageCategory | undefined,
    search: "",
  });

  const { data: damages, refetch } = useFloodDamages({
    page: 1,
    limit: 100,
    search: filters.search,
    category: filters.category,
  });

  const deleteMutation = useDeleteFloodDamage();
  const statusMutation = useUpdateFloodDamageStatus();

  const handleDelete = (record: IFloodDamage) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc muốn xóa bản ghi thiệt hại #${record.id}?`,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(record.id);
          notification.success({
            title: "Thành công",
            description: "Đã xóa thiệt hại",
          });
        } catch {
          notification.error({
            title: "Thất bại",
            description: "Xóa thất bại",
          });
        }
      },
    });
  };

  const handleUpdateStatus = (
    record: IFloodDamage,
    status: "APPROVED" | "REJECTED",
  ) => {
    Modal.confirm({
      title: status === "APPROVED" ? "Duyệt thiệt hại" : "Từ chối thiệt hại",
      content:
        status === "APPROVED"
          ? "Xác nhận duyệt thiệt hại này?"
          : "Xác nhận từ chối thiệt hại này?",
      okText: status === "APPROVED" ? "Duyệt" : "Từ chối",
      okButtonProps: { danger: status === "REJECTED" },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await statusMutation.mutateAsync({ id: record.id, status });
          notification.success({
            title: "Thành công",
            description: status === "APPROVED" ? "Đã duyệt" : "Đã từ chối",
          });
        } catch {
          notification.error({
            title: "Thất bại",
            description: "Cập nhật trạng thái thất bại",
          });
        }
      },
    });
  };

  const filteredDamages = (damages?.data || []).filter((d: IFloodDamage) => {
    if (filters.category && d.damageCategory !== filters.category) return false;
    if (
      filters.search &&
      !d.description.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    return true;
  });

  const formatFDData = (data: IFloodDamage[]) =>
    data.map((item) => ({
      ...item,
      damageCategory:
        categoryConfig[item.damageCategory]?.label || item.damageCategory,
      estimatedValue: formatCurrency(item.estimatedValue),
      createdAt: new Date(item.createdAt).toLocaleDateString("vi-VN"),
      creatorName: item.creator?.fullName || (item.createdBy ? `ID: ${item.createdBy}` : "Hệ thống"),
      status:
        item.status === DamageStatus.PENDING
          ? "Chờ kiểm chứng"
          : item.status === DamageStatus.APPROVED
            ? "Đã kiểm chứng"
            : "Đang kiểm chứng",
    }));

  const handleExportExcelFD = () => {
    if (!damages?.data?.length) {
      notification.warning({
        title: "Cảnh báo",
        description: "Không có dữ liệu để xuất",
      });
      return;
    }
    exportToExcel(
      formatFDData(damages.data),
      "Danh_Sach_Thiet_Hai",
      HEADER_MAP_FD,
    );
    notification.success({
      title: "Thành công",
      description: "Xuất file Excel thành công",
    });
  };

  const handleExportWordFD = () => {
    if (!damages?.data?.length) {
      notification.warning({
        title: "Cảnh báo",
        description: "Không có dữ liệu để xuất",
      });
      return;
    }
    exportToWord(
      formatFDData(damages.data),
      "Danh_Sac_Thiet_Hai",
      HEADER_MAP_FD,
      "DANH SÁCH THIỆT HẠI",
      WORD_WIDTHS_FD,
    );
    notification.success({
      title: "Thành công",
      description: "Xuất file Word thành công",
    });
  };

  const columns: ColumnType<IFloodDamage>[] = useMemo(
    () => [
      {
        title: "Mã phản ánh",
        dataIndex: "reflectionId",
        width: 140,
        render: (id: number) => (
          <Button
            type="link"
            onClick={() => navigate(`/reflections/${id}`)}
            style={{ padding: 0, fontWeight: 600, color: "var(--fd-primary)" }}
          >
            #{id}
          </Button>
        ),
      },
      {
        title: "Loại thiệt hại",
        dataIndex: "damageCategory",
        width: 150,
        render: (cat: DamageCategory) => {
          const cfg = categoryConfig[cat];
          if (!cat || !cfg)
            return (
              <span style={{ color: "var(--fd-text-muted)", fontSize: 13 }}>
                —
              </span>
            );
          return (
            <span
              className="fd-category-tag"
              style={{
                background: cfg.bg,
                color: cfg.textColor,
                border: `1px solid ${cfg.color}30`,
              }}
            >
              {cfg.icon}
              {cfg.label}
            </span>
          );
        },
      },
      {
        title: "Mô tả",
        dataIndex: "description",
        width: 260,
        render: (text: string) => (
          <span
            style={{
              color: "var(--fd-text-secondary)",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {text ? (
              text.length > 80 ? (
                text.slice(0, 80) + "…"
              ) : (
                text
              )
            ) : (
              <span style={{ color: "var(--fd-text-muted)" }}>—</span>
            )}
          </span>
        ),
      },
      {
        title: "Giá trị ước tính",
        dataIndex: "estimatedValue",
        width: 160,
        align: "right" as const,
        render: (val: number) =>
          val ? (
            <span
              style={{
                fontWeight: 700,
                color: "var(--fd-primary)",
                fontSize: 14,
              }}
            >
              {formatCurrency(val)}
            </span>
          ) : (
            <span style={{ color: "var(--fd-text-muted)", fontSize: 13 }}>
              —
            </span>
          ),
      },
      {
        title: "Thương vong",
        width: 130,
        render: (_val: unknown, record: IFloodDamage) => {
          if (!record.injuredCount && !record.deathCount)
            return (
              <span style={{ color: "var(--fd-text-muted)", fontSize: 13 }}>
                —
              </span>
            );
          return (
            <Space size={4}>
              {record.injuredCount > 0 && (
                <span
                  style={{
                    background: "#fff7ed",
                    color: "#ea580c",
                    border: "1px solid #fed7aa",
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  BT: {record.injuredCount}
                </span>
              )}
              {record.deathCount > 0 && (
                <span
                  style={{
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  TV: {record.deathCount}
                </span>
              )}
            </Space>
          );
        },
      },
      {
        title: "Thời gian",
        dataIndex: "createdAt",
        width: 120,
        render: (date: string) => (
          <span style={{ color: "var(--fd-text-secondary)", fontSize: 13 }}>
            {new Date(date).toLocaleDateString("vi-VN")}
          </span>
        ),
      },
      {
        title: "Người tạo",
        width: 150,
        render: (_val: unknown, record: IFloodDamage) => (
          <span style={{ color: "var(--fd-text-secondary)", fontSize: 13, fontWeight: 500 }}>
            {record.creator?.fullName || (record.createdBy ? `ID: ${record.createdBy}` : "Hệ thống")}
          </span>
        ),
      },
      {
        fixed: "right" as const,
        title: "Trạng thái",
        width: 200,
        render: (_val: unknown, record: IFloodDamage) => {
          const statusClass =
            record.status === DamageStatus.PENDING
              ? "pending"
              : record.status === DamageStatus.APPROVED
                ? "approved"
                : "rejected";
          const statusLabel =
            record.status === DamageStatus.PENDING
              ? "Chờ kiểm chứng"
              : record.status === DamageStatus.APPROVED
                ? "Đã kiểm chứng"
                : "Từ chối";

          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={`fd-status-badge ${statusClass}`}>
                {statusLabel}
              </span>
              <Dropdown
                overlayClassName="fd-action-menu"
                menu={{
                  items: [
                    {
                      key: "detail",
                      label: (
                        <span
                          style={{
                            color: "#374151",
                            fontSize: 13,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                          onClick={() =>
                            navigate(
                              `/app/flood-damages-manager/detail/${record?.id}`,
                            )
                          }
                        >
                          <Eye size={14} /> Chi tiết
                        </span>
                      ),
                    },
                    {
                      key: "edit",
                      label: (
                        <span
                          style={{
                            color: "var(--fd-primary)",
                            fontSize: 13,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                          onClick={() =>
                            navigate(
                              `/app/flood-damages-manager/edit/${record?.id}`,
                            )
                          }
                        >
                          <Pencil size={14} /> Chỉnh sửa
                        </span>
                      ),
                    },
                    ...(isManager && record.status === DamageStatus.PENDING
                      ? [
                          {
                            key: "approve",
                            label: (
                              <span
                                style={{
                                  color: "#16a34a",
                                  fontSize: 13,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                                onClick={() =>
                                  handleUpdateStatus(record, "APPROVED")
                                }
                              >
                                <CheckCircle2 size={14} /> Duyệt
                              </span>
                            ),
                          },
                          {
                            key: "reject",
                            label: (
                              <span
                                style={{
                                  color: "#dc2626",
                                  fontSize: 13,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                                onClick={() =>
                                  handleUpdateStatus(record, "REJECTED")
                                }
                              >
                                <XCircle size={14} /> Từ chối
                              </span>
                            ),
                          },
                        ]
                      : []),
                    { type: "divider" as const },
                    {
                      key: "delete",
                      label: (
                        <span
                          style={{
                            color: "#dc2626",
                            fontSize: 13,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                          onClick={() => handleDelete(record)}
                        >
                          <Trash size={14} /> Xóa
                        </span>
                      ),
                    },
                  ],
                }}
                placement="bottomRight"
                arrow
              >
                <button
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: 6,
                    width: 30,
                    height: 30,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#e2e8f0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#f1f5f9")
                  }
                >
                  <EllipsisVertical size={16} color="#64748b" />
                </button>
              </Dropdown>
            </div>
          );
        },
      },
    ],
    [navigate, isManager],
  );

  const totalValue = (damages?.data || []).reduce(
    (sum: number, d: IFloodDamage) => sum + Number(d.estimatedValue || 0),
    0,
  );
  const totalInjured = (damages?.data || []).reduce(
    (sum: number, d: IFloodDamage) => sum + Number(d.injuredCount || 0),
    0,
  );
  const totalDeaths = (damages?.data || []).reduce(
    (sum: number, d: IFloodDamage) => sum + Number(d.deathCount || 0),
    0,
  );

  return (
    <div className="fd-page bg-[#FFFFFF] p-4 rounded-lg shadow-sm">
      {/* ── Header ── */}
      <div className="items-center mb-4 flex justify-between">
        <h2 className="text-[20px] font-semibold text-[#272727]">
          Danh sách thiệt hại
        </h2>
        <div className="fd-header-actions">
          {(user?.role?.roleCode === Role.MANAGER ||
            user?.role?.roleCode === Role.ADMIN) && (
            <>
              <Button
                className="fd-btn-outline-green"
                onClick={handleExportExcelFD}
              >
                <FileSpreadsheet size={15} /> Xuất Excel
              </Button>
              <Button
                className="fd-btn-outline-blue"
                onClick={handleExportWordFD}
              >
                <FileText size={15} /> Xuất Word
              </Button>
            </>
          )}
          {user?.role?.roleCode === Role.MANAGER ? (
            <></>
          ) : (
            <Button
              type="primary"
              className="h-9! items-center flex gap-1"
              onClick={() => navigate("/app/flood-damages-manager/create")}
            >
              <Plus size={16} />
              Thêm thiệt hại
            </Button>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="fd-stats-grid">
        <div className="fd-stat-card blue">
          <div className="fd-stat-icon blue">
            <BadgeDollarSign size={24} />
          </div>
          <div>
            <div className="fd-stat-label">Tổng giá trị thiệt hại</div>
            <div className="fd-stat-value blue">
              {formatCurrency(totalValue)}
            </div>
          </div>
        </div>
        <div className="fd-stat-card orange">
          <div className="fd-stat-icon orange">
            <Users size={24} />
          </div>
          <div>
            <div className="fd-stat-label">Tổng người bị thương</div>
            <div className="fd-stat-value orange">{totalInjured} người</div>
          </div>
        </div>
        <div className="fd-stat-card red">
          <div className="fd-stat-icon red">
            <Skull size={24} />
          </div>
          <div>
            <div className="fd-stat-label">Tổng người tử vong</div>
            <div className="fd-stat-value red">{totalDeaths} người</div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="fd-filter-bar">
        <div className="fd-filter-left">
          <Select
            placeholder="Loại thiệt hại"
            allowClear
            style={{ width: 170, borderRadius: 8 }}
            value={filters.category}
            onChange={(val) => setFilters({ ...filters, category: val })}
            options={Object.entries(categoryConfig).map(([key, cfg]) => ({
              value: key,
              label: (
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {cfg.icon} {cfg.label}
                </span>
              ),
            }))}
          />
          <RangePicker
            placeholder={["Từ ngày", "Đến ngày"]}
            style={{ borderRadius: 8 }}
          />
        </div>
        <div className="fd-filter-right">
          <Input
            placeholder="Tìm kiếm mô tả..."
            prefix={<Search size={15} color="#94a3b8" />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 240, borderRadius: 8 }}
            allowClear
          />
          <Tooltip title="Làm mới dữ liệu">
            <button
              onClick={() => refetch()}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: 8,
                width: 36,
                height: 36,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e2e8f0";
                e.currentTarget.style.transform = "rotate(180deg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.transform = "rotate(0deg)";
              }}
            >
              <RefreshCw size={16} color="#64748b" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="fd-table-card">
        <Table
          className={`fd-table ${styles?.customTable || ""}`}
          columns={columns}
          dataSource={filteredDamages}
          rowKey="id"
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: "var(--fd-text-muted)", fontSize: 14 }}>
                    Không có dữ liệu thiệt hại
                  </span>
                }
              />
            ),
          }}
          onRow={(record) => ({
            onDoubleClick: () =>
              navigate(`/app/flood-damages-manager/detail/${record?.id}`),
            style: { cursor: "default" },
          })}
          pagination={{
            pageSize: 15,
            showTotal: (total) => (
              <span style={{ color: "var(--fd-text-secondary)", fontSize: 13 }}>
                Tổng <strong>{total}</strong> bản ghi
              </span>
            ),
            showSizeChanger: false,
          }}
        />
      </div>
    </div>
  );
}
