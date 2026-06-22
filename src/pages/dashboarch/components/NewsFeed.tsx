import {
  Avatar,
  Button,
  Col,
  Image,
  Input,
  Modal,
  Row,
  Spin,
  Statistic,
  Tag,
  Typography,
  type InputRef,
} from "antd";
import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { ReflectionStatus } from "../../reflection/enum";
import type { Reflection } from "../../reflection/interfaces";
import { useQuery } from "@tanstack/react-query";
import { getProfileApi } from "@/pages/profile/api";
import { Role } from "@/enums";
import {
  toggleLikeApi,
  checkLikedApi,
  getLikeCountApi,
  getCommentsApi,
  createCommentApi,
  getCommentCountApi,
} from "../api/interactionApi";

import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  ShieldCheck,
} from "lucide-react";

const { Text, Paragraph, Title } = Typography;

interface Comment {
  id: number;
  user: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
}

interface User {
  id?: number;
  name: string;
  avatar: string;
  role?: {
    roleName: string;
    roleCode: string;
  };
  reputationPoints?: number;
}

interface NewsItem {
  id: number;
  user: User;
  content: string;
  image?: string;
  location: string;
  status: "approved" | "pending" | "resolved";
  timestamp: string;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
}

const mockUserStats = {
  reports: 15,
  helpful: 42,
  reputation: 98,
};

const getReputationLevel = (points: number) => {
  if (points === 10) return { label: "Xuất sắc", color: "success" };
  if (points >= 8) return { label: "Tốt", color: "processing" };
  if (points >= 5) return { label: "Trung bình", color: "warning" };
  if (points > 0) return { label: "Cảnh cáo", color: "error" };
  return { label: "Tạm khóa", color: "default" };
};

import { UserProfileModal } from "./UserProfileModal";

const obfuscateName = (name?: string) => {
  if (!name) return "Ẩn danh";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return name.charAt(0) + "***";
  return `${parts[0]} *** ${parts[parts.length - 1].charAt(0)}***`;
};

