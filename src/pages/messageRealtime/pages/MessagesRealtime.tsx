import { Modal } from "antd";
import {
  AlertTriangle,
  Camera,
  HeartPulse,
  ImagePlus,
  LifeBuoy,
  MapPin,
  Search,
  SendHorizontal,
  TriangleAlert,
  X,
  MessageCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { io, Socket } from "socket.io-client";

type Attachment = {
  id: string;
  type: "image";
  src: string;
  alt: string;
};

type ChatMessage = {
  id: string;
  sender: "doctor" | "officer" | "user";
  title: string;
  text: string;
  time: string;
  attachments?: Attachment[];
};

type SessionData = {
  sessionId: string;
  helpType: string;
  userTitle: string;
  messages: ChatMessage[];
  lastUpdate: number;
};

export default function MessagesRealtime() {
  const currentUser = useMemo(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  const roleCode = currentUser?.role?.roleCode;
  const isResponder =
    roleCode === "STAFF" ||
    roleCode === "OFFICER" ||
    roleCode === "MANAGER" ||
    roleCode === "ADMIN";
  const initialHelpType =
    roleCode === "STAFF"
      ? "medical"
      : roleCode === "OFFICER" || roleCode === "MANAGER" || roleCode === "ADMIN"
      ? "rescue"
      : null;

  const sessionId = useMemo(() => {
    if (isResponder) return null;
    let id = localStorage.getItem("emergencySessionId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("emergencySessionId", id);
    }
    return id;
  }, [isResponder]);

  const [composer, setComposer] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(initialHelpType === null);
  const [helpType, setHelpType] = useState<"medical" | "rescue" | null>(initialHelpType);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Realtime tracking states
  const [activeOfficers, setActiveOfficers] = useState(false);
  const [activeStaff, setActiveStaff] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Responder states
  const [activeSessions, setActiveSessions] = useState<SessionData[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, activeSessionId]);

  // Connect to socket
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const token = localStorage.getItem("accessToken");
    
    const newSocket = io(`${socketUrl}/chats`, {
      auth: { token },
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to emergency chat socket");
      newSocket.emit("checkActiveResponders");

      if (initialHelpType) {
        newSocket.emit("joinEmergencyResponder", initialHelpType);
      } else if (helpType && sessionId) {
        newSocket.emit("joinEmergencyUser", { helpType, sessionId, userTitle: currentUser?.fullName || "Người dân" });
      }
    });

    newSocket.on("activeRespondersStatus", (data: { hasOfficer: boolean; hasStaff: boolean }) => {
      setActiveOfficers(data.hasOfficer);
      setActiveStaff(data.hasStaff);
    });

    newSocket.on("respondersStatus", (data: { hasOfficer: boolean; hasStaff: boolean }) => {
      setActiveOfficers(data.hasOfficer);
      setActiveStaff(data.hasStaff);
    });

    // Responder events
    newSocket.on("activeEmergencySessions", (sessions: SessionData[]) => {
      setActiveSessions(sessions);
    });

    newSocket.on("newEmergencySession", (session: SessionData) => {
      setActiveSessions((prev) => [session, ...prev.filter(s => s.sessionId !== session.sessionId)]);
    });

    newSocket.on("updateSessionList", (session: SessionData) => {
      setActiveSessions((prev) => {
        const others = prev.filter(s => s.sessionId !== session.sessionId);
        return [session, ...others].sort((a, b) => b.lastUpdate - a.lastUpdate);
      });
      setActiveSessionId(prevId => {
        if (prevId === session.sessionId) {
          setMessages(session.messages);
        }
        return prevId;
      });
    });

    // User events
    newSocket.on("emergencySessionData", (session: SessionData) => {
      if (session && session.messages) {
        setMessages(session.messages);
      }
    });

    // Shared events
    newSocket.on("newEmergencyMessage", (data: { sessionId: string; message: ChatMessage }) => {
      setActiveSessionId(prevId => {
        if (!isResponder || prevId === data.sessionId) {
          setMessages((prev) => {
            if (prev.find((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        }
        return prevId;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [initialHelpType, helpType, sessionId, isResponder, currentUser?.fullName]);

  const selectSession = (id: string) => {
    setActiveSessionId(id);
    const session = activeSessions.find(s => s.sessionId === id);
    if (session) {
      setMessages(session.messages);
    }
  };

  const onSend = () => {
    const value = composer.trim();
    if (!value && pendingAttachments.length === 0) return;

    let senderType: "user" | "doctor" | "officer" = "user";
    let senderTitle = "Người dân";

    if (roleCode === "STAFF") {
      senderType = "doctor";
      senderTitle = `NV Y tế: ${currentUser?.fullName || ""}`;
    } else if (roleCode === "OFFICER" || roleCode === "MANAGER" || roleCode === "ADMIN") {
      senderType = "officer";
      senderTitle = `Cán bộ: ${currentUser?.fullName || ""}`;
    } else if (currentUser) {
      senderTitle = currentUser.fullName || "Người dân";
    }

    const newMessage: ChatMessage = {
      id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender: senderType,
      title: senderTitle,
      text: value || "📷 Đã gửi ảnh",
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Ho_Chi_Minh",
      }),
      attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
    };

    const targetSessionId = isResponder ? activeSessionId : sessionId;

    if (targetSessionId) {
      setMessages((prev) => [...prev, newMessage]);

      if (socket && helpType) {
        socket.emit("sendEmergencyMessage", { helpType, sessionId: targetSessionId, message: newMessage });
      }
    }

    setComposer("");
    setPendingAttachments([]);
  };

  const applyHelpType = (type: "medical" | "rescue") => {
    setHelpType(type);
    if (socket && sessionId) {
      socket.emit("joinEmergencyUser", { helpType: type, sessionId, userTitle: currentUser?.fullName || "Người dân" });
    }
    setIsModalOpen(false);
  };

  const responderTitle =
    helpType === "medical"
      ? activeStaff ? "Bác sĩ đang hỗ trợ" : "Chưa có Bác sĩ trực"
      : helpType === "rescue"
      ? activeOfficers ? "Cán bộ đang hỗ trợ" : "Chưa có Cán bộ trực"
      : "Đang kết nối";

  return (
    <>
      <Modal
        centered
        maskClosable={false}
        closeIcon={false}
        width={640}
        className="my-6 sm:my-10"
        title={
          <div className="text-center text-xl sm:text-2xl font-extrabold flex items-center justify-center gap-2 text-red-500">
            <TriangleAlert className="text-red-500" size={22} />
            Trường hợp khẩn cấp
          </div>
        }
        open={isModalOpen}
        footer={null}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-center text-[14px] sm:text-[16px] font-semibold text-slate-700 leading-6">
              Mình hiểu bạn đang trong tình huống khẩn cấp. Hãy{" "}
              <span className="text-rose-600 font-extrabold">bình tĩnh</span> và
              chọn loại hỗ trợ để hệ thống ưu tiên đúng lực lượng.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                applyHelpType("medical");
              }}
              className="group w-full cursor-pointer rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left transition hover:bg-rose-100/70 hover:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400/40"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-rose-600 text-white shadow-[0_16px_40px_-24px_rgba(225,29,72,0.9)]">
                  <HeartPulse size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-extrabold text-rose-700">
                    Cấp cứu y tế
                  </div>
                  <div className="mt-1 text-[13px] text-slate-700 leading-5">
                    Dành cho trường hợp bị thương/ngất/đuối nước hoặc cần hỗ trợ y tế khẩn.
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[12px] font-bold text-rose-700">
                      Ưu tiên cao
                    </span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-bold ${activeStaff ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}>
                      {activeStaff ? "● Đang có người trực" : "○ Chưa có người trực"}
                    </span>
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                applyHelpType("rescue");
              }}
              className="group w-full cursor-pointer rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left transition hover:bg-amber-100/70 hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-600 text-white shadow-[0_16px_40px_-24px_rgba(217,119,6,0.9)]">
                  <LifeBuoy size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-extrabold text-amber-700">
                    Cứu hộ / Di tản
                  </div>
                  <div className="mt-1 text-[13px] text-slate-700 leading-5">
                    Dành cho trường hợp mắc kẹt, nước dâng nhanh, cần phương án di chuyển an toàn.
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[12px] font-bold text-amber-700">
                      Hỗ trợ hiện trường
                    </span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-bold ${activeOfficers ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}>
                      {activeOfficers ? "● Đang có người trực" : "○ Chưa có người trực"}
                    </span>
                  </div>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                applyHelpType("rescue");
              }}
              className="group w-full cursor-pointer rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left transition hover:bg-amber-100/70 hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-600 text-white shadow-[0_16px_40px_-24px_rgba(217,119,6,0.9)]">
                  <LifeBuoy size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-extrabold text-amber-700">
                    Sự cố điện/rò rỉ hoặc sở điện
                  </div>
                  <div className="mt-1 text-[13px] text-slate-700 leading-5">
                    Dành cho trường hợp chập điện, rò rỉ điện
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[12px] font-bold text-amber-700">
                      Hỗ trợ hiện trường
                    </span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-bold ${activeOfficers ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}>
                      {activeOfficers ? "● Đang có người trực" : "○ Chưa có người trực"}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </Modal>

      <main className="min-h-dvh w-full bg-[radial-gradient(circle_at_20%_20%,#0b1220,#050913_45%,#020617)] px-3 sm:px-4 py-4 sm:py-10">
        <div className={`mx-auto w-full ${isResponder ? 'max-w-4xl flex flex-col md:flex-row gap-4' : 'max-w-[520px]'}`}>
          
          {/* Responder Sidebar */}
          {isResponder && (
            <div className="flex w-full md:w-1/3 flex-col h-[30vh] min-h-[200px] md:h-[calc(100dvh-5rem)] md:max-h-[860px] overflow-hidden rounded-[26px] border border-white/10 bg-white/5 shadow-lg backdrop-blur">
              <div className="bg-white/10 px-4 py-4 text-white border-b border-white/10">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <MessageCircle size={20} /> Danh sách hỗ trợ
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {activeSessions.length === 0 ? (
                  <div className="p-4 text-white/50 text-center text-sm">
                    Chưa có người dân nào gửi yêu cầu.
                  </div>
                ) : (
                  activeSessions.map((session) => (
                    <div
                      key={session.sessionId}
                      onClick={() => selectSession(session.sessionId)}
                      className={`cursor-pointer p-4 border-b border-white/5 transition hover:bg-white/10 ${activeSessionId === session.sessionId ? 'bg-white/15 border-l-4 border-l-blue-400' : ''}`}
                    >
                      <div className="font-semibold text-white truncate">{session.userTitle}</div>
                      <div className="text-xs text-white/60 mt-1 truncate">
                        {session.messages.length > 0 ? session.messages[session.messages.length - 1].text : "Chưa có tin nhắn"}
                      </div>
                      <div className="text-[10px] text-white/40 mt-1">
                        {new Date(session.lastUpdate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Main Chat Area */}
          <div className={`flex flex-col max-h-[860px] overflow-hidden rounded-[26px] border border-white/10 bg-white/5 shadow-[0_30px_120px_-50px_rgba(0,0,0,0.75)] backdrop-blur ${isResponder ? 'w-full md:w-2/3 h-[calc(70vh-4rem)] md:h-[calc(100dvh-5rem)]' : 'w-full h-[calc(100dvh-2rem)] sm:h-[calc(100dvh-5rem)]'}`}>
            {/* Header */}
            <div className="flex items-center justify-between gap-3 bg-white/10 px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e53935] shadow-[0_12px_30px_-16px_rgba(229,57,53,0.9)]">
                  <AlertTriangle size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-extrabold tracking-wide uppercase">
                    Trường hợp khẩn cấp
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-white/70">
                    {helpType === "medical" && (
                      <span className={`h-2 w-2 rounded-full ${activeStaff ? "bg-green-500" : "bg-slate-400"}`}></span>
                    )}
                    {helpType === "rescue" && (
                      <span className={`h-2 w-2 rounded-full ${activeOfficers ? "bg-green-500" : "bg-slate-400"}`}></span>
                    )}
                    {isResponder && activeSessionId 
                      ? `Đang hỗ trợ: ${activeSessions.find(s => s.sessionId === activeSessionId)?.userTitle}` 
                      : responderTitle} • Realtime
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[12px] font-semibold text-white/90 hover:bg-white/10 transition"
                >
                  Thoát
                </Link>
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition"
                  aria-label="Tìm kiếm"
                >
                  <Search size={18} />
                </button>
              </div>
            </div>

            {/* List */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-[13px] text-white/80 text-center">
                  {isResponder
                    ? (activeSessionId ? "Chưa có tin nhắn trong phiên này." : "Vui lòng chọn một người dân bên danh sách để bắt đầu hỗ trợ.")
                    : "Hãy chọn loại hỗ trợ (Cấp cứu y tế / Cứu hộ - Di tản) để bắt đầu cuộc chat."}
                </div>
              )}
              {messages.map((m) => {
                const isUser = m.sender === "user";
                const isDoctor = m.sender === "doctor";
                
                // If responder is viewing, they are on the right, user is on the left
                const isMe = isResponder ? !isUser : isUser;

                const avatarLabel = isUser ? "B" : isDoctor ? "BS" : "CB";
                const avatarBg = isUser
                  ? "bg-white/15"
                  : isDoctor
                  ? "bg-rose-500/30"
                  : "bg-sky-500/25";
                
                return (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 ${avatarBg} text-[12px] font-extrabold text-white/90`}
                      aria-hidden
                    >
                      {avatarLabel}
                    </div>

                    <div
                      className={`min-w-0 max-w-[78%] sm:max-w-[85%] ${
                        isMe ? "text-right" : "text-left"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-white/70">
                        <span className="truncate font-semibold text-white/80">
                          {m.title}
                        </span>
                        <span className="shrink-0">{m.time}</span>
                      </div>

                      <div
                        className={`rounded-2xl px-4 py-3 text-[13px] leading-6 shadow-sm ${
                          isUser && !isResponder
                            ? "bg-[#e53935]/20 text-white border border-[#e53935]/25"
                            : !isUser && isResponder
                            ? "bg-blue-500/20 text-white border border-blue-500/30"
                            : isDoctor
                            ? "bg-rose-500/10 text-white border border-rose-500/20"
                            : "bg-white/10 text-white border border-white/10"
                        }`}
                      >
                        {m.text}
                      </div>

                      {!!m.attachments?.length && (
                        <div
                          className={`mt-2 grid gap-2 ${
                            m.attachments.length > 1
                              ? "grid-cols-2"
                              : "grid-cols-1"
                          }`}
                        >
                          {m.attachments.map((a) => (
                            <div
                              key={a.id}
                              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                            >
                              <img
                                src={a.src}
                                alt={a.alt}
                                loading="lazy"
                                className="h-[140px] w-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Composer */}
            <div className="border-t border-white/10 bg-white/10 px-3 py-3 relative">
              {isResponder && !activeSessionId && (
                <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white/80 text-sm font-medium">Chọn một người để chat</span>
                </div>
              )}
              {/* hidden inputs */}
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const result = ev.target?.result;
                    if (typeof result === "string") {
                      setPendingAttachments((prev) => [
                        ...prev,
                        {
                          id: `up-${Date.now()}`,
                          type: "image",
                          src: result,
                          alt: file.name || "Ảnh tải lên",
                        },
                      ]);
                    }
                  };
                  reader.readAsDataURL(file);
                  e.currentTarget.value = "";
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const result = ev.target?.result;
                    if (typeof result === "string") {
                      setPendingAttachments((prev) => [
                        ...prev,
                        {
                          id: `cam-${Date.now()}`,
                          type: "image",
                          src: result,
                          alt: "Ảnh chụp",
                        },
                      ]);
                    }
                  };
                  reader.readAsDataURL(file);
                  e.currentTarget.value = "";
                }}
              />

              {pendingAttachments.length > 0 && (
                <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                  {pendingAttachments.map((a) => (
                    <div
                      key={a.id}
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/5"
                    >
                      <img src={a.src} alt={a.alt} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setPendingAttachments((prev) => {
                            const target = prev.find((x) => x.id === a.id);
                            if (target?.src?.startsWith("blob:")) {
                              URL.revokeObjectURL(target.src);
                            }
                            return prev.filter((x) => x.id !== a.id);
                          });
                        }}
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white hover:bg-black/70"
                        aria-label="Xóa ảnh"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGeoStatus("Đang lấy vị trí...");
                    if (!("geolocation" in navigator)) {
                      setGeoStatus("Thiết bị không hỗ trợ định vị.");
                      return;
                    }
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const { latitude, longitude } = pos.coords;
                        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
                        
                        let senderType: "user" | "doctor" | "officer" = "user";
                        let senderTitle = "Bạn";
                         if (roleCode === "STAFF") {
                           senderType = "doctor";
                           senderTitle = currentUser?.fullName || "NV Y tế";
                         } else if (roleCode === "OFFICER" || roleCode === "MANAGER") {
                           senderType = "officer";
                           senderTitle = currentUser?.fullName || "Cán bộ";
                         }

                        const locMessage: ChatMessage = {
                          id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                          sender: senderType,
                          title: senderTitle,
                          text: `📍 Vị trí hiện tại: ${url}`,
                          time: new Date().toLocaleTimeString("vi-VN", {
                             hour: "2-digit",
                             minute: "2-digit",
                             hour12: false,
                             timeZone: "Asia/Ho_Chi_Minh",
                           }),
                        };

                        const targetSessionId = isResponder ? activeSessionId : sessionId;

                        if (targetSessionId) {
                          setMessages((prev) => [...prev, locMessage]);

                          if (socket && helpType) {
                            socket.emit("sendEmergencyMessage", { helpType, sessionId: targetSessionId, message: locMessage });
                          }
                        }
                        
                        setGeoStatus(null);
                      },
                      () => {
                        setGeoStatus("Không lấy được vị trí. Hãy bật GPS và cho phép quyền truy cập vị trí.");
                      },
                      { enableHighAccuracy: true, timeout: 10000 }
                    );
                  }}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10 transition"
                  aria-label="Chia sẻ vị trí hiện tại"
                >
                  <MapPin size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10 transition"
                  aria-label="Chọn ảnh"
                >
                  <ImagePlus size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10 transition"
                  aria-label="Chụp ảnh"
                >
                  <Camera size={18} />
                </button>

                <div className="flex-1">
                  <input
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSend();
                    }}
                    placeholder="Nhắn tin..."
                    className="h-10 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-[13px] text-white placeholder:text-white/40 outline-none focus:border-white/25"
                  />
                </div>

                <button
                  type="button"
                  onClick={onSend}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-[#e53935] text-white shadow-[0_14px_40px_-18px_rgba(229,57,53,0.9)] transition hover:bg-[#d32f2f] disabled:opacity-50"
                  aria-label="Gửi"
                  disabled={!composer.trim() && pendingAttachments.length === 0}
                >
                  <SendHorizontal size={18} />
                </button>
              </div>
              {geoStatus && (
                <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/80">
                  {geoStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
