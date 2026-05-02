import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Tooltip,
  Upload,
  message,
  notification,
  type UploadFile,
} from "antd";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Upload as UploadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  WMSTileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

// Fix Leaflet icon issue
import { formRules } from "@/components/constants";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconMarker from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { useNavigate, useParams } from "react-router-dom";
import {
  createReflectionApi,
  getReflectionApi,
  updateReflectionApi,
  uploadApi,
} from "../api";
import { Category, EventType, Priority } from "../enum";
import type { CreateReflection, Reflection } from "../interfaces";

type Props = {
  mode: "add" | "edit";
};

// const { Option } = Select;

const defaultIcon = L.icon({
  iconRetinaUrl: iconRetina,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

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

  useEffect(() => {
    if (mode === "edit" && id) {
      const fetchDetail = async () => {
        setLoading(true);
        try {
          const res = await getReflectionApi(Number(id));
          if (res.statusCode === 200) {
            const data = res.data as Reflection;
            form.setFieldsValue({
              ...data,
              content: data.content,
              description: data.description,
              category: data.category,
              priority: data.priority,
              typeOfIncident: data.typeOfIncident,
              address: data.address,
            });
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
  }, [mode, id, form]);

  const handleValuesChange = () => calculateScore();

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "vi-VN,vi;q=0.9" } },
      );
      const data = await res.json();
      if (data?.display_name) {
        form.setFieldsValue({ address: data.display_name });
        setLocation((prev) =>
          prev ? { ...prev, address: data.display_name } : null,
        );
        calculateScore();
      } else {
        message.warning("Không thể tra cứu được tên đường cho tọa độ này.");
        form.setFieldsValue({ address: `${lat}, ${lng}` });
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      message.error("Lỗi khi tải thông tin địa chỉ từ bản đồ.");
      form.setFieldsValue({ address: `${lat}, ${lng}` });
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

  function MapUpdater({
    center,
  }: {
    center: { lat: number; lng: number } | null;
  }) {
    const map = useMap();

    useEffect(() => {
      // Khi component mount đặt trong Modal, phải chờ 1 chút cho animation của Modal xong
      // mới gọi invalidateSize để Leaflet lấy được kích thước thật của container.
      const timeout = setTimeout(() => {
        map.invalidateSize();
      }, 300);
      return () => clearTimeout(timeout);
    }, [map]);

    if (center) map.flyTo(center, 16);
    return null;
  }

  function LocationMarker() {
    useMapEvents({
      click(e: { latlng: { lat: number; lng: number } }) {
        handleLocationSelect(e.latlng);
      },
    });
    return location ? (
      <Marker position={[location.lat, location.lng]}>
        <Popup>Vị trí sự cố</Popup>
      </Marker>
    ) : null;
  }

  const handleSubmit = async (values: CreateReflection) => {
    if (!location?.lat || !location?.lng) {
      message.error(
        "Vui lòng chọn vị trí trên bản đồ hoặc xác định từ địa chỉ!",
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...values,
        content: values.content || values.description || "",
        category: values.category || Category.OTHER,
        description: values.description || "",
        lat: location.lat,
        lng: location.lng,
        address: values.address || location.address || "",
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
        {mode === "add" ? "Thêm phản ánh" : "Cập nhật phản ánh"}
      </h1>
      <div className="grid grid-cols-1 gap-6">
        {/* Map + Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="h-[300px] md:h-[500px] rounded-xl overflow-hidden border border-gray-200 shadow">
            <MapContainer
              center={[10.8651, 106.7306]}
              zoom={14}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='&copy; <a href="https://www.esri.com">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              />
              <WMSTileLayer
                url="http://localhost:8000/geoserver/tambinh/wms"
                layers="tambinh:tam-binh_map"
                format="image/png"
                transparent={true}
              />
              <LocationMarker />
              <MapUpdater
                center={
                  location ? { lat: location.lat, lng: location.lng } : null
                }
              />
            </MapContainer>
          </div>

          <Card className="max-h-[calc(100vh-300px)] overflow-y-auto hide-scrollbar">
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
                    className="w-full h-9!"
                    placeholder="Nhập tiêu đề..."
                    maxLength={5000}
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
                    <Input
                      placeholder="Ví dụ: 123 Đường ABC, Quận XYZ, TP.HCM"
                      onBlur={fetchCoordinates}
                      onPressEnter={(e) => {
                        e.preventDefault();
                        fetchCoordinates();
                      }}
                      value={location?.address}
                      disabled={loadingLocation}
                      className="flex-1 h-9!"
                      suffix={
                        <Button
                          type="text"
                          size="small"
                          loading={loadingLocation}
                          onClick={fetchCoordinates}
                        >
                          {loadingLocation ? "Đang tìm..." : "Tìm vị trí"}
                        </Button>
                      }
                    />
                    <Tooltip title="Lấy vị trí hiện tại của bạn">
                      <Button
                        onClick={getCurrentLocation}
                        loading={loadingLocation}
                        icon={<LocateFixed size={18} />}
                        type="default"
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
                    className="w-full h-9!"
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
                      Mức dộ
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
                    className="w-full h-9!"
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
                    className="w-full h-9!"
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
                    className="w-full h-9!"
                    placeholder="Nhập nội dung tóm tắt..."
                    maxLength={5000}
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
                >
                  <Button icon={<UploadIcon size={16} />}>
                    Chọn hình ảnh hoặc video
                  </Button>
                </Upload>
              </Form.Item>

              <Form.Item<CreateReflection>
                name="description"
                label={
                  <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                    Mô tả / Ghi chú
                  </p>
                }
                validateTrigger={["onBlur", "onChange"]}
                rules={[{ max: 5000, message: "Tối đa 5000 ký tự" }]}
              >
                <Input.TextArea
                  rows={4}
                  className=""
                  maxLength={5000}
                  placeholder="Mô tả chi tiết sự cố..."
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
                  {mode === "add" ? "Thêm phản ánh" : "Cập nhật phản ánh"}
                </Button>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}
