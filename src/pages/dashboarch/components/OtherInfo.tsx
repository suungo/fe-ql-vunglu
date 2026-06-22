import { Button, Card, Tag, Typography } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  MapPin,
  Phone,
  PhoneCall,
  Shield,
  Stethoscope,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";

const { Text, Title, Paragraph } = Typography;

// Định nghĩa các loại danh mục
type CategoryType =
  | "safe_points"
  | "garbage_points"
  | "medical_stations"
  | "emergency_hotlines"
  | "flood_guide";

interface DetailItem {
  id: number;
  title: string;
  address?: string;
  phone?: string;
  description?: string;
  status?: string;
  distance?: string;
}

// Dữ liệu mẫu
const categories = [
  {
    id: "safe_points",
    title: "Điểm an toàn / Tránh ngập",
    icon: <Shield size={24} className="text-green-500" />,
    color: "bg-green-50",
    description:
      "Các địa điểm cao ráo, trường học, trung tâm cộng đồng có thể tránh trú tạm thời.",
  },
  {
    id: "garbage_points",
    title: "Điểm tập kết rác",
    icon: <Trash2 size={24} className="text-orange-500" />,
    color: "bg-orange-50",
    description:
      "Vị trí các điểm tập kết rác tạm thời để tránh tắc nghẽn dòng chảy.",
  },
  {
    id: "medical_stations",
    title: "Trạm y tế gần nhất",
    icon: <Stethoscope size={24} className="text-blue-500" />,
    color: "bg-blue-50",
    description:
      "Danh sách các trạm y tế, bệnh viện gần khu vực đang theo dõi.",
  },
  {
    id: "emergency_hotlines",
    title: "Số điện thoại khẩn cấp",
    icon: <PhoneCall size={24} className="text-red-500" />,
    color: "bg-red-50",
    description: "Các đầu số nóng hỗ trợ cứu hộ, cứu nạn và báo cáo sự cố.",
  },
  {
    id: "flood_guide",
    title: "Hướng dẫn ứng phó",
    icon: <BookOpen size={24} className="text-purple-500" />,
    color: "bg-purple-50",
    description:
      "Các kỹ năng và hướng dẫn cần thiết khi gặp tình trạng ngập lụt.",
  },
];

