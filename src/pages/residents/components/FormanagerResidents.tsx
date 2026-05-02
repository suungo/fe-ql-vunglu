import { Button, Form, Input, notification, Select, Spin } from "antd";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed } from "lucide-react";
import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
  WMSTileLayer,
} from "react-leaflet";
import { useNavigate, useParams } from "react-router-dom";

// Fix Leaflet icon issue
import { formRules } from "@/components/constants";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconMarker from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import {
  HasBusiness,
  HasChildren,
  HasElderly,
  HasPregnant,
  HasSick,
  HouseType,
} from "../enum";
import {
  useCreateResident,
  useResidentById,
  useUpdateResident,
} from "../hooks";
import type { CreateResident } from "../interfaces";

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

type Props = {
  onCancel?: () => void;
  refetch?: () => void;
  mode: "add" | "edit";
  idEdit?: number | null;
};

export default function FormanagerResidents({
  onCancel,
  refetch,
  mode,
  idEdit,
}: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const [address, setAddress] = useState<string>("");
  const effectiveId = idEdit ?? (id ? Number(id) : null);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const { data: dataEdit, isLoading } = useResidentById(effectiveId as number);

  // Sync data and location state when data is loaded (edit mode)
  useEffect(() => {
    if (mode === "edit" && dataEdit?.data) {
      form.setFieldsValue(dataEdit.data);
      const { latitude, longitude, address } = dataEdit.data;
      if (latitude && longitude) {
        setLocation({ lat: latitude, lng: longitude, address });
      }
      setAddress(address || "");
    }
  }, [dataEdit, mode, form]);

  const fetchAddress = async (lat: number, lng: number) => {
    // Cập nhật vị trí marker và tọa độ input ngay lập tức
    setLocation((prev) => ({ ...prev, lat, lng }));
    form.setFieldsValue({ latitude: lat, longitude: lng });

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "vi-VN,vi;q=0.9" } },
      );
      const data = await res.json();
      if (data?.display_name) {
        // Cập nhật cả form và state 'address' để input hiển thị đúng
        const addrName = data.display_name;
        form.setFieldsValue({ address: addrName });
        setAddress(addrName);
        setLocation({ lat, lng, address: addrName });
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      notification.warning({
        message: "Lỗi khi tải thông tin địa chỉ từ bản đồ.",
      });
    }
  };

  const fetchCoordinates = async () => {
    const addr = form.getFieldValue("address");
    if (!addr)
      return notification.warning({ message: "Vui lòng nhập địa chỉ trước!" });

    setLoadingLocation(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          addr,
        )}&limit=1`,
      );
      const data = await res.json();
      if (data?.length > 0) {
        setAddress(addr);
        const { lat, lon } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        setLocation({ lat: latitude, lng: longitude, address: addr });
        form.setFieldsValue({ latitude, longitude });
        notification.success({ message: "Đã tìm thấy vị trí!" });
      } else {
        notification.error({
          message: "Không tìm thấy tọa độ cho địa chỉ này.",
        });
      }
    } catch (err) {
      console.error(err);
      notification.error({ message: "Lỗi khi tìm vị trí." });
    } finally {
      setLoadingLocation(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      notification.error({ message: "Trình duyệt không hỗ trợ lấy vị trí." });
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setAddress("");
        fetchAddress(latitude, longitude).finally(() =>
          setLoadingLocation(false),
        );
      },
      (error) => {
        console.error("Lỗi lấy vị trí:", error);
        notification.warning({ message: "Không thể lấy vị trí hiện tại." });
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  function MapUpdater({
    center,
  }: {
    center: { lat: number; lng: number } | null;
  }) {
    const map = useMap();

    useEffect(() => {
      // Fix for Leaflet map in Antd Modal/Drawer
      const timeout = setTimeout(() => {
        map.invalidateSize();
      }, 300);
      return () => clearTimeout(timeout);
    }, [map]);

    useEffect(() => {
      if (center) map.flyTo(center, 17);
    }, [center, map]);
    return null;
  }

  function LocationMarker() {
    useMapEvents({
      click(e: { latlng: { lat: number; lng: number } }) {
        fetchAddress(e.latlng.lat, e.latlng.lng);
      },
    });
    return location ? (
      <Marker position={[location.lat, location.lng]}>
        <Popup>{location.address || "Vị trí đã chọn"}</Popup>
      </Marker>
    ) : null;
  }

  const createResidentMutation = useCreateResident();
  const updateResidentMutation = useUpdateResident();

  const onFinish = async (values: CreateResident) => {
    setLoading(true);
    try {
      if (mode === "add") {
        const data = {
          ...values,
          address: address,
        };
        await createResidentMutation.mutateAsync(data);
      } else {
        const data = {
          ...values,
          address: address,
        };
        await updateResidentMutation.mutateAsync({
          id: effectiveId!,
          value: data,
        });
      }
      if (onCancel) onCancel();
      if (refetch) refetch();
      if (!onCancel && !refetch) {
        navigate("/app/residents-manager/list");
      }
    } catch (error: unknown) {
      const errorResponse = (error as any)?.response?.data;
      notification.error({
        title: "Thất bại",
        description: errorResponse?.message || "Có lỗi xảy ra",
      });
      if (onCancel) onCancel();
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <Spin size="large" />
        </div>
      ) : (
        <div className="p-4 bg-white rounded-xl shadow max-h-[calc(100vh-200px)] overflow-y-auto hide-scrollbar">
          <h3 className="font-semibold mb-4 text-[18px] sm:text-[18px] md:text-[20px] lg:text-[22px] xl:text-[24px]">
            {mode === "add" ? "Thêm hộ dân" : "Cập nhật hộ dân"}
          </h3>

          <Form
            layout="vertical"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            form={form}
          >
            <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
              <Form.Item<CreateResident>
                rules={formRules.code()}
                required={false}
                name="residentCode"
                label={
                  <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                    Mã hộ dân
                    <span className="text-[#D32F2F] ml-1">*</span>
                  </p>
                }
                validateTrigger={["onBlur", "onChange"]}
              >
                <Input
                  allowClear
                  className="w-full h-10!"
                  placeholder="Nhập mã hộ dân"
                />
              </Form.Item>
              <Form.Item<CreateResident>
                rules={formRules.fullName()}
                required={false}
                name="fullName"
                label={
                  <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                    Tên chủ hộ
                    <span className="text-[#D32F2F] ml-1">*</span>
                  </p>
                }
                validateTrigger={["onBlur", "onChange"]}
              >
                <Input
                  allowClear
                  className="w-full h-10!"
                  placeholder="Nhập tên chủ hộ"
                />
              </Form.Item>
            </div>

            <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
              <Form.Item<CreateResident>
                required={false}
                rules={[
                  { required: true, message: "Vui lòng nhập số thành viên" },
                ]}
                name="numberOfMembers"
                label={
                  <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                    Số lượng thành viên
                    <span className="text-[#D32F2F] ml-1">*</span>
                  </p>
                }
                validateTrigger={["onBlur", "onChange"]}
              >
                <Input
                  allowClear
                  className="w-full h-10!"
                  placeholder="Nhập số thành viên"
                />
              </Form.Item>
              <Form.Item<CreateResident>
                required={false}
                rules={[
                  { required: true, message: "Vui lòng chọn có người già" },
                ]}
                name="hasElderly"
                label={
                  <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                    Hộ có người già
                    <span className="text-[#D32F2F] ml-1">*</span>
                  </p>
                }
                validateTrigger={["onBlur", "onChange"]}
              >
                <Select
                  allowClear
                  className="w-full h-10!"
                  placeholder="Chọn tình trạng"
                  options={[
                    {
                      label: "Có",
                      value: HasElderly.YES,
                    },
                    {
                      label: "Không",
                      value: HasElderly.NO,
                    },
                  ]}
                />
              </Form.Item>
            </div>
            <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
              <Form.Item<CreateResident>
                required={false}
                rules={[{ required: true, message: "Vui lòng nhập có trẻ em" }]}
                name="hasChildren"
                label={
                  <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                    Hộ có trẻ em
                    <span className="text-[#D32F2F] ml-1">*</span>
                  </p>
                }
                validateTrigger={["onBlur", "onChange"]}
              >
                <Select
                  className="w-full h-10!"
                  allowClear
                  placeholder="Chọn tình trạng"
                  options={[
                    {
                      label: "Có",
                      value: HasChildren.YES,
                    },
                    {
                      label: "Không",
                      value: HasChildren.NO,
                    },
                  ]}
                />
              </Form.Item>
              <Form.Item<CreateResident>
                required={false}
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập có phụ nữ mang thai",
                  },
                ]}
                name="hasPregnantWomen"
                label={
                  <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                    Hộ có phụ nữ mang thai
                    <span className="text-[#D32F2F] ml-1">*</span>
                  </p>
                }
                validateTrigger={["onBlur", "onChange"]}
              >
                <Select
                  className="w-full h-10!"
                  placeholder="Chọn tình trạng"
                  allowClear
                  options={[
                    {
                      label: "Có",
                      value: HasPregnant.YES,
                    },
                    {
                      label: "Không",
                      value: HasPregnant.NO,
                    },
                  ]}
                />
              </Form.Item>
            </div>
            <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
              <Form.Item<CreateResident>
                required={false}
                rules={[{ required: true, message: "Vui lòng nhập mã hộ dân" }]}
                name="hasChronicDisease"
                label={
                  <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                    Hộ có người bị bệnh nền
                    <span className="text-[#D32F2F] ml-1">*</span>
                  </p>
                }
                validateTrigger={["onBlur", "onChange"]}
              >
                <Select
                  className="w-full h-10!"
                  placeholder="Chọn tình trạng"
                  allowClear
                  options={[
                    {
                      label: "Có",
                      value: HasSick.YES,
                    },
                    {
                      label: "Không",
                      value: HasSick.NO,
                    },
                  ]}
                />
              </Form.Item>
              <Form.Item<CreateResident>
                required={false}
                rules={[{ required: true, message: "Vui lòng nhập loại nhà" }]}
                name="houseType"
                label={
                  <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                    Loại nhà
                    <span className="text-[#D32F2F] ml-1">*</span>
                  </p>
                }
                validateTrigger={["onBlur", "onChange"]}
              >
                <Select
                  className="w-full h-10!"
                  placeholder="Nhập loại nhà"
                  allowClear
                  options={[
                    {
                      label: "Nhà cấp 4",
                      value: HouseType.HOUSE_LEVEL_4,
                    },
                    {
                      label: "Nhà phố (Nhà ống)",
                      value: HouseType.HOUSE_STREET,
                    },
                    {
                      label: "Nhà trong hẻm",
                      value: HouseType.HOUSE_ALLEY,
                    },
                    {
                      label: "Nhà mặt tiền",
                      value: HouseType.HOUSE_FRONTAGE,
                    },
                    {
                      label: "Chung cư / căn hộ",
                      value: HouseType.APARTMENT,
                    },
                    {
                      label: "Nhà trọ / phòng trọ",
                      value: HouseType.RENTAL_HOUSE,
                    },
                    {
                      label: "Biệt thự / nhà liền kề",
                      value: HouseType.VILLA,
                    },
                  ]}
                />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item<CreateResident>
                required={false}
                rules={[{ required: true, message: "Vui lòng nhập số tầng" }]}
                name="numberOfFloors"
                label={
                  <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                    Số tầng
                    <span className="text-[#D32F2F] ml-1">*</span>
                  </p>
                }
                validateTrigger={["onBlur", "onChange"]}
              >
                <Input
                  allowClear
                  className="w-full h-10!"
                  placeholder="Nhập số tầng"
                />
              </Form.Item>
              <Form.Item<CreateResident>
                required={false}
                rules={[
                  { required: true, message: "Vui lòng nhập có kinh doanh" },
                ]}
                name="hasBusiness"
                label={
                  <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                    Hộ kinh doanh
                    <span className="text-[#D32F2F] ml-1">*</span>
                  </p>
                }
                validateTrigger={["onBlur", "onChange"]}
              >
                <Select
                  allowClear
                  options={[
                    {
                      label: "Có",
                      value: HasBusiness.YES,
                    },
                    {
                      label: "Không",
                      value: HasBusiness.NO,
                    },
                  ]}
                  className="w-full h-10!"
                  placeholder="Nhập tên chủ hộ"
                />
              </Form.Item>
            </div>
            <div className="grid lg:grid-cols-3 grid-cols-1 gap-4">
              <Form.Item<CreateResident>
                required={false}
                rules={formRules.email()}
                name="email"
                label={
                  <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                    Email
                    <span className="text-[#D32F2F] ml-1">*</span>
                  </p>
                }
                validateTrigger={["onBlur", "onChange"]}
              >
                <Input
                  allowClear
                  className="w-full h-10!"
                  placeholder="Nhập email"
                />
              </Form.Item>
              <Form.Item<CreateResident>
                required={false}
                rules={formRules.phone()}
                name="phoneNumber"
                label={
                  <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                    Số điện thoại
                    <span className="text-[#D32F2F] ml-1">*</span>
                  </p>
                }
                validateTrigger={["onBlur", "onChange"]}
              >
                <Input
                  allowClear
                  className="w-full h-10!"
                  placeholder="Nhập số điện thoại"
                />
              </Form.Item>
              <Form.Item<CreateResident>
                required={false}
                rules={formRules.address()}
                name="address"
                label={
                  <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                    Địa chỉ
                    <span className="text-[#D32F2F] ml-1">*</span>
                  </p>
                }
                validateTrigger={["onBlur", "onChange"]}
              >
                <div className="flex gap-2 ">
                  <Input
                    allowClear
                    className="flex-1 h-10!"
                    placeholder="Nhập địa chỉ"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    suffix={
                      <Button
                        type="text"
                        size="small"
                        className="h-10!"
                        loading={loadingLocation}
                        onClick={fetchCoordinates}
                      >
                        Tìm tọa độ
                      </Button>
                    }
                  />
                  <Button
                    icon={<LocateFixed size={18} />}
                    onClick={getCurrentLocation}
                    loading={loadingLocation}
                    title="Vị trí hiện tại"
                  />
                </div>
              </Form.Item>
            </div>
            <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
              <Form.Item<CreateResident>
                required={false}
                rules={[{ required: true, message: "Vui lòng nhập mã hộ dân" }]}
                name="longitude"
                label={
                  <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                    Kinh độ
                    <span className="text-[#D32F2F] ml-1">*</span>
                  </p>
                }
                validateTrigger={["onBlur", "onChange"]}
              >
                <Input
                  className="w-full h-10!"
                  placeholder="Nhập kinh độ"
                  disabled
                />
              </Form.Item>
              <Form.Item<CreateResident>
                required={false}
                rules={[{ required: true, message: "Vui lòng nhập vĩ độ" }]}
                name="latitude"
                label={
                  <p className="lg:text-[16px] text-[14px] text-[#464646] font-medium">
                    Vĩ độ
                    <span className="text-[#D32F2F] ml-1">*</span>
                  </p>
                }
                validateTrigger={["onBlur", "onChange"]}
              >
                <Input
                  className="w-full h-10!"
                  placeholder="Nhập vĩ độ"
                  disabled
                />
              </Form.Item>
            </div>
            <div className="w-full my-4 h-[500px] border border-gray-200 rounded-xl overflow-hidden shadow-sm">
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

            <Form.Item>
              <div className="flex justify-end gap-2">
                <Button
                  color="danger"
                  variant="solid"
                  className="text-[16px] font-medium h-9!"
                  onClick={() => {
                    if (onCancel) {
                      onCancel();
                    } else {
                      navigate("/app/residents-manager/list");
                    }
                  }}
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  loading={loading}
                  className="text-[16px] font-medium h-9!"
                  htmlType="submit"
                >
                  {mode === "add" ? "Thêm Hộ Dân" : "Cập nhật Hộ Dân"}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      )}
    </>
  );
}
