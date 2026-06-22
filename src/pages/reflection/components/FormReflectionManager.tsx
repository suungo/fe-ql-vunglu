import {
  Button,
  Card,
  Form,
  AutoComplete,
  Input,
  Select,
  Tooltip,
  Upload,
  message,
  notification,
  type UploadFile,
} from "antd";
import { LocateFixed, Upload as UploadIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CommonMap } from "@/components/CommonMap";

// Fix Leaflet icon issue
import { formRules } from "@/components/constants";
import { useNavigate, useParams } from "react-router-dom";
import {
  createReflectionApi,
  getReflectionApi,
  updateReflectionApi,
  uploadApi,
  getResolvedReflectionsApi,
} from "../api";
import { Category, EventType, Priority } from "../enum";
import type { CreateReflection, Reflection } from "../interfaces";
import { useQuery } from "@tanstack/react-query";
import { getProfileApi } from "@/pages/profile/api";
import { Role } from "@/enums";

type Props = {
  mode: "add" | "edit";
};

// const { Option } = Select;

const cleanAddress = (addr: string): string => {
  if (!addr) return "";
  return addr
    .replace(/,\s*\d{5,6}\b/g, "") // Xóa mã bưu chính (ví dụ: ", 75350")
    .replace(/,\s*Việt Nam\s*$/gi, "") // Xóa ", Việt Nam" ở cuối
    .replace(/,\s*Viet Nam\s*$/gi, "") // Xóa ", Viet Nam" ở cuối
    .trim();
};

