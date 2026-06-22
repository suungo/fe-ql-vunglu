import { useState, useEffect } from "react";
import { notification } from "antd";
import type { FormInstance } from "antd";
import { getReputationUsers, updateReputationPoints } from "../api/reputationApi";

export interface UserReputation {
  id: number;
  fullName: string;
  phoneNumber: string;
  email?: string;
  gender: string;
  reputationPoints: number;
  role?: {
    roleName: string;
    roleCode: string;
  };
}

export const useReputationData = (form: FormInstance) => {
  const [users, setUsers] = useState<UserReputation[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserReputation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getReputationUsers(page, limit, keyword);
      if (res.data?.statusCode === 200) {
        setUsers(res.data?.data || []);
        setTotal(res.data?.meta?.total || 0);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách người dùng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(handler);
  }, [page, limit, keyword]);

  const handleUpdate = async () => {
    if (!selectedUser) return;
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      const res = await updateReputationPoints(selectedUser.id, values.reputationPoints, values.reason);
      if (res.data?.statusCode === 200) {
        notification.success({
          title: "Cập nhật thành công",
          description: `Đã điều chỉnh điểm uy tín của ${selectedUser.fullName} thành ${values.reputationPoints}/10`,
        });
        setIsModalOpen(false);
        setSelectedUser(null);
        form.resetFields();
        fetchUsers();
      }
    } catch (err: any) {
      notification.error({
        title: "Cập nhật thất bại",
        description: err?.response?.data?.message || "Đã có lỗi xảy ra.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    users,
    loading,
    page,
    setPage,
    limit,
    setLimit,
    total,
    keyword,
    setKeyword,
    isModalOpen,
    setIsModalOpen,
    selectedUser,
    setSelectedUser,
    isSubmitting,
    handleUpdate,
    fetchUsers,
  };
};
