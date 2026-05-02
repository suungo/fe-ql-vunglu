import useStyle from "@/interfaces/useStyle";
import {
  Button,
  Card,
  DatePicker,
  Dropdown,
  Empty,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnType } from "antd/es/table";
import {
  AlertTriangle,
  Building2,
  EllipsisVertical,
  Eye,
  HeartPulse,
  Leaf,
  Pencil,
  RefreshCw,
  Search,
  Trash,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DamageCategory, DamageStatus } from "../enum";
import { useFloodDamages } from "../hooks";
import type { IFloodDamage } from "../interfaces";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const categoryConfig: Record<
  DamageCategory,
  { label: string; color: string; icon: React.ReactNode }
> = {
  [DamageCategory.ECONOMIC]: {
    label: "Kinh tế",
    color: "green",
    icon: <Leaf size={14} />,
  },
  [DamageCategory.PROPERTY]: {
    label: "Tài sản",
    color: "blue",
    icon: <Building2 size={14} />,
  },
  [DamageCategory.BUSINESS]: {
    label: "Kinh doanh",
    color: "orange",
    icon: <TrendingUp size={14} />,
  },
  [DamageCategory.HEALTH]: {
    label: "Sức khỏe",
    color: "purple",
    icon: <HeartPulse size={14} />,
  },
  [DamageCategory.FATALITY]: {
    label: "Thương vong",
    color: "red",
    icon: <AlertTriangle size={14} />,
  },
  [DamageCategory.OTHER]: { label: "Khác", color: "default", icon: null },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

export default function ListFloodDamages() {
  const navigate = useNavigate();
  const { styles } = useStyle();

  const [filters, setFilters] = useState({
    category: undefined as DamageCategory | undefined,
    search: "",
  });

  // Danh sách thiệt hại
  const { data: damages } = useFloodDamages({
    page: 1,
    limit: 10,
    search: filters.search,
    category: filters.category,
  });
  console.log(damages);

  const filteredDamages =
    (damages?.data || []).filter((d: IFloodDamage) => {
      if (filters.category && d.damageCategory !== filters.category)
        return false;
      if (
        filters.search &&
        !d.description.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      return true;
    }) || [];

  const columns: ColumnType<IFloodDamage>[] = useMemo(() => {
    return [
      {
        title: (
          <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
            Mã phản ánh
          </span>
        ),
        dataIndex: "reflectionId",
        width: 150,
        render: (id: number) => (
          <Button type="link" onClick={() => navigate(`/reflections/${id}`)}>
            {id}
          </Button>
        ),
      },
      {
        title: (
          <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
            Loại thiệt hại
          </span>
        ),
        dataIndex: "damageCategory",
        width: 140,
        render: (cat: DamageCategory) => {
          const cfg = categoryConfig[cat];
          return (
            <>
              {cat ? (
                <Tag
                  className="flex gap-1 items-center rounded-2xl"
                  color={cfg.color}
                  icon={cfg.icon}
                >
                  {cfg.label}
                </Tag>
              ) : (
                "Chưa được cập nhật"
              )}
            </>
          );
        },
      },
      {
        width: 300,
        title: (
          <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
            Mô tả
          </span>
        ),
        dataIndex: "description",
      },
      {
        title: (
          <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
            Giá trị ước tính
          </span>
        ),
        dataIndex: "estimatedValue",
        width: 160,
        align: "right" as const,
        render: (val: number) =>
          val ? (
            <Text strong>{formatCurrency(val)}</Text>
          ) : (
            "Chưa được cập nhật"
          ),
      },
      {
        title: (
          <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
            Thương vong
          </span>
        ),
        width: 140,
        render: (_val: unknown, record: IFloodDamage) =>
          record.injuredCount || record.deathCount ? (
            <Space size="small">
              {record.injuredCount > 0 && (
                <Tag color="orange">BT: {record.injuredCount}</Tag>
              )}
              {record.deathCount > 0 && (
                <Tag color="red">TV: {record.deathCount}</Tag>
              )}{" "}
              {record.injuredCount === 0 &&
                record.deathCount === 0 &&
                "Không có"}
            </Space>
          ) : (
            "Chưa được cập nhật"
          ),
      },
      {
        title: (
          <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
            Thời gian
          </span>
        ),
        dataIndex: "createdAt",
        width: 120,
        render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
      },
      {
        fixed: "right",
        title: (
          <span className="text-[#ACACAC] lg:text-[16px] text-[14px] flex justify-center">
            Trạng thái
          </span>
        ),
        width: 150,
        render: (_val: unknown, record: IFloodDamage) => (
          <div className="flex items-center gap-2">
            <Tag
              className="rounded-2xl"
              color={
                record.status === DamageStatus.PENDING
                  ? "blue"
                  : record.status === DamageStatus.APPROVED
                    ? "green"
                    : "red"
              }
            >
              {record.status === DamageStatus.PENDING
                ? "Chờ kiểm chứng"
                : record.status === DamageStatus.APPROVED
                  ? "Đã kiểm chứng"
                  : "Đang kiểm chứng"}
            </Tag>
            <Dropdown
              menu={{
                items: [
                  {
                    key: "edit",
                    label: (
                      <span
                        className="text-blue-500 text-[16px] cursor-pointer flex items-center gap-2"
                        onClick={() =>
                          navigate(
                            `/app/flood-damages-manager/edit/${record?.id}`,
                          )
                        }
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
                        //   onClick={() => {
                        //     setIsOpenModalDelete(true);
                        //     setId(Number(record?.id));
                        //   }}
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
                            `/app/flood-damages-manager/detail/${record?.id}`,
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
          </div>
        ),
      },
    ];
  }, [navigate]);

  const totalValue = (damages?.data || []).reduce(
    (sum: number, d: IFloodDamage) => sum + d.estimatedValue,
    0,
  );
  const totalInjured = (damages?.data || []).reduce(
    (sum: number, d: IFloodDamage) => sum + d.injuredCount,
    0,
  );
  const totalDeaths = (damages?.data || []).reduce(
    (sum: number, d: IFloodDamage) => sum + d.deathCount,
    0,
  );

  return (
    <div className="p-4 mx-auto space-y-4 bg-white rounded-xl shadow">
      <div className="flex items-center justify-between">
        <Title level={4} className="mb-0!">
          Danh sách thiệt hại
        </Title>
      </div>

      {/* Filters */}
      <div className="flex justify-between">
        <Space>
          <Select
            placeholder="Loại thiệt hại"
            allowClear
            style={{ width: 160 }}
            value={filters.category}
            onChange={(val) => setFilters({ ...filters, category: val })}
            options={Object.entries(categoryConfig).map(([key, cfg]) => ({
              value: key,
              label: cfg.label,
            }))}
          />
          <RangePicker placeholder={["Từ ngày", "Đến ngày"]} />
        </Space>
        <Space className="flex items-center gap-2">
          <Input
            placeholder="Tìm kiếm..."
            className="h-9!"
            prefix={<Search className="text-[#ACACAC]" size={16} />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 250 }}
          />
          <Tooltip title="Làm mới">
            <RefreshCw className="cursor-pointer text-[#ACACAC]" size={20} />
          </Tooltip>
        </Space>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50">
          <Text type="secondary">Tổng giá trị thiệt hại</Text>
          <div className="text-xl font-bold text-blue-700">
            {formatCurrency(totalValue)}
          </div>
        </Card>
        <Card className="bg-orange-50">
          <Text type="secondary">Tổng người bị thương</Text>
          <div className="text-xl font-bold text-orange-700">
            {totalInjured}
          </div>
        </Card>
        <Card className="bg-red-50">
          <Text type="secondary">Tổng người tử vong</Text>
          <div className="text-xl font-bold text-red-700">{totalDeaths}</div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredDamages}
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
          //   pagination={{
          //     current: page,
          //     pageSize: limit,
          //     total: ListHumanResources?.meta?.total || 0,
          //     showSizeChanger: true,
          //     pageSizeOptions: ["10", "20", "50", "100"],
          //     onChange: handlePaginationChange,
          //   }}
          className={styles?.customTable}
        />
      </Card>
    </div>
  );
}
