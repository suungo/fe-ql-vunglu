import useStyle from "@/interfaces/useStyle";
import "../../floodDamages/styles/floodDamages.css";
import { Button, Dropdown, Empty, Table, Tag } from "antd";
import type { ColumnType } from "antd/es/table";
import {
  EllipsisVertical,
  Eye,
  Pencil,
  Trash,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import ResidentFilter, { type ResidentFilterParams } from "./ResidentFilter";

interface Props {
  user: any;
  setIsOpenModalDelete: (open: boolean) => void;
  setId: (id: number | null) => void;
  refetchMain?: () => void;
}

export default function ResidentWithAccountTab({
  user,
  setIsOpenModalDelete,
  setId,
}: Props) {
  const navigate = useNavigate();
  const { styles } = useStyle();

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [filterParams, setFilterParams] = useState<ResidentFilterParams>({});

  const {
    data: listResidents,
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
    hasAccount: true,
  });

  const handleFilter = (params: ResidentFilterParams) => {
    setFilterParams(params);
    setPage(1);
  };

  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setLimit(newPageSize);
  };

  const HEADER_MAP = {
    residentCode: "Mã hộ dân",
    fullName: "Tên chủ hộ",
    phoneNumber: "Số điện thoại",
    email: "Email",
    address: "Địa chỉ",
    numberOfMembers: "Số TV",
    hasElderly: "Người già",
    hasChildren: "Trẻ em",
    hasPregnantWomen: "PN mang thai",
    hasChronicDisease: "Bệnh nền",
    houseType: "Loại nhà",
    numberOfFloors: "Số tầng",
    hasBusiness: "Kinh doanh",
  };

  const WORD_COL_WIDTHS = {
    residentCode: 60,
    fullName: 80,
    phoneNumber: 65,
    email: 100,
    address: 120,
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
    if (!listResidents?.data || listResidents.data.length === 0) return;
    const dataToExport = formatExportData(listResidents.data);
    exportToExcel(dataToExport, "Hộ_Dân_Có_Tài_Khoản", HEADER_MAP);
  };

  const handleExportWord = () => {
    if (!listResidents?.data || listResidents.data.length === 0) return;
    const dataToExport = formatExportData(listResidents.data);
    exportToWord(
      dataToExport,
      "Hộ_Dân_Có_Tài_Khoản",
      HEADER_MAP,
      "DANH SÁCH HỘ DÂN CÓ TÀI KHOẢN",
      WORD_COL_WIDTHS,
    );
  };

  const columns: ColumnType<Resident>[] = [
    {
      width: 120,
      title: <span className="text-[#ACACAC] text-[14px]">Mã hộ dân</span>,
      dataIndex: "residentCode",
      key: "residentCode",
      render: (text: string) => (
        <span className="text-slate-800 text-[14px] font-semibold">{text}</span>
      ),
    },
    {
      width: 180,
      title: <span className="text-[#ACACAC] text-[14px]">Họ tên chủ hộ</span>,
      key: "fullName",
      render: (_, record: Resident) => (
        <span className="text-slate-800 text-[14px] font-medium">
          {record.user?.fullName || "—"}
        </span>
      ),
    },
    {
      width: 140,
      title: <span className="text-[#ACACAC] text-[14px]">Số điện thoại</span>,
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      render: (text: string) => (
        <span className="text-slate-800 text-[14px]">{text || "—"}</span>
      ),
    },
    {
      width: 180,
      title: <span className="text-[#ACACAC] text-[14px]">Email</span>,
      dataIndex: "email",
      key: "email",
      render: (text: string) => (
        <span className="text-slate-800 text-[14px]">{text || "—"}</span>
      ),
    },
    {
      width: 250,
      title: <span className="text-[#ACACAC] text-[14px]">Địa chỉ</span>,
      dataIndex: "address",
      key: "address",
      render: (text: string) => (
        <span className="text-slate-800 text-[14px]">{text || "—"}</span>
      ),
    },
    {
      width: 140,
      title: <span className="text-[#ACACAC] text-[14px]">Loại nhà</span>,
      dataIndex: "houseType",
      key: "houseType",
      render: (text: HouseType) => (
        <span className="text-slate-800 text-[14px]">
          {HouseTypeLabel[text] || text || "—"}
        </span>
      ),
    },
    {
      width: 120,
      title: <span className="text-[#ACACAC] text-[14px]">Số thành viên</span>,
      dataIndex: "numberOfMembers",
      key: "numberOfMembers",
      render: (text: number) => (
        <span className="text-slate-800 text-[14px]">{text ?? "—"}</span>
      ),
    },
    {
      width: 110,
      title: <span className="text-[#ACACAC] text-[14px]">Người già</span>,
      dataIndex: "hasElderly",
      key: "hasElderly",
      render: (text: HasElderly) => (
        <Tag color={text === HasElderly.YES ? "green" : "default"}>
          {text === HasElderly.YES ? "Có" : "Không"}
        </Tag>
      ),
    },
    {
      width: 110,
      title: <span className="text-[#ACACAC] text-[14px]">Trẻ em</span>,
      dataIndex: "hasChildren",
      key: "hasChildren",
      render: (text: HasChildren) => (
        <Tag color={text === HasChildren.YES ? "green" : "default"}>
          {text === HasChildren.YES ? "Có" : "Không"}
        </Tag>
      ),
    },
    {
      width: 130,
      title: <span className="text-[#ACACAC] text-[14px]">PN mang thai</span>,
      dataIndex: "hasPregnantWomen",
      key: "hasPregnantWomen",
      render: (text: HasPregnant) => (
        <Tag color={text === HasPregnant.YES ? "green" : "default"}>
          {text === HasPregnant.YES ? "Có" : "Không"}
        </Tag>
      ),
    },
    {
      width: 110,
      title: <span className="text-[#ACACAC] text-[14px]">Bệnh nền</span>,
      dataIndex: "hasChronicDisease",
      key: "hasChronicDisease",
      render: (text: HasSick) => (
        <Tag color={text === HasSick.YES ? "green" : "default"}>
          {text === HasSick.YES ? "Có" : "Không"}
        </Tag>
      ),
    },
    {
      width: 120,
      title: <span className="text-[#ACACAC] text-[14px]">Kinh doanh</span>,
      dataIndex: "hasBusiness",
      key: "hasBusiness",
      render: (text: HasBusiness) => (
        <Tag color={text === HasBusiness.YES ? "green" : "default"}>
          {text === HasBusiness.YES ? "Có" : "Không"}
        </Tag>
      ),
    },
    {
      width: 120,
      fixed: "right",
      title: (
        <span className="text-[#ACACAC] text-[14px] flex justify-center">
          Hành động
        </span>
      ),
      key: "actions",
      render: (_, record: Resident) => (
        <div className="flex justify-center">
          <Dropdown
            menu={{
              items: [
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
                            className="text-blue-500 text-[14px] cursor-pointer flex items-center gap-2"
                          >
                            <Pencil size={14} /> Sửa
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
                            className="text-red-500 text-[14px] cursor-pointer flex items-center gap-2"
                          >
                            <Trash size={14} /> Xóa
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
                      className="text-slate-800 text-[14px] cursor-pointer flex items-center gap-2"
                    >
                      <Eye size={14} /> Chi tiết
                    </span>
                  ),
                },
              ],
            }}
            placement="bottom"
            arrow
          >
            <EllipsisVertical size={18} className="cursor-pointer" />
          </Dropdown>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {(user?.role?.roleCode === Role.MANAGER ||
          user?.role?.roleCode === Role.ADMIN) && (
          <div className="flex gap-2">
            <Button
              onClick={handleExportExcel}
              className="fd-btn-outline-green"
            >
              <FileSpreadsheet size={14} /> Xuất Excel
            </Button>
            <Button onClick={handleExportWord} className="fd-btn-outline-blue">
              <FileText size={14} /> Xuất Word
            </Button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <ResidentFilter
          onFilter={handleFilter}
          onRefresh={() => refetch()}
          loading={isLoading}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
        <Table
          loading={isLoading}
          dataSource={listResidents?.data || []}
          columns={columns as ColumnType<Resident>[]}
          rowKey="id"
          scroll={{ x: 1100 }}
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
            total: listResidents?.meta?.total || 0,
            showSizeChanger: true,
            showTotal: (t) => (
              <span className="text-slate-500 text-sm">
                Tổng <b>{t}</b> hộ dân có tài khoản
              </span>
            ),
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: handlePaginationChange,
          }}
          className={styles?.customTable}
        />
      </div>
    </div>
  );
}
