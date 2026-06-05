import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// URL của backend verification-human-resources (Port 3003)
const getSocketConfig = () => {
  const isProd = window.location.hostname === 'ql-vunglu.site';
  if (isProd) {
    return {
      url: 'https://ql-vunglu.site',
      options: {
        path: '/api-nhansu/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
      }
    };
  }
  return {
    url: 'http://localhost:3003',
    options: {
      path: '/api-nhansu/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    }
  };
};

export const useHRVerificationSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      const config = getSocketConfig();
      socketRef.current = io(config.url, config.options);

      socketRef.current.on('connect', () => {
        console.log('🟢 DA-TTTN kết nối tới HR Verification Socket thành công');
      });

      socketRef.current.on('disconnect', () => {
        console.log('🔴 DA-TTTN mất kết nối với HR Verification Socket');
      });

      setSocket(socketRef.current);
    }

    return () => {
      // socketRef.current?.disconnect();
    };
  }, []);

  /**
   * Phát sự kiện báo có nhân sự mới đăng ký
   */
  const emitNewHRRegistration = (hrData: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('new-hr-registration', hrData);
      console.log('📤 Đã gửi yêu cầu đăng ký nhân sự tới hệ thống xác thực:', hrData.employeeCode);
    } else {
      console.warn('⚠️ Socket chưa kết nối, không thể gửi thông báo xác thực nhân sự');
    }
  };

  return { socket, emitNewHRRegistration };
};
