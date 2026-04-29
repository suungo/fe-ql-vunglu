import { App } from "antd";
import type { NotificationInstance } from "antd/es/notification/interface";
import { useEffect, type ReactNode } from "react";

export let globalNotificationInstance: NotificationInstance | null = null;

type NotificationProviderProps = {
  children: ReactNode;
};

// Provider để lấy notification instance từ App.useApp và lưu lại ở module scope
export const NotificationProvider = ({
  children,
}: NotificationProviderProps) => {
  const { notification } = App.useApp();

  useEffect(() => {
    globalNotificationInstance = notification;
  }, [notification]);

  return <>{children}</>;
};

// export const typeStyles = {
//   success: {
//     color: "#20AE5C",
//     icon: <SuccessIcon />,
//   },
//   warning: {
//     color: "#FAAD14",
//     icon: <WarningIcon />,
//   },
//   error: {
//     color: "#FF4D4F",
//     icon: <ErrorIcon />,
//   },
//   info: {
//     color: "#1890FF",
//     icon: <InfoIcon />,
//   },
// };

// export const openNotification = ({
//   type,
//   title,
//   message,
//   duration = 3,
//   position = "topRight",
//   isCloseIcon = true,
//   key,
//   instance,
// }: NotificationProps) => {
//   const { color, icon } = typeStyles[type];
//   const api = instance || globalNotificationInstance;

//   if (!api) return;

//   api.open({
//     closable: isCloseIcon,
//     message: (
//       <div className="text-[18px] font-semibold text-[#4A4A4A]">{title}</div>
//     ),
//     description: <p className="text-[16px] text-[#3D3D3D]">{message}</p>,
//     style: {
//       borderLeft: `3px solid ${color}`,
//       borderRadius: 8,
//       backgroundColor: "#fff",
//     },
//     icon: icon,
//     duration,
//     placement: position,
//     key: key ?? `${type}:${title ?? ""}:${message ?? ""}`,
//   });
// };