const NewsFeedItem = ({
  item,
  onUserClick,
  canViewProfile,
}: {
  item: NewsItem;
  onUserClick: (user: User) => void;
  canViewProfile: boolean;
}) => {
  const [liked, setLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentInput, setCommentInput] = useState<string>("");
  const inputRef = useRef<InputRef>(null);

  // Fetch số like và trạng thái like khi mount
  useEffect(() => {
    const loadLikes = async () => {
      try {
        const [likedRes, countRes, commentCountRes] = await Promise.all([
          checkLikedApi(item.id).catch(() => null),
          getLikeCountApi(item.id).catch(() => null),
          getCommentCountApi(item.id).catch(() => null),
        ]);
        // checkLiked trả về { liked: boolean } (không có wrapper data)
        if (likedRes?.data?.liked !== undefined)
          setLiked(!!likedRes.data.liked);
        // getLikeCount trả về { statusCode, data: { count } }
        if (countRes?.data?.data?.count !== undefined)
          setLikesCount(Number(countRes.data.data.count) || 0);
        // getCommentCount trả về { statusCode, data: { count } }
        if (commentCountRes?.data?.data?.count !== undefined)
          setCommentCount(Number(commentCountRes.data.data.count) || 0);
      } catch (_) { /* ignore */ }
    };
    loadLikes();
  }, [item.id]);

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const wasLiked = liked;
    // Optimistic update
    setLiked(!wasLiked);
    setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));
    try {
      await toggleLikeApi(item.id);
    } catch (_) {
      // Rollback
      setLiked(wasLiked);
      setLikesCount((prev) => (wasLiked ? prev + 1 : prev - 1));
    } finally {
      setLikeLoading(false);
    }
  };

  const handleToggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      setCommentLoading(true);
      try {
        const res = await getCommentsApi(item.id);
        // getComments trả về { statusCode, data: [...], meta: {...} }
        const data = res?.data?.data || [];
        setComments(
          data.map((c: any) => ({
            id: c.id,
            user: c.user?.fullName || "Người dùng",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user?.id || c.id}`,
            content: c.content,
            timestamp: new Date(c.createdAt).toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            }),
            likes: 0,
            isLiked: false,
          })),
        );
      } catch (_) {
        // ignore fetch error
      } finally {
        setCommentLoading(false);
      }
    }
  };

  const handleReplyComment = (username: string) => {
    setCommentInput(`@${username} `);
    setTimeout(() => {
      inputRef.current?.focus({ cursor: "end" });
    }, 0);
  };

  const handleSendComment = async () => {
    if (!commentInput.trim()) return;
    const content = commentInput.trim();
    setCommentInput("");
    try {
      const res = await createCommentApi(item.id, content);
      // createComment trả về { statusCode: 201, data: commentWithUser }
      const c = res?.data?.data;
      const newComment: Comment = {
        id: c?.id || Date.now(),
        user: c?.user?.fullName || "Tôi",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${c?.user?.id || "me"}`,
        content: c?.content || content,
        timestamp: "Vừa xong",
        likes: 0,
        isLiked: false,
      };
      setComments((prev) => [...prev, newComment]);
      setCommentCount((prev) => prev + 1);
    } catch (_) { /* ignore */ }
  };

  return (
    <div className="bg-white rounded-2xl p-3 md:p-5 mb-4 border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
        <div className="flex gap-3 w-full sm:w-auto">
          <div
            className={`relative group ${canViewProfile ? "cursor-pointer" : ""}`}
            onClick={() => canViewProfile && onUserClick(item.user)}
          >
            <Avatar
              src={item.user.avatar}
              size={48}
              className="border-2 border-white shadow-sm group-hover:border-blue-200 transition-colors"
            />
            {item.user.role && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-white">
                {item.user?.role?.roleName}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Text
                className={`text-sm md:text-[15px] font-bold text-slate-800 whitespace-nowrap transition-colors ${canViewProfile ? "cursor-pointer hover:text-blue-600" : ""}`}
                onClick={() => canViewProfile && onUserClick(item.user)}
              >
                {canViewProfile
                  ? item.user.name
                  : obfuscateName(item.user.name)}
              </Text>
              {item.user.role?.roleCode === "RESIDENT" && (
                <Tag
                  color={
                    getReputationLevel(item.user.reputationPoints ?? 10).color
                  }
                  className="ml-1 text-[11px] font-medium"
                >
                  Uy tín: {item.user.reputationPoints ?? 10}/10 (
                  {getReputationLevel(item.user.reputationPoints ?? 10).label})
                </Tag>
              )}
              <span className="text-slate-300 text-[10px] hidden xs:inline">
                •
              </span>
              <Text className="text-slate-400 text-[10px] md:text-xs font-medium whitespace-nowrap">
                {item.timestamp}
              </Text>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-0.5">
              <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <MapPin size={10} />
              </div>
              {item.location}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-start">
          {item.status === "resolved" ? (
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-semibold border border-emerald-100 whitespace-nowrap">
              <CheckCircle2
                size={10}
                className="md:size-[12px] text-emerald-500"
              />
              Đã xử lý
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-semibold border border-blue-100 whitespace-nowrap">
              <Clock size={10} className="md:size-[12px] text-blue-500" />
              Đã duyệt
            </div>
          )}
        </div>
      </div>

      <Paragraph className="mb-4 text-slate-600 text-[15px] leading-relaxed">
        {item.content}
      </Paragraph>

      {item.image && (
        <div className="mb-4 rounded-2xl overflow-hidden shadow-sm group cursor-pointer relative">
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10" />
          <Image
            src={item.image}
            alt="Report image"
            className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
            style={{ maxHeight: "320px", width: "100%", objectFit: "cover" }}
            preview={{ mask: "Xem ảnh phóng to" }}
          />
        </div>
      )}
    </div>
  );
};

const NewsFeed: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [reflections, setReflections] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await getProfileApi();
      return response?.data;
    },
  });

  const canViewProfile =
    profileData?.role?.roleCode === Role.ADMIN ||
    profileData?.role?.roleCode === Role.MANAGER;

  useEffect(() => {
    const fetchReflections = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        // Sử dụng isMap=true để lấy toàn bộ danh sách phản ánh công khai (đang xử lý/đã xử lý)
        const res = await fetch(
          `http://localhost:3001/api/reports?isMap=true&limit=20`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const json = await res.json();

        if (json.statusCode === 200 && Array.isArray(json.data)) {
          const approvedReflections = json.data.map((r: Reflection) => ({
            id: r.id,
            userId: r.user?.id,
            user: {
              id: r.user?.id,
              name: r.user?.fullName || "Người dùng ẩn danh",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + r.id,
              role: r.user?.role || {
                roleName: "Người dân",
                roleCode: "RESIDENT",
              },
              reputationPoints: r.user?.reputationPoints ?? 10,
            },
            content: r.content,
            image:
              r.imageUrl && r.imageUrl.length > 0 ? r.imageUrl[0] : undefined,
            location: r.address || "Vị trí chưa xác định",
            status:
              r.status === ReflectionStatus.RESOLVED ? "resolved" : "approved",
            timestamp: new Date(r.createdAt).toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            }),
            likes: 0, // DB chưa có table Like
            isLiked: false,
            comments: [], // Mock tạm do DB chưa có table Comment
          }));
          setReflections(approvedReflections);
        }
      } catch (error) {
        console.error("Lỗi khi tải bảng tin:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReflections();
  }, []);

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Spin size="large" />
        <div className="mt-4 text-slate-400">Đang tải bảng tin...</div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <UserProfileModal
        userId={selectedUser?.id ?? null}
        open={!!selectedUser?.id}
        onClose={() => setSelectedUser(null)}
      />

      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 w-1 h-6 rounded-full"></div>
          <Title level={4} className="m-0! text-slate-800">
            Bảng tin phản ánh
          </Title>
        </div>
      </div>

      <div className="space-y-4">
        {reflections.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-200">
            <Text className="text-slate-400 italic">
              Hiện chưa có phản ánh nào được duyệt.
            </Text>
          </div>
        ) : (
          reflections.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <NewsFeedItem
                item={item}
                onUserClick={handleUserClick}
                canViewProfile={canViewProfile}
              />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
