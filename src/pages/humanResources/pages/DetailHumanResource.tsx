import { Gender } from "@/enums";
import { Button, Card, Descriptions, Empty, Spin, Table, Tabs, Tag, Timeline } from "antd";
import dayjs from "dayjs";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { HumanResourcesPosition, HumanResourcesStatus } from "../enum";
import { useHumanResourceDetail, useHRVerificationHistory } from "../hooks";
import type { VerificationHistoryItem } from "../api";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

const positionLabel: Record<string, string> = {
  OFFICER: 'Cán bộ tăng cường (Công an cấp xã)',
  STAFF: 'Nhân viên y tế',
  POSTOFFICER: 'Cán bộ hậu kiểm',
  ELECTRICITYSTAFF: 'Nhân viên điện lực',
  LEADER: 'Quản lý khu phố',
};

export default function DetailHumanResource() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: DataHumanResource, isLoading } = useHumanResourceDetail(
    Number(id),
  );
  const humanResource = DataHumanResource?.data;

  const { data: verificationHistory, isLoading: historyLoading } = useHRVerificationHistory(
    humanResource?.employeeCode
  );

  if (isLoading) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!humanResource) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-10">
        <p className="text-lg text-gray-500">
          Không tìm thấy thông tin nhân sự
        </p>
        <Button onClick={() => navigate(-1)} icon={<ArrowLeft size={16} />}>
          Quay lại
        </Button>
      </div>
    );
  }

  const renderStatus = (status: string) => {
    switch (status) {
      case HumanResourcesStatus.ACTIVE:
        return (
          <span className="font-medium text-[#008000]">Đang làm việc</span>
        );
      case HumanResourcesStatus.INACTIVE:
        return (
          <span className="font-medium text-[#D32F2F]">Dừng làm việc</span>
        );
      case HumanResourcesStatus.PENDING:
        return (
          <span className="font-medium text-[#431cf3]">Chưa làm việc</span>
        );
      default:
        return (
          <span className="font-medium text-[#431cf3]">Chưa làm việc</span>
        );
    }
  };

  const renderPosition = (position: string) => {
    switch (position) {
      case HumanResourcesPosition.OFFICER:
        return "Cán bộ tăng cường";
      case HumanResourcesPosition.STAFF:
        return "Nhân viên y tế";
      case HumanResourcesPosition.POSTOFFICER:
        return "Cán bộ hậu kiểm";
      case HumanResourcesPosition.ELECTRICITYSTAFF:
        return "Nhân viên điện lực";
      case HumanResourcesPosition.PATROL:
        return "Cán bộ tuần tra";
      default:
        return "Chưa có dữ liệu";
    }
  };

  const historyColumns = [
    {
      title: 'Mã hồ sơ',
      dataIndex: 'id',
      key: 'id',
      render: (val: number) => <span className="text-gray-400 text-xs">#{val}</span>,
      width: 80,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (status === 'APPROVED') return <Tag icon={<CheckCircleOutlined />} color="success">Đã duyệt</Tag>;
        if (status === 'REJECTED') return <Tag icon={<CloseCircleOutlined />} color="error">Từ chối</Tag>;
        return <Tag icon={<ClockCircleOutlined />} color="warning">Chờ duyệt</Tag>;
      },
    },
    {
      title: 'Bên xác thực',
      key: 'verifier',
      render: () => (
        <span className="text-blue-600 font-medium">Hệ thống xác thực nhân sự</span>
      ),
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'createDate',
      key: 'createDate',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: 'Ngày xử lý',
      dataIndex: 'updateDate',
      key: 'updateDate',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: 'Lý do từ chối',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => reason
        ? <span className="text-red-500 text-sm">{reason}</span>
        : <span className="text-gray-300">—</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/80 p-4 shadow-[0_20px_80px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <Button
            type="text"
            icon={<ArrowLeft size={24} />}
            onClick={() => navigate(-1)}
            className="flex items-center justify-center text-slate-700 hover:text-slate-900"
          />
          <h2 className="text-[22px] md:text-[24px] font-semibold text-[#272727] m-0">
            Chi tiết nhân sự
          </h2>
        </div>

        <Tabs
          defaultActiveKey="info"
          items={[
            {
              key: 'info',
              label: '📋 Thông tin nhân sự',
              children: (
                <Card bordered={false} className="shadow-sm rounded-xl overflow-hidden">
                  <Descriptions
                    bordered
                    column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                    labelStyle={{
                      fontWeight: "500",
                      width: "200px",
                      backgroundColor: "#f8fafc",
                      color: "#64748b",
                    }}
                    contentStyle={{
                      color: "#334155",
                      fontSize: "15px",
                    }}
                  >
                    <Descriptions.Item label="Mã nhân sự">
                      <span className="font-medium text-[#0f172a]">
                        {humanResource.employeeCode}
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Tên nhân sự">
                      <span className="font-medium text-[#0f172a]">
                        {humanResource.fullName}
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {humanResource.email || "Chưa có dữ liệu"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">
                      {humanResource.phoneNumber || "Chưa có dữ liệu"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày sinh">
                      {humanResource.dateBirth
                        ? dayjs(humanResource.dateBirth).format("DD/MM/YYYY")
                        : "Chưa có dữ liệu"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Giới tính">
                      {humanResource.gender === Gender.MALE ? "Nam" : "Nữ"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Chức vụ">
                      {renderPosition(humanResource.position)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      {renderStatus(humanResource.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ" span={2}>
                      {humanResource.address || "Chưa có dữ liệu"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mô tả" span={2}>
                      {humanResource.notes || (
                        <span className="italic text-gray-400">Không có mô tả</span>
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              ),
            },
            {
              key: 'verification-history',
              label: (
                <span className="flex items-center gap-1">
                  🔐 Lịch sử xác thực
                  {verificationHistory?.total ? (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-semibold">
                      {verificationHistory.total}
                    </span>
                  ) : null}
                </span>
              ),
              children: (
                <div className="space-y-4">
                  {historyLoading ? (
                    <div className="flex justify-center py-8">
                      <Spin tip="Đang tải lịch sử xác thực..." />
                    </div>
                  ) : !verificationHistory?.data?.length ? (
                    <Empty
                      description="Chưa có lịch sử xác thực nào cho nhân sự này"
                      className="py-8"
                    />
                  ) : (
                    <>
                      {/* Timeline view cho các mục gần nhất */}
                      <Card
                        size="small"
                        title="Dòng thời gian xác thực"
                        style={{ borderRadius: 12 }}
                      >
                        <Timeline
                          items={(verificationHistory.data).slice(0, 5).map((item: VerificationHistoryItem) => ({
                            color: item.status === 'APPROVED' ? 'green' : item.status === 'REJECTED' ? 'red' : 'orange',
                            dot: item.status === 'APPROVED'
                              ? <CheckCircleOutlined />
                              : item.status === 'REJECTED'
                                ? <CloseCircleOutlined />
                                : <ClockCircleOutlined />,
                            children: (
                              <div>
                                <div className="flex items-center gap-2">
                                  {item.status === 'APPROVED'
                                    ? <Tag color="success" icon={<CheckCircleOutlined />}>Đã duyệt</Tag>
                                    : item.status === 'REJECTED'
                                      ? <Tag color="error" icon={<CloseCircleOutlined />}>Từ chối</Tag>
                                      : <Tag color="warning" icon={<ClockCircleOutlined />}>Chờ duyệt</Tag>
                                  }
                                  <span className="text-blue-600 text-sm font-medium">Hệ thống xác thực nhân sự</span>
                                </div>
                                {item.reason && (
                                  <div className="mt-1 text-sm text-red-500">Lý do: {item.reason}</div>
                                )}
                                <div className="text-xs text-gray-400 mt-1">
                                  <CalendarOutlined className="mr-1" />
                                  Gửi: {dayjs(item.createDate).format('HH:mm DD/MM/YYYY')}
                                  {item.updateDate && ` • Xử lý: ${dayjs(item.updateDate).format('HH:mm DD/MM/YYYY')}`}
                                </div>
                              </div>
                            ),
                          }))}
                        />
                      </Card>

                      {/* Full table */}
                      <Card
                        size="small"
                        title={`Tất cả lịch sử (${verificationHistory.total} lần)`}
                        style={{ borderRadius: 12 }}
                      >
                        <Table
                          dataSource={verificationHistory.data}
                          columns={historyColumns}
                          rowKey="id"
                          size="small"
                          pagination={{ pageSize: 5 }}
                          bordered
                        />
                      </Card>
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