export default function CreateReportPage({ mode }: Props) {
  const { id } = useParams();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [trustScore, setTrustScore] = useState(0);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedOriginalId, setSelectedOriginalId] = useState<number | null>(
    null,
  );
  // Address autocomplete
  const [addressSuggestions, setAddressSuggestions] = useState<
    { value: string; label: string }[]
  >([]);
  const [addressInput, setAddressInput] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lấy thông tin user đăng nhập
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await getProfileApi();
      return response?.data;
    },
  });

  const isManagerOrAdmin =
    profileData?.role?.roleCode === Role.MANAGER ||
    profileData?.role?.roleCode === Role.ADMIN;

  const isManager = profileData?.role?.roleCode === Role.MANAGER;

  const isResident = profileData?.role?.roleCode === Role.RESIDENT;

  const getCleanedAddress = (addr: string): string => {
    if (!addr) return "";
    let cleaned = cleanAddress(addr);
    if (isResident) {
      cleaned = cleaned.replace(
        /(Bưu điện|Bưu cục|Post Office|Postoffice)\s+[^,]+,\s*/gi,
        "",
      );
      cleaned = cleaned.replace(/,\s*(Việt Nam|Viet Nam|VN)\s*$/gi, "");
      cleaned = cleaned.replace(/\b(Việt Nam|Viet Nam|VN)\b/gi, "");
      cleaned = cleaned.replace(/,\s*,/g, ",");
      cleaned = cleaned.replace(/^,\s*/, "");
      cleaned = cleaned.replace(/,\s*$/, "");
    }
    return cleaned.trim();
  };

  // Lấy danh sách phản ánh đã giải quyết (RESOLVED)
  const { data: resolvedReflectionsResponse } = useQuery({
    queryKey: ["resolvedReflections"],
    queryFn: getResolvedReflectionsApi,
    enabled: isManagerOrAdmin && mode === "add",
  });

  const resolvedReflections = (resolvedReflectionsResponse?.data ||
    []) as Reflection[];

  const calculateScore = () => {
    const values = form.getFieldsValue();
    let score = 0;
    if (values.address) score += 10;
    if (location) score += 20;
    if (values.eventType) score += 10;
    if (values.severity) score += 10;
    if (values.description && values.description.length > 10) score += 10;
    if (fileList.length > 0) score += 30;
    setTrustScore(Math.min(score, 100));
  };

  // Debounce Nominatim address search
  const handleAddressInput = (value: string) => {
    setAddressInput(value);
    form.setFieldsValue({ address: value });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value || value.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=6&addressdetails=1&accept-language=vi`,
          { headers: { "Accept-Language": "vi-VN,vi;q=0.9" } },
        );
        const data = await res.json();
        setAddressSuggestions(
          (data as any[]).map((item: any) => {
            const cleaned = getCleanedAddress(item.display_name);
            return {
              value: cleaned,
              label: cleaned,
            };
          }),
        );
      } catch {
        setAddressSuggestions([]);
      }
    }, 500);
  };

  const handleAddressSelect = (value: string) => {
    const cleaned = getCleanedAddress(value);
    setAddressInput(cleaned);
    form.setFieldsValue({ address: cleaned });
    setAddressSuggestions([]);
    // Auto geocode khi chọn gợi ý
    setTimeout(() => fetchCoordinates(), 100);
  };

  useEffect(() => {
    if (mode === "edit" && id && profileData) {
      const fetchDetail = async () => {
        setLoading(true);
        try {
          const res = await getReflectionApi(Number(id));
          if (res.statusCode === 200) {
            const data = res.data as Reflection;

            // Kiểm tra trạng thái phản ánh phải là PENDING
            if (data.status !== "PENDING") {
              notification.error({
                message: "Không thể chỉnh sửa",
                description:
                  "Phản ánh đã được xác minh hoặc xử lý, không thể chỉnh sửa nữa.",
              });
              navigate("/app/reflection-manager/list");
              return;
            }

            // Kiểm tra người chỉnh sửa phải là người đã gửi phản ánh
            const ownerId = (data as any).userId || data.user?.id;
            if (ownerId !== profileData.id) {
              notification.error({
                message: "Không có quyền chỉnh sửa",
                description:
                  "Chỉ người dân gửi phản ánh này mới có quyền chỉnh sửa.",
              });
              navigate("/app/reflection-manager/list");
              return;
            }

            form.setFieldsValue({
              ...data,
              content: data.content,
              description: data.description,
              category: data.category,
              priority: data.priority,
              typeOfIncident: data.typeOfIncident,
              address: data.address,
            });
            setAddressInput(data.address || "");
            setLocation({
              lat: data.lat,
              lng: data.lng,
              address: data.address,
            });
            if (data.imageUrl && data.imageUrl.length > 0) {
              setFileList(
                data.imageUrl.map((url, index) => ({
                  uid: `-${index}`,
                  name: `image-${index}`,
                  status: "done",
                  url: url,
                  thumbUrl: url,
                })),
              );
            }
            calculateScore();
          }
        } catch (error) {
          console.error(error);
          message.error("Lỗi khi tải thông tin phản ánh");
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [mode, id, form, profileData, navigate]);

  const handleValuesChange = () => calculateScore();

  const handleSelectResolved = (value: number | undefined) => {
    if (!value) {
      setSelectedOriginalId(null);
      form.resetFields();
      setLocation(null);
      setFileList([]);
      calculateScore();
      return;
    }

    const original = resolvedReflections.find((r) => r.id === value);
    if (original) {
      setSelectedOriginalId(original.id);
      form.setFieldsValue({
        title: original.title,
        content: original.content,
        category: original.category,
        priority: original.priority,
        typeOfIncident: original.typeOfIncident,
        address: original.address,
        description: original.description,
      });
      setLocation({
        lat: original.lat,
        lng: original.lng,
        address: original.address,
      });
      if (original.imageUrl && original.imageUrl.length > 0) {
        setFileList(
          original.imageUrl.map((url, index) => ({
            uid: `-${index}`,
            name: `image-${index}`,
            status: "done",
            url: url,
            thumbUrl: url,
          })),
        );
      } else {
        setFileList([]);
      }
      setTimeout(() => {
        calculateScore();
      }, 50);
    }
  };

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "vi-VN,vi;q=0.9" } },
      );
      const data = await res.json();
      if (data?.display_name) {
        const cleaned = getCleanedAddress(data.display_name);
        form.setFieldsValue({ address: cleaned });
        setAddressInput(cleaned);
        setLocation((prev) => (prev ? { ...prev, address: cleaned } : null));
        calculateScore();
      } else {
        message.warning("Không thể tra cứu được tên đường cho tọa độ này.");
        form.setFieldsValue({ address: `${lat}, ${lng}` });
        setAddressInput(`${lat}, ${lng}`);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      message.error("Lỗi khi tải thông tin địa chỉ từ bản đồ.");
      form.setFieldsValue({ address: `${lat}, ${lng}` });
      setAddressInput(`${lat}, ${lng}`);
    }
  };

  const fetchCoordinates = async () => {
    const addr = form.getFieldValue("address");
    if (!addr) return message.warning("Vui lòng nhập địa chỉ trước!");

    setLoadingLocation(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          addr,
        )}&limit=1`,
      );
      const data = await res.json();
      if (data?.length > 0) {
        const { lat, lon } = data[0];
        setLocation({
          lat: parseFloat(lat),
          lng: parseFloat(lon),
          address: addr,
        });
        message.success("Đã tìm thấy vị trí!");
        calculateScore();
      } else {
        message.error("Không tìm thấy địa chỉ.");
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi tìm vị trí.");
    } finally {
      setLoadingLocation(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      message.error("Trình duyệt không hỗ trợ lấy vị trí hiện tại.");
      return;
    }
    setLoadingLocation(true);
    form.setFieldsValue({ address: "Đang tải địa chỉ..." });
    setAddressInput("Đang tải địa chỉ...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({
          lat: latitude,
          lng: longitude,
          address: "Đang tải địa chỉ...",
        });
        fetchAddress(latitude, longitude).finally(() =>
          setLoadingLocation(false),
        );
      },
      (error) => {
        console.error("Lỗi lấy vị trí:", error);
        message.warning(
          "Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập vị trí của trình duyệt.",
        );
        setLoadingLocation(false);
        form.setFieldsValue({ address: "" });
        setAddressInput("");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleLocationSelect = (latlng: { lat: number; lng: number }) => {
    setLocation({
      lat: latlng.lat,
      lng: latlng.lng,
      address: location?.address,
    });
    fetchAddress(latlng.lat, latlng.lng);
    message.success("Đã ghim vị trí!");
  };

  const handleSubmit = async (values: CreateReflection) => {
    if (!location?.lat || !location?.lng) {
      message.error(
        "Vui lòng chọn vị trí trên bản đồ hoặc xác định từ địa chỉ!",
      );
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        ...values,
        content: values.content || values.description || "",
        category: values.category || Category.OTHER,
        description: values.description || "",
        lat: location.lat,
        lng: location.lng,
        address: getCleanedAddress(values.address || location.address || ""),
        imageUrl: await Promise.all(
          fileList.map(async (file) => {
            if (file.url) return file.url; // File đã có (edit mode)
            if (file.originFileObj) {
              // Upload file mới lên Cloudinary qua backend
              try {
                const res = await uploadApi(file.originFileObj);
                return res.url;
              } catch (error) {
                console.error("Upload error:", error);
                return "";
              }
            }
            return "";
          }),
        ).then((urls) => urls.filter((url) => url !== "")),
        priority: values.priority || Priority.LOW,
        typeOfIncident: values.typeOfIncident || EventType.OTHER,
      };

      if (selectedOriginalId) {
        payload.originalReflectionId = selectedOriginalId;
        payload.isPublishedOnMap = true;
      }

      let response;
      if (mode === "edit" && id) {
        response = await updateReflectionApi({ ...payload, id: Number(id) });
      } else {
        response = await createReflectionApi(payload);
      }

      if (response.statusCode === 200) {
        notification.success({
          message: "Thành công",

          description: response?.message,
        });
        navigate("/app/reflection-manager/list");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      notification.error({
        message: "Thất bại",
        description: err?.response?.data?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 md:p-4">
      <h1 className="text-xl md:text-2xl font-bold mb-4">
        {selectedOriginalId
          ? "Đăng phản ánh đã xử lý lên bản đồ"
          : mode === "add"
            ? "Thêm phản ánh"
            : "Cập nhật phản ánh"}
      </h1>
      <div className="grid grid-cols-1 gap-6">
        {/* Map + Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="h-[300px] md:h-[500px] rounded-xl overflow-hidden border border-gray-200 shadow">
            <CommonMap
              center={
                location
                  ? { lat: location.lat, lng: location.lng }
                  : { lat: 10.8651, lng: 106.7306 }
              }
              zoom={14}
              maxZoom={20}
              markerPosition={
                location ? { lat: location.lat, lng: location.lng } : null
              }
              markerPopupText="Vị trí sự cố"
              isEditable={!selectedOriginalId}
              onLocationSelect={handleLocationSelect}
            />
          </div>

          <Card className="max-h-[calc(100vh-300px)] overflow-y-auto hide-scrollbar">
            {isManagerOrAdmin && mode === "add" && (
              <div className="mb-6 bg-[#f7f9fc] p-4 rounded-lg border border-[#e4e9f2]">
                <p className="lg:text-[15px] text-[13px] text-[#464646] font-semibold mb-2">
                  Chọn phản ánh đã xử lý để đăng lên bản đồ
                </p>
                <Select
                  placeholder="Chọn từ danh sách phản ánh đã xử lý..."
                  allowClear
                  style={{ width: "100%" }}
                  size="large"
                  onChange={handleSelectResolved}
                  options={resolvedReflections.map((r) => ({
                    label: `[ID: ${r.id}] ${r.title} - ${r.address}`,
                    value: r.id,
                  }))}
                />
              </div>
            )}
            {(!isManager || mode !== "add" || !!selectedOriginalId) && (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                onValuesChange={handleValuesChange}
              >
                <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
                  <Form.Item<CreateReflection>
                    name="title"
                    required={false}
                    label={
                      <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                        Tiêu đề
                        <span className="text-[#D32F2F] ml-1">*</span>
                      </p>
                    }
                    validateTrigger={["onBlur", "onChange"]}
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tiêu đề",
                      },
                      {
                        max: 1000,
                        message: "Tối đa 1000 ký tự",
                      },
                    ]}
                  >
                    <Input
                      allowClear
                      autoFocus
                      className="w-full h-9!"
                      placeholder="Nhập tiêu đề..."
                      maxLength={5000}
                      disabled={!!selectedOriginalId}
                    />
                  </Form.Item>
                  <Form.Item<CreateReflection>
                    name="address"
                    label={
                      <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                        Địa chỉ
                        <span className="text-[#D32F2F] ml-1">*</span>
                      </p>
                    }
                    validateTrigger={["onBlur", "onChange"]}
                    required={false}
                    rules={formRules.address()}
                  >
                    <div className="flex gap-2">
                      <AutoComplete
                        className="flex-1"
                        options={addressSuggestions}
                        value={addressInput}
                        onChange={handleAddressInput}
                        onSelect={handleAddressSelect}
                        disabled={loadingLocation || !!selectedOriginalId}
                        notFoundContent={null}
                        filterOption={false}
                      >
                        <Input
                          placeholder="Nhập địa chỉ "
                          className="h-9!"
                          allowClear
                          onPressEnter={(e) => {
                            e.preventDefault();
                            fetchCoordinates();
                          }}
                          suffix={
                            <Button
                              type="text"
                              size="small"
                              loading={loadingLocation}
                              onClick={fetchCoordinates}
                              disabled={!!selectedOriginalId}
                            >
                              {loadingLocation ? "Đang tìm..." : "Tìm vị trí"}
                            </Button>
                          }
                        />
                      </AutoComplete>
                      <Tooltip title="Lấy vị trí hiện tại của bạn">
                        <Button
                          onClick={getCurrentLocation}
                          loading={loadingLocation}
                          icon={<LocateFixed size={18} />}
                          type="default"
                          disabled={!!selectedOriginalId}
                        />
                      </Tooltip>
                    </div>
                  </Form.Item>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Form.Item<CreateReflection>
                    name="typeOfIncident"
                    required={false}
                    label={
                      <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                        Loại sự cố
                        <span className="text-[#D32F2F] ml-1">*</span>
                      </p>
                    }
                    validateTrigger={["onBlur", "onChange"]}
                    rules={[
                      { required: true, message: "Vui lòng chọn loại sự cố" },
                    ]}
                  >
                    <Select
                      placeholder="Chọn danh mục"
                      allowClear
                      className="w-full h-9!"
                      disabled={!!selectedOriginalId}
                      options={[
                        { label: "Mưa", value: EventType.RAIN },
                        { label: "Thủy triều", value: EventType.TIDE },
                        { label: "Lũ lụt", value: EventType.FLOOD },
                        { label: "Vỡ đê", value: EventType.DYKE_BREAK },
                        { label: "Sạt lở", value: EventType.LANDSLIDE },
                        { label: "Khác", value: EventType.OTHER },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item<CreateReflection>
                    name="priority"
                    required={false}
                    label={
                      <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                        Mức độ thiệt hại
                        <span className="text-[#D32F2F] ml-1">*</span>
                      </p>
                    }
                    validateTrigger={["onBlur", "onChange"]}
                    rules={[
                      { required: true, message: "Vui lòng chọn danh mục" },
                    ]}
                  >
                    <Select
                      placeholder="Chọn mức độ"
                      allowClear
                      className="w-full h-9!"
                      disabled={!!selectedOriginalId}
                      options={[
                        { label: "Thấp", value: Priority.LOW },
                        { label: "Trung bình", value: Priority.MEDIUM },
                        { label: "Cao", value: Priority.HIGH },
                      ]}
                    />
                  </Form.Item>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Form.Item<CreateReflection>
                    name="category"
                    required={false}
                    label={
                      <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                        Danh mục
                        <span className="text-[#D32F2F] ml-1">*</span>
                      </p>
                    }
                    validateTrigger={["onBlur", "onChange"]}
                    rules={[
                      { required: true, message: "Vui lòng chọn danh mục" },
                    ]}
                  >
                    <Select
                      placeholder="Chọn danh mục"
                      allowClear
                      className="w-full h-9!"
                      disabled={!!selectedOriginalId}
                      options={[
                        { label: "Hạ tầng", value: Category.INFRASTRUCTURE },
                        { label: "Môi trường", value: Category.ENVIRONMENT },
                        { label: "An ninh trật tự", value: Category.SECURITY },
                        { label: "Khác", value: Category.OTHER },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item<CreateReflection>
                    name="content"
                    required={false}
                    label={
                      <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                        Nội dung tóm tắt
                        <span className="text-[#D32F2F] ml-1">*</span>
                      </p>
                    }
                    validateTrigger={["onBlur", "onChange"]}
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập nội dung tóm tắt",
                      },
                      {
                        max: 1000,
                        message: "Tối đa 1000 ký tự",
                      },
                    ]}
                  >
                    <Input
                      allowClear
                      className="w-full h-9!"
                      placeholder="Nhập nội dung tóm tắt..."
                      maxLength={5000}
                      disabled={!!selectedOriginalId}
                    />
                  </Form.Item>
                </div>

                <Form.Item<CreateReflection>
                  label={
                    <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                      Hình ảnh / Video
                      <span className="text-[#D32F2F] ml-1">*</span>
                    </p>
                  }
                  validateTrigger={["onBlur", "onChange"]}
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn hình ảnh / video",
                    },
                  ]}
                >
                  <Upload
                    listType="picture"
                    fileList={fileList}
                    accept="image/*,video/*"
                    onChange={({ fileList: newList }) => {
                      setFileList(newList);
                      calculateScore();
                    }}
                    beforeUpload={() => false}
                    maxCount={5}
                    disabled={!!selectedOriginalId}
                  >
                    <Button
                      icon={<UploadIcon size={16} />}
                      disabled={!!selectedOriginalId}
                    >
                      Chọn hình ảnh hoặc video
                    </Button>
                  </Upload>
                </Form.Item>

                <Form.Item<CreateReflection>
                  name="description"
                  label={
                    <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                      Mô tả
                    </p>
                  }
                  validateTrigger={["onBlur", "onChange"]}
                  rules={[{ max: 5000, message: "Tối đa 5000 ký tự" }]}
                >
                  <Input.TextArea
                    allowClear
                    rows={4}
                    className=""
                    maxLength={5000}
                    placeholder="Mô tả chi tiết sự cố..."
                    disabled={!!selectedOriginalId}
                  />
                </Form.Item>

                <div className="flex justify-end gap-2">
                  <Button
                    className="w-full md:w-auto h-9!"
                    onClick={() => navigate("/app/reflection-manager/list")}
                  >
                    Hủy
                  </Button>
                  <Button
                    className="w-full md:w-auto h-9!"
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    disabled={!location?.lat}
                  >
                    {selectedOriginalId
                      ? "Đăng lên bản đồ"
                      : mode === "add"
                        ? "Thêm phản ánh"
                        : "Cập nhật phản ánh"}
                  </Button>
                </div>
              </Form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