const detailData: Record<CategoryType, DetailItem[]> = {
  safe_points: [
    {
      id: 1,
      title: "Trường THPT Võ Thị Sáu",
      address: "95 Đinh Tiên Hoàng, P.3, Bình Thạnh",
      distance: "0.5km",
      status: "Mở cửa",
    },
    {
      id: 2,
      title: "Nhà văn hóa Thanh Niên",
      address: "4 Phạm Ngọc Thạch, Bến Nghé, Q.1",
      distance: "1.2km",
      status: "Mở cửa",
    },
    {
      id: 3,
      title: "UBND Phường 15",
      address: "Điện Biên Phủ, Bình Thạnh",
      distance: "0.8km",
      status: "Sẵn sàng",
    },
    {
      id: 4,
      title: "Trường ĐH HUTECH (Cơ sở E)",
      address: "Khu công nghệ cao, TP. Thủ Đức",
      distance: "3.5km",
      status: "Mở cửa",
    },
    {
      id: 5,
      title: "Trung tâm TDTT Quận 7",
      address: "Huỳnh Tấn Phát, Quận 7",
      distance: "5.0km",
      status: "Sẵn sàng",
    },
  ],
  garbage_points: [
    {
      id: 1,
      title: "Điểm tập kết số 1",
      address: "Góc đường D2 - Điện Biên Phủ",
      description: "Thu gom rác cồng kềnh, khơi thông dòng chảy.",
    },
    {
      id: 2,
      title: "Điểm tập kết chân cầu Sài Gòn",
      address: "Dưới gầm cầu Sài Gòn, phía Bình Thạnh",
      description: "Xe rác hoạt động 24/24.",
    },
    {
      id: 3,
      title: "Trạm trung chuyển rác Đa Phước",
      address: "Quốc lộ 50, Bình Chánh",
      description: "Khu vực xử lý chính.",
    },
    {
      id: 4,
      title: "Điểm thu gom tạm thời Q.4",
      address: "Đường Tôn Thất Thuyết",
      description: "Ưu tiên rác thải nhựa làm tắc cống.",
    },
    {
      id: 5,
      title: "Điểm tập kết ngã 4 Hàng Xanh",
      address: "Gần trạm xe buýt",
      description: "Hoạt động sau 22h.",
    },
  ],
  medical_stations: [
    {
      id: 1,
      title: "Bệnh viện Gia Định",
      address: "1 Nơ Trang Long, P.7, Bình Thạnh",
      phone: "028 3841 2692",
      distance: "1.0km",
    },
    {
      id: 2,
      title: "Bệnh viện Quận Bình Thạnh",
      address: "112AB Đinh Tiên Hoàng, P.1, Bình Thạnh",
      phone: "028 3510 8966",
      distance: "0.8km",
    },
    {
      id: 3,
      title: "Trạm y tế Phường 25",
      address: "Ung Văn Khiêm, P.25, Bình Thạnh",
      phone: "028 3899 1234",
      distance: "0.3km",
    },
    {
      id: 4,
      title: "Bệnh viện Vinmec Central Park",
      address: "208 Nguyễn Hữu Cảnh, P.22, Bình Thạnh",
      phone: "028 3622 1166",
      distance: "1.5km",
    },
    {
      id: 5,
      title: "Phòng khám Đa khoa Quốc tế",
      address: "Điện Biên Phủ, Q.3",
      phone: "028 3933 6688",
      distance: "2.0km",
    },
  ],
  emergency_hotlines: [
    {
      id: 1,
      title: "Cứu hỏa - Cứu nạn",
      phone: "114",
      description:
        "Gọi ngay khi có hỏa hoạn hoặc người mắc kẹt trong vùng ngập sâu.",
    },
    {
      id: 2,
      title: "Cấp cứu y tế",
      phone: "115",
      description:
        "Gọi khi có người bị thương, đuối nước hoặc vấn đề sức khỏe khẩn cấp.",
    },
    {
      id: 3,
      title: "Cảnh sát phản ứng nhanh",
      phone: "113",
      description: "Báo cáo tai nạn giao thông, mất an ninh trật tự.",
    },
    {
      id: 4,
      title: "Tổng đài chống ngập (UDI)",
      phone: "1900 54 54 54",
      description: "Báo cáo điểm ngập, sự cố thoát nước.",
    },
    {
      id: 5,
      title: "Tổng đài điện lực",
      phone: "1900 54 54 54",
      description: "Báo sự cố rò rỉ điện, cây ngã đổ vào đường dây.",
    },
    {
      id: 6,
      title: "Hỗ trợ giao thông (VOV)",
      phone: "028 3910 4866",
      description: "Cập nhật tình hình giao thông, kẹt xe.",
    },
  ],
  flood_guide: [
    {
      id: 1,
      title: "Khi thấy nước dâng cao",
      description:
        "Ngắt nguồn điện, kê cao đồ đạc, chuẩn bị túi thuốc và lương thực khô.",
    },
    {
      id: 2,
      title: "Khi di chuyển qua vùng ngập",
      description:
        "Đi số thấp, giữ đều ga, không đi sát lề đường để tránh hố ga mất nắp.",
    },
    {
      id: 3,
      title: "Nếu xe bị chết máy",
      description:
        "Không cố khởi động lại (tránh thủy kích), dắt bộ đến nơi cao ráo.",
    },
    {
      id: 4,
      title: "Sau khi nước rút",
      description:
        "Vệ sinh nhà cửa bằng Cloramin B, kiểm tra lại hệ thống điện trước khi bật.",
    },
    {
      id: 5,
      title: "Phòng tránh dịch bệnh",
      description:
        "Ăn chín uống sôi, không sử dụng nước ngập để sinh hoạt, rửa tay thường xuyên.",
    },
  ],
};

const containerVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
  exit: { opacity: 0, x: 20 },
};

const OtherInfo: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryType | null>(
    null,
  );

  const handleCategoryClick = (id: string) => {
    setActiveCategory(id as CategoryType);
  };

  const handleBack = () => {
    setActiveCategory(null);
  };

  const renderDetailItem = (item: DetailItem) => {
    if (activeCategory === "safe_points") {
      return (
        <Card
          size="small"
          className="mb-2 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <Text strong className="text-base">
                {item.title}
              </Text>
              <div className="flex items-center text-slate-500 text-sm mt-1">
                <MapPin size={14} className="mr-1" /> {item.address}
              </div>
            </div>
            <Tag color="success">{item.status}</Tag>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center">
            <NavigationIcon className="mr-1 w-3 h-3" /> Cách đây {item.distance}
          </div>
        </Card>
      );
    }

    if (activeCategory === "medical_stations") {
      return (
        <Card
          size="small"
          className="mb-2 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <Text strong className="text-base">
                {item.title}
              </Text>
              <div className="flex items-center text-slate-500 text-sm mt-1">
                <MapPin size={14} className="mr-1" /> {item.address}
              </div>
              <div className="flex items-center text-blue-600 font-medium text-sm mt-1">
                <Phone size={14} className="mr-1" /> {item.phone}
              </div>
            </div>
            <Tag color="blue">{item.distance}</Tag>
          </div>
        </Card>
      );
    }

    if (activeCategory === "emergency_hotlines") {
      return (
        <Card
          size="small"
          className="mb-2 shadow-sm border-l-4 border-l-red-500"
        >
          <div className="flex justify-between items-center">
            <div>
              <Text strong className="text-lg text-red-600 block">
                {item.phone}
              </Text>
              <Text strong className="text-slate-700">
                {item.title}
              </Text>
              <Paragraph className="text-slate-500 text-sm m-0 mt-1">
                {item.description}
              </Paragraph>
            </div>
            <Button
              type="primary"
              danger
              shape="circle"
              icon={<Phone size={16} />}
            />
          </div>
        </Card>
      );
    }

    // Default for garbage_points and flood_guide
    return (
      <Card size="small" className="mb-2 shadow-sm bg-slate-50">
        <Text strong className="text-base block mb-1">
          {item.title}
        </Text>
        {item.address && (
          <div className="flex items-center text-slate-500 text-sm mb-2">
            <MapPin size={14} className="mr-1" /> {item.address}
          </div>
        )}
        <Paragraph className="text-slate-600 m-0 text-sm">
          {item.description}
        </Paragraph>
      </Card>
    );
  };

  // Helper icon component since Navigation is not exported from lucide-react directly sometimes or conflicts
  const NavigationIcon = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );

  return (
    <div className="h-[450px] overflow-hidden relative">
      <AnimatePresence mode="wait">
        {!activeCategory ? (
          <motion.div
            key="menu"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="h-full overflow-y-auto pr-2"
          >
            <div className="grid grid-cols-1 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`p-4 rounded-xl cursor-pointer border border-slate-100 hover:shadow-md transition-all flex items-center justify-between group ${cat.color}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                      {cat.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 m-0">
                        {cat.title}
                      </h4>
                      <p className="text-slate-500 text-xs m-0 mt-1 line-clamp-1">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="h-full flex flex-col"
          >
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <Button
                icon={<ArrowLeft size={16} />}
                type="text"
                onClick={handleBack}
                className="hover:bg-slate-100"
              />
              <Title level={5} className="m-0! text-slate-700">
                {categories.find((c) => c.id === activeCategory)?.title}
              </Title>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 pb-4">
              {detailData[activeCategory].map((item) => (
                <div key={item.id}>{renderDetailItem(item)}</div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OtherInfo;
