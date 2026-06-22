import useStyle from "@/interfaces/useStyle";
import "../../floodDamages/styles/floodDamages.css";
import {
  Button,
  Dropdown,
  Empty,
  Modal,
  notification,
  Table,
  Tooltip,
  Tabs,
} from "antd";
import type { ColumnType } from "antd/es/table";
import { AxiosError } from "axios";
import {
  EllipsisVertical,
  Eye,
  Pencil,
  Trash,
  X,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getResidentContacts, deleteResidentContact } from "../../residentContacts/apis";
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
import ResidentFilter, {
  type ResidentFilterParams,
} from "../components/ResidentFilter";
import ResidentWithAccountTab from "../components/ResidentWithAccountTab";
import ResidentPendingApprovalTab from "../components/ResidentPendingApprovalTab";
import ResidentRejectedTab from "../components/ResidentRejectedTab";

export default function ListResidents() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { styles } = useStyle();

  const [id, setId] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [isOpenModalDelete, setIsOpenModalDelete] = useState(false);
  const [filterParams, setFilterParams] = useState<ResidentFilterParams>({});
  const [activeTab, setActiveTab] = useState<string>("all");

  // Gọi API lấy thông tin liên hệ từ Excel
  const {
    data: contactData,
    isLoading: isContactsLoading,
    refetch: refetchContacts,
  } = useQuery({
    queryKey: ["resident-contacts", page, limit, filterParams.keyword],
    queryFn: () =>
      getResidentContacts({
        page: page,
        limit: limit,
        keyword: filterParams.keyword,
      }),
    enabled: activeTab === "all",
  });

  // Gọi API danh sách hộ dân gốc
  const {
    data: ListResidents,
    isLoading,
    refetch,
  } = useResidents({
    keyword: filterParams.keyword,
    limit,
    page,
    hasChildren: filterParams.hasChildren as HasChildren,
    hasBusiness: filterParams.hasBusiness as HasBusiness,
    hasChronicDisease: filterParams.hasChronicDisease as HasSick,
    hasElderly: filterParams.hasElderly as HasElderly,
    hasPregnantWomen: filterParams.hasPregnantWomen as HasPregnant,
    houseType: filterParams.houseType as HouseType,
  });

  const handleFilter = (params: ResidentFilterParams) => {
    setFilterParams(params);
    setPage(1);
    // Cập nhật URL params
    const urlParams = new URLSearchParams();
    if (params.keyword) urlParams.set("keyword", params.keyword);
    if (params.houseType) urlParams.set("houseType", params.houseType);
    if (params.hasElderly) urlParams.set("hasElderly", params.hasElderly);
    if (params.hasChildren) urlParams.set("hasChildren", params.hasChildren);
    if (params.hasPregnantWomen)
      urlParams.set("hasPregnantWomen", params.hasPregnantWomen);
    if (params.hasChronicDisease)
      urlParams.set("hasChronicDisease", params.hasChronicDisease);
    if (params.hasBusiness) urlParams.set("hasBusiness", params.hasBusiness);
    setSearchParams(urlParams, { replace: true });
  };

  // Xử lý phân trang
  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setLimit(newPageSize);
  };

  const deleteResidentMutation = useDeleteResident();
  const handleDeleteResident = async (id: number) => {
    try {
      let response;
      if (activeTab === "all") {
        response = await deleteResidentContact(id);
      } else {
        response = await deleteResidentMutation.mutateAsync(id);
      }
      if (response?.statusCode === 200) {
        notification.success({
          title: "Thành công",
          description: response?.message,
        });
        if (activeTab === "all") {
          refetchContacts();
        } else {
          refetch();
        }
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
      hasChronicDisease:
        item.hasChronicDisease === HasSick.YES ? "Có" : "Không",
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
    exportToWord(
      dataToExport,
      "Danh_Sach_Ho_Dan",
      HEADER_MAP,
      "DANH SÁCH HỘ DÂN",
      WORD_COL_WIDTHS,
    );
    notification.success({ message: "Xuất file Word thành công" });
  };

  const columns: ColumnType<any>[] = [
    {
      width: 150,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">ID</span>
      ),
      dataIndex: activeTab === "all" ? "id" : "residentCode",
      key: "id",
      render: (text: string) => (
        <span className="text-[#000000] lg:text-[16px] text-[14px] font-semibold">
          {text}
        </span>
      ),
    },
    {
      width: 220,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Email (Địa chỉ thư điện tử)
        </span>
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
          {text || "—"}
        </span>
      ),
    },
    {
      width: 150,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Số CCCD
        </span>
      ),
      dataIndex: "cccd",
      key: "cccd",
      render: (text: string) => (
        <span className="text-[#000000] lg:text-[16px] text-[14px]">
          {text || "—"}
        </span>
      ),
    },
    {
      width: 300,
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px]">
          Địa chỉ liên hệ
        </span>
      ),
      dataIndex: "address",
      key: "address",
      render: (text: string) => (
        <span className="text-[#000000] lg:text-[16px] text-[14px]">
          {text || "—"}
        </span>
      ),
    },
    {
      width: 120,
      fixed: "right",
      title: (
        <span className="text-[#ACACAC] lg:text-[16px] text-[14px] flex justify-center">
          Hành động
        </span>
      ),
      key: "actions",
      render: (_, record: any) => (
        <div className="flex justify-center">
          <Dropdown
            menu={{
              items: [
                ...(activeTab === "all"
                  ? [
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
                            <Trash size={16} /> Xóa
                          </span>
                        ),
                      },
                    ]
                  : [
                      ...(user?.role?.roleCode === Role.ADMIN
                        ? []
                        : [
                            {
                              key: "edit",
                              label: (
                                <span
                                  onClick={() =>
                                    navigate(
                                      `/app/residents-manager/edit/${record?.id}`,
                                    )
                                  }
                                  className="text-blue-500 text-[16px] cursor-pointer flex items-center gap-2"
                                >
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
                                  <Trash size={16} /> Xóa
                                </span>
                              ),
                            },
                          ]),
                      {
                        key: "detail",
                        label: (
                          <span
                            onClick={() =>
                              navigate(`/app/residents-manager/detail/${record?.id}`)
                            }
                            className="text-[#000000] text-[16px] cursor-pointer flex items-center gap-2"
                          >
                            <Eye size={16} /> Chi tiết
                          </span>
                        ),
                      },
                    ]),
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

  return (
    <>
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
          <div className="2xl:text-[22px] xl:text-[20px] text-[18px] mb-4 font-semibold text-[#272727]">
            Danh sách hộ dân
          </div>
          <Tabs
            defaultActiveKey="all"
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "all",
                label: (
                  <span className="text-[16px] font-medium">
                    Danh sách thông tin liên hệ
                  </span>
                ),
                children: (
                  <div>
                    {/* Header */}
                    <div className="mb-4 flex flex-wrap items-center justify-end gap-2 mt-4">
                      <div className="flex gap-2 justify-end">
                        {(user?.role?.roleCode === Role.MANAGER ||
                          user?.role?.roleCode === Role.ADMIN) && (
                          <>
                            <Button
                              onClick={handleExportExcel}
                              className="fd-btn-outline-green"
                            >
                              <FileSpreadsheet size={16} /> Xuất Excel
                            </Button>
                            <Button
                              onClick={handleExportWord}
                              className="fd-btn-outline-blue"
                            >
                              <FileText size={16} /> Xuất Word
                            </Button>
                            <Button
                              onClick={() =>
                                navigate("/app/residents-manager/import-excel")
                              }
                              className="fd-btn-warning"
                            >
                              <FileSpreadsheet size={16} /> Nhập Excel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Smart Filter Bar */}
                    <div className="mb-4">
                      <ResidentFilter
                        onFilter={handleFilter}
                        onRefresh={() => {
                          if (activeTab === "all") {
                            refetchContacts();
                          } else {
                            refetch();
                          }
                        }}
                        loading={activeTab === "all" ? isContactsLoading : isLoading}
                      />
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
                      <Table
                        loading={activeTab === "all" ? isContactsLoading : isLoading}
                        dataSource={activeTab === "all" ? (contactData?.data || []) : (ListResidents?.data || [])}
                        columns={columns as ColumnType<any>[]}
                        rowKey="id"
                        scroll={{ x: 1000 }}
                        locale={{
                          emptyText: (
                            <Empty
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                              description="Không có dữ liệu"
                            />
                          ),
                        }}
                        onRow={(record) => ({
                          onDoubleClick: () => {
                            if (activeTab !== "all") {
                              navigate(`/app/residents-manager/detail/${record?.id}`);
                            }
                          }
                        })}
                        pagination={{
                          current: page,
                          pageSize: limit,
                          total: activeTab === "all" ? (contactData?.meta?.total || 0) : (ListResidents?.meta?.total || 0),
                          showSizeChanger: true,
                          showTotal: (t) => (
                            <span className="text-slate-500 text-sm">
                              Tổng <b>{t}</b> {activeTab === "all" ? "thông tin liên hệ" : "hộ dân"}
                            </span>
                          ),
                          pageSizeOptions: ["10", "20", "50", "100"],
                          onChange: handlePaginationChange,
                        }}
                        className={styles?.customTable}
                      />
                    </div>
                  </div>
                ),
              },
              {
                key: "with_account",
                label: (
                  <span className="text-[16px] font-medium">
                    Hộ dân có tài khoản
                  </span>
                ),
                children: (
                  <ResidentWithAccountTab
                    user={user}
                    setIsOpenModalDelete={setIsOpenModalDelete}
                    setId={setId}
                  />
                ),
              },
              {
                key: "pending_approval",
                label: (
                  <span className="text-[16px] font-medium">
                    Duyệt tài khoản
                  </span>
                ),
                children: (
                  <ResidentPendingApprovalTab refetchMain={() => refetch()} />
                ),
              },
              {
                key: "rejected",
                label: (
                  <span className="text-[16px] font-medium">Danh sách hủy</span>
                ),
                children: <ResidentRejectedTab refetchMain={() => refetch()} />,
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}
