import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// URL của backend verification-resident (Port 3002)
const getSocketConfig = () => {
  const isProd = window.location.hostname === 'ql-vunglu.site';
  if (isProd) {
    return {
      url: 'https://ql-vunglu.site',
      options: {
        path: '/api-dancu/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
      }
    };
  }
  return {
    url: 'http://localhost:3002',
    options: {
      path: '/api-dancu/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    }
  };
};

export const useVerificationSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      const config = getSocketConfig();
      socketRef.current = io(config.url, config.options);

      socketRef.current.on('connect', () => {
        console.log('🟢 DA-TTTN kết nối tới Verification Resident Socket thành công');
      });

      socketRef.current.on('disconnect', () => {
        console.log('🔴 DA-TTTN mất kết nối với Verification Resident Socket');
      });

      setSocket(socketRef.current);
    }

    return () => {
      // Giữ kết nối sống - không disconnect khi unmount component
      // socketRef.current?.disconnect();
    };
  }, []);

  /**
   * Phát sự kiện báo có cư dân mới đăng ký
   * Gọi hàm này sau khi createResident thành công
   */
  const emitNewResidentRegistration = (residentData: {
    fullName: string;
    phoneNumber: string;
    email?: string;
    address?: string;
    residentCode?: string;
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('new-resident-registration', residentData);
      console.log('📤 Đã gửi thông báo đăng ký mới tới hệ thống xác thực:', residentData.phoneNumber);
    } else {
      console.warn('⚠️ Socket chưa kết nối, không thể gửi thông báo xác thực');
    }
  };

  return { socket, emitNewResidentRegistration };
};
