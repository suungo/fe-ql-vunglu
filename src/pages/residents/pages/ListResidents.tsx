import useDebounce from "@/hooks/useDebounce";
import useStyle from "@/interfaces/useStyle";
import {
  Button,
  Drawer,
  Dropdown,
  Empty,
  Input,
  Modal,
  notification,
  Select,
  Spin,
  Table,
  Tooltip,
} from "antd";
import type { ColumnType } from "antd/es/table";
import { AxiosError } from "axios";
import {
  EllipsisVertical,
  Eye,
  Filter,
  Pencil,
  RefreshCw,
  Search,
  Trash,
  X,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HouseTypeLabel } from "../constants";
import {
  HasBusiness,
  HasChildren,
  HasElderly,
  HasPregnant,
  HasSick,
  HouseType,
} from "../enum";
import { useDeleteResident, useResidents } from "../hooks";
import type { Resident } from "../interfaces";
import { exportToExcel, exportToWord } from "@/utils/exportUtils";
import { Role } from "@/enums";

export default function ListResidents() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { styles } = useStyle();
  const [houseType, setHouseType] = useState<HouseType | undefined>(
    (searchParams.get("houseType") as HouseType) || undefined,
  );
  const [hasChildren, setHasChildren] = useState<HasChildren | undefined>(
    (searchParams.get("hasChildren") as HasChildren) || undefined,
  );
  const [hasBusiness, setHasBusiness] = useState<HasBusiness | undefined>(
    (searchParams.get("hasBusiness") as HasBusiness) || undefined,
  );
  const [hasChronicDisease, setHasChronicDisease] = useState<
    HasSick | undefined
  >((searchParams.get("hasChronicDisease") as HasSick) || undefined);
  const [hasElderly, setHasElderly] = useState<HasElderly | undefined>(
    (searchParams.get("hasElderly") as HasElderly) || undefined,
  );
  const [hasPregnantWomen, setHasPregnantWomen] = useState<
    HasPregnant | undefined
  >((searchParams.get("hasPregnantWomen") as HasPregnant) || undefined);
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
  const [isOpenModalDelete, setIsOpenModalDelete] = useState(false);
  const [open, setOpen] = useState(false);
  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

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
    if (houseType) params.set("houseType", houseType);
    if (hasChildren) params.set("hasChildren", hasChildren);
    if (hasBusiness) params.set("hasBusiness", hasBusiness);
    if (hasChronicDisease) params.set("hasChronicDisease", hasChronicDisease);
    if (hasElderly) params.set("hasElderly", hasElderly);
    if (hasPregnantWomen) params.set("hasPregnantWomen", hasPregnantWomen);
    setSearchParams(params, { replace: true });
  }, [
    debouncedKeyword,
    page,
    limit,
    houseType,
    hasChildren,
    hasBusiness,
    hasChronicDisease,
    hasElderly,
    hasPregnantWomen,
    setSearchParams,
  ]);

  // Gọi API (hook của bạn)
  const {
    data: ListResidents,
    isLoading,
    refetch,
  } = useResidents({
    keyword: debouncedKeyword,
    limit,
    page,
    hasChildren: hasChildren as HasChildren,
    hasBusiness: hasBusiness as HasBusiness,
    hasChronicDisease: hasChronicDisease as HasSick,
    hasElderly: hasElderly as HasElderly,
    hasPregnantWomen: hasPregnantWomen as HasPregnant,
    houseType: houseType as HouseType,
  });

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

  const deleteResidentMutation = useDeleteResident();
  const handleDeleteResident = async (id: number) => {
    try {
      const response = await deleteResidentMutation.mutateAsync(id);
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
    }
  };

  const HEADER_MAP = {
    residentCode: "Mã hộ dân",
    fullName: "Tên chủ hộ",
    phoneNumber: "Số điện thoại",
    email: "Email",
    address: "Địa chỉ",
    longitude: "Kinh độ",
    latitude: "Vĩ độ",
    numberOfMembers: "Số TV",
    hasElderly: "Người già",
    hasChildren: "Trẻ em",
    hasPregnantWomen: "PN mang thai",
    hasChronicDisease: "Bệnh nền",
    houseType: "Loại nhà",
    numberOfFloors: "Số tầng",
    hasBusiness: "Kinh doanh",
  };

  const WORD_COL_WIDTHS: Record<string, number> = {
    residentCode: 50,
    fullName: 80,
    phoneNumber: 65,
    email: 100,
    address: 120,
    longitude: 50,
    latitude: 50,
    numberOfMembers: 30,
    hasElderly: 40,
    hasChildren: 40,
    hasPregnantWomen: 50,
    hasChronicDisease: 40,
    houseType: 70,
    numberOfFloors: 30,
    hasBusiness: 40,
  };

  const formatExportData = (data: Resident[]) => {
    return data.map((item) => ({
      ...item,
      hasElderly: item.hasElderly === HasElderly.YES ? "Có" : "Không",
      hasChildren: item.hasChildren === HasChildren.YES ? "Có" : "Không",
      hasPregnantWomen:
        item.hasPregnantWomen === HasPregnant.YES ? "Có" : "Không",
      hasChronicDisease: item.hasChronicDisease === HasSick.YES ? "Có" : "Không",
      hasBusiness: item.hasBusiness === HasBusiness.YES ? "Có" : "Không",
      houseType: HouseTypeLabel[item.houseType],
    }));
  };

  const handleExportExcel = () => {
    if (!ListResidents?.data || ListResidents.data.length === 0) {
      notification.warning({ message: "Không có dữ liệu để xuất" });
      return;
    }
    const dataToExport = formatExportData(ListResidents.data);
    exportToExcel(dataToExport, "Danh_Sach_Ho_Dan", HEADER_MAP);
    notification.success({ message: "Xuất file Excel thành công" });
  };

  const handleExportWord = () => {
    if (!ListResidents?.data || ListResidents.data.length === 0) {
      notification.warning({ message: "Không có dữ liệu để xuất" });
      return;
    }
    const dataToExport = formatExportData(ListResidents.data);
    exportToWord(dataToExport, "Danh_Sach_Ho_Dan", HEADER_MAP, "DANH SÁCH HỘ DÂN", WORD_COL_WIDTHS);
    notification.success({ message: "Xuất file Word thành công" });
  };

  const columns: ColumnType<Resident>[] = [
    {
      width: 150,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Mã hộ dân
        </span>
      ),
      dataIndex: "residentCode",

      key: "residentCode",
      render: (text: string) => (
        <span className="text-[#000000] lg:text-[16px] text-[14px]">
          {text}
        </span>
      ),
    },
    {
      width: 200,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Tên chủ hộ
        </span>
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
          {text}
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
          {text}
        </span>
      ),
    },

    {
      width: 200,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Kinh độ - Vĩ độ
        </span>
      ),
      key: "coordinates",
      render: (_, record: Resident) => (
        <span className="text-[#000000] lg:text-[16px] text-[14px]">
          {record?.longitude} - {record?.latitude}
        </span>
      ),
    },
    {
      width: 150,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Số thành viên
        </span>
      ),
      dataIndex: "numberOfMembers",
      key: "numberOfMembers",
      render: (text: number) => (
        <span className="text-[#000000] lg:text-[16px] text-[14px]">
          {text}
        </span>
      ),
    },
    {
      width: 150,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Có người già
        </span>
      ),
      dataIndex: "hasElderly",
      key: "hasElderly",
      render: (_, record: Resident) => (
        <span className="text-[#000000] lg:text-[16px] text-[14px]">
          {record?.hasElderly === HasElderly.YES ? "Có" : "Không"}
        </span>
      ),
    },
    {
      width: 150,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Có trẻ em
        </span>
      ),
      dataIndex: "hasChildren",
      key: "hasChildren",
      render: (_, record: Resident) => (
        <span className="text-[#000000] lg:text-[16px] text-[14px]">
          {record?.hasChildren === HasChildren.YES ? "Có" : "Không"}
        </span>
      ),
    },
    {
      width: 150,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Có phụ nữ mang thai
        </span>
      ),
      dataIndex: "hasPregnantWomen",
      key: "hasPregnantWomen",
      render: (_, record: Resident) => (
        <span className="text-[#000000] lg:text-[16px] text-[14px]">
          {record?.hasPregnantWomen === HasPregnant.YES ? "Có" : "Không"}
        </span>
      ),
    },
    {
      width: 150,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Có người bị bệnh nền
        </span>
      ),
      dataIndex: "hasChronicDisease",
      key: "hasChronicDisease",
      render: (_, record: Resident) => (
        <span className="text-[#000000] lg:text-[16px] text-[14px]">
          {record?.hasChronicDisease === HasSick.YES ? "Có" : "Không"}
        </span>
      ),
    },
    {
      width: 150,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Loại nhà
        </span>
      ),
      dataIndex: "houseType",
      key: "houseType",
      render: (text: HouseType) => (
        <span className="text-[#000000] lg:text-[16px] text-[14px]">
          {HouseTypeLabel[text]}
        </span>
      ),
    },
    {
      width: 150,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Số tầng
        </span>
      ),
      dataIndex: "numberOfFloors",
      key: "numberOfFloors",
      render: (text: number) => (
        <span className="text-[#000000] lg:text-[16px] text-[14px]">
          {text}
        </span>
      ),
    },
    {
      width: 150,
      fixed: "right",
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px] flex justify-center">
          Có kinh doanh
        </span>
      ),
      dataIndex: "hasBusiness",
      key: "hasBusiness",
      render: (_, record: Resident) => (
        <div className="flex gap-2 justify-end">
          <span className="text-[#000000] lg:text-[16px] text-[14px]">
            {record?.hasBusiness === HasBusiness.YES ? "Có" : "Không"}
          </span>
          <span className="text-[#000000] lg:text-[16px] text-[14px]">
            <Dropdown
              menu={{
                items: [
                  {
                    key: "edit",
                    label: (
                      <span
                        onClick={() =>
                          navigate(`/app/residents-manager/edit/${record?.id}`)
                        }
                        className="text-blue-500 text-[16px] cursor-pointer flex items-center gap-2"
                      >
                        {" "}
                        <Pencil size={16} /> Sửa
                      </span>
                    ),
                  },
                  {
                    key: "delete",
                    label: (
                      <span
                        onClick={() => {
                          setIsOpenModalDelete(true);
                          setId(record?.id);
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
                          navigate(
                            `/app/residents-manager/detail/${record?.id}`,
                          )
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
      <Drawer
        title="Lọc theo thông tin hộ dân"
        closable={{ "aria-label": "Close Button" }}
        onClose={onClose}
        open={open}
      >
        <div className="flex flex-col gap-4">
          <Select
            placeholder="Chọn loại nhà"
            className="w-full h-8!"
            allowClear
            value={houseType}
            onChange={(value) => setHouseType(value)}
            options={[
              {
                value: HouseType.HOUSE_LEVEL_4,
                label: "Nhà cấp 4",
              },
              {
                value: HouseType.HOUSE_STREET,
                label: "Nhà phố (Nhà ống)",
              },
              {
                value: HouseType.HOUSE_ALLEY,
                label: "Nhà trong hẻm",
              },
              {
                value: HouseType.HOUSE_FRONTAGE,
                label: "Nhà mặt tiền",
              },
              {
                value: HouseType.APARTMENT,
                label: "Chung cư / căn hộ",
              },
              {
                value: HouseType.RENTAL_HOUSE,
                label: "Nhà trọ / phòng trọ",
              },
              {
                value: HouseType.VILLA,
                label: "Biệt thự / nhà liền kề",
              },
            ]}
          />
          <Select
            placeholder="Chọn hộ có người già"
            className="w-full h-8!"
            allowClear
            value={hasElderly}
            onChange={(value) => setHasElderly(value)}
            options={[
              {
                value: HasElderly.YES,
                label: "Có",
              },
              {
                value: HasElderly.NO,
                label: "Không",
              },
            ]}
          />
          <Select
            placeholder="Chọn hộ có trẻ em"
            className="w-full h-8!"
            allowClear
            value={hasChildren}
            onChange={(value) => setHasChildren(value)}
            options={[
              {
                value: HasChildren.YES,
                label: "Có",
              },
              {
                value: HasChildren.NO,
                label: "Không",
              },
            ]}
          />
          <Select
            placeholder="Chọn hộ có phụ nữ mang thai"
            className="w-full h-8!"
            allowClear
            value={hasPregnantWomen}
            onChange={(value) => setHasPregnantWomen(value)}
            options={[
              {
                value: HasPregnant.YES,
                label: "Có",
              },
              {
                value: HasPregnant.NO,
                label: "Không",
              },
            ]}
          />
          <Select
            placeholder="Chọn hộ có người bệnh nền"
            className="w-full h-8!"
            allowClear
            value={hasChronicDisease}
            onChange={(value) => setHasChronicDisease(value)}
            options={[
              {
                value: HasSick.YES,
                label: "Có",
              },
              {
                value: HasSick.NO,
                label: "Không",
              },
            ]}
          />
          <Select
            placeholder="Chọn hộ có kinh doanh"
            className="w-full h-8!"
            allowClear
            value={hasBusiness}
            onChange={(value) => setHasBusiness(value)}
            options={[
              {
                value: HasBusiness.YES,
                label: "Có",
              },
              {
                value: HasBusiness.NO,
                label: "Không",
              },
            ]}
          />
        </div>
      </Drawer>

      {/* Modal xóa hộ dân */}
      <Modal
        centered
        maskClosable={false}
        closeIcon={false}
        className="xl:min-w-[500px] lg:min-w-[500px] z-100 my-10"
        title={
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] xl:text-[24px] flex items-center gap-2">
              Xóa hộ dân
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
        <p>Bạn có chắc chắn muốn xóa hộ dân này không?</p>
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
            onClick={() => handleDeleteResident(id!)}
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
            <div>
              <div className="2xl:text-[26px] xl:text-[22px] text-[18px] font-semibold text-[#272727]">
                Danh sách hộ dân
              </div>
            </div>
            <div className="flex gap-2">
              {(user?.role?.roleCode === Role.MANAGER || user?.role?.roleCode === Role.ADMIN) && (
                <>
                  <Button
                    onClick={handleExportExcel}
                    className="text-[16px] font-medium h-9! border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <FileSpreadsheet size={16} /> Xuất Excel
                  </Button>
                  <Button
                    onClick={handleExportWord}
                    className="text-[16px] font-medium h-9! border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <FileText size={16} /> Xuất Word
                  </Button>
                </>
              )}
              <Button
                onClick={() => {
                  navigate("/app/residents-manager/create");
                }}
                type="primary"
                className="text-[16px] font-medium h-9!"
              >
                + Thêm hộ dân
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-between mb-2">
            <div className="flex items-center gap-2">
              <Button
                onClick={showDrawer}
                type="primary"
                className="text-[16px] font-medium h-9!"
              >
                Lọc <Filter size={16} className="cursor-pointer" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={keyword}
                onChange={handleSearch}
                className="w-[300px]! h-8!"
                prefix={<Search className="text-[#ACACAC]" size={14} />}
                placeholder="Tìm kiếm theo mã, tên hộ dân, ..."
              />
              <Tooltip placement="bottom" title="Tải lại" arrow={false}>
                <RefreshCw
                  onClick={() => refetch()}
                  size={20}
                  className="cursor-pointer"
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
                dataSource={ListResidents?.data || []}
                columns={columns as ColumnType<Resident>[]}
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
                    navigate(`/app/residents-manager/detail/${record?.id}`),
                })}
                pagination={{
                  current: page,
                  pageSize: limit,
                  total: ListResidents?.meta?.total || 0,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50", "100"],
                  onChange: handlePaginationChange,
                }}
                className={styles?.customTable}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
