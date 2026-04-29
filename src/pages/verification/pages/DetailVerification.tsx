import { useQuery } from "@tanstack/react-query";
import { Button, Card, Descriptions, Divider, Spin, Tag, message } from "antd";
import {
    ArrowLeft,
    CheckCircle,
    Clock,
    User,
    XCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getVerificationDetailApi, updateVerificationApi } from "../api";
import { VerificationStatus } from "../interfaces";

export default function DetailVerification() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: verification, isLoading, refetch } = useQuery({
    queryKey: ["verification", id],
    queryFn: () => getVerificationDetailApi(Number(id)),
    enabled: !!id,
  });

  const handleVerify = async (status: VerificationStatus) => {
    if (!id) return;
    try {
      setIsUpdating(true);
      await updateVerificationApi(Number(id), { status });
      message.success(status === VerificationStatus.APPROVED ? "Đã duyệt yêu cầu!" : "Đã từ chối yêu cầu!");
      refetch();
    } catch {
      message.error("Thao tác thất bại");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;
  if (!verification?.data) return <div>Không tìm thấy dữ liệu</div>;

  const data = verification.data;

  const getStatusTag = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.PENDING: return <Tag color="orange" icon={<Clock size={12} />}>Chờ duyệt</Tag>;
      case VerificationStatus.APPROVED: return <Tag color="green" icon={<CheckCircle size={12} />}>Đã duyệt</Tag>;
      case VerificationStatus.REJECTED: return <Tag color="red" icon={<XCircle size={12} />}>Từ chối</Tag>;
      default: return <Tag>Mới</Tag>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button 
        type="text" 
        icon={<ArrowLeft size={18} />} 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition"
      >
        Quay lại danh sách
      </Button>

      <Card className="rounded-2xl shadow-sm border-slate-100 overflow-hidden">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{data.title}</h1>
            <p className="text-slate-500 font-mono mt-1">Mã xác thực: <span className="text-blue-600 font-bold">{data.code}</span></p>
          </div>
          {getStatusTag(data.status)}
        </div>

        <Descriptions bordered column={2} className="bg-slate-50/50">
          <Descriptions.Item label="Người gửi" span={1}>
            <div className="flex items-center gap-2">
              <User size={14} className="text-slate-400" />
              {data.user?.fullName}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại" span={1}>
            {data.user?.phoneNumber}
          </Descriptions.Item>
          <Descriptions.Item label="Loại yêu cầu" span={1}>
            <Tag color="blue">{data.verificationType}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày gửi" span={1}>
            {new Date(data.createdAt).toLocaleString("vi-VN")}
          </Descriptions.Item>
        </Descriptions>

        <Divider titlePlacement="left">Nội dung chi tiết</Divider>
        <div className="p-4 bg-slate-50 rounded-xl text-slate-700 leading-relaxed whitespace-pre-wrap">
          {data.description}
        </div>

        {data.attachments && data.attachments.length > 0 && (
          <>
            <Divider titlePlacement="left">Tài liệu đính kèm</Divider>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {data.attachments.map((url, i) => (
                <img key={i} src={url} alt="attachment" className="w-full h-48 object-cover rounded-xl border border-slate-100 shadow-sm" />
              ))}
            </div>
          </>
        )}

        {data.status === VerificationStatus.PENDING && (
          <div className="mt-10 flex justify-end gap-3 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Button size="large" danger onClick={() => handleVerify(VerificationStatus.REJECTED)} loading={isUpdating}>
              Từ chối yêu cầu
            </Button>
            <Button size="large" type="primary" onClick={() => handleVerify(VerificationStatus.APPROVED)} loading={isUpdating}>
              Phê duyệt xác thực
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
