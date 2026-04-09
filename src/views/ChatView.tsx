import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "../hooks/useChat";
import { useAuthStore } from "../store/authStore";
import { chatService } from "../services/chat.service";
import type { Message, Conversation, ChatUser } from "../models/chat.model";
import {
  Send, Paperclip, Search, Pin, Trash2, Pencil, Users, LogOut,
  X, UserPlus, Shield, ShieldOff, Plus, MessageSquare, PenLine,
  BookOpen, Lock,
} from "lucide-react";
import { Info as InfoIcon } from "lucide-react";
import toast from "react-hot-toast";

// ─── Utility ──────────────────────────────────────────────────────────────────
function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const s = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${s} rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/** Icon phân biệt loại conversation */
function ConvIcon({ conv, className = "w-4 h-4" }: { conv: Conversation; className?: string }) {
  if (conv.type === "CLASS") return <BookOpen className={className} />;
  if (conv.type === "GROUP") return <Users className={className} />;
  return null;
}

// ─── Sidebar Group Section ─────────────────────────────────────────────────────
function SidebarSection({
  label,
  icon,
  convs,
  activeConv,
  onSelect,
  convDisplayName,
}: {
  label: string;
  icon: React.ReactNode;
  convs: Conversation[];
  activeConv: Conversation | null;
  onSelect: (c: Conversation) => void;
  convDisplayName: (c: Conversation) => string;
}) {
  if (convs.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
        <span className="text-slate-400">{icon}</span>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      {convs.map((c) => (
        <button
          key={c.conversationId}
          onClick={() => onSelect(c)}
          className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50
            ${activeConv?.conversationId === c.conversationId ? "bg-blue-50 border-l-2 border-l-blue-500" : ""}`}
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm
            ${c.type === "CLASS" ? "bg-emerald-100 text-emerald-700" : c.type === "GROUP" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>
            {c.type !== "PRIVATE"
              ? <ConvIcon conv={c} />
              : convDisplayName(c).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-800 truncate text-sm">{convDisplayName(c)}</p>
            <p className="text-xs text-slate-400 truncate">
              {c.lastMessage
                ? c.lastMessage.isDeleted
                  ? "Tin nhắn đã bị thu hồi"
                  : c.lastMessage.type === "FILE"
                    ? `📎 ${c.lastMessage.fileName || "File đính kèm"}`
                    : c.lastMessage.content
                : c.type !== "PRIVATE"
                  ? `${c.memberIds.length} thành viên`
                  : "Chưa có tin nhắn"}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Pinned Banner ─────────────────────────────────────────────────────────────
/** Hiển thị 1 tin ghim mới nhất trên đầu khu vực chat */
function PinnedBanner({
  pinnedMessages,
  onViewAll,
}: {
  pinnedMessages: Message[];
  onViewAll: () => void;
}) {
  const latest = pinnedMessages[0];
  if (!latest) return null;
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-start gap-2">
      <Pin className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-amber-700 mb-0.5">
          📌 Tin nhắn ghim {pinnedMessages.length > 1 ? `(${pinnedMessages.length})` : ""}
        </p>
        <p className="text-xs text-slate-700 truncate">
          <span className="font-medium text-blue-700 mr-1">{latest.senderName}:</span>
          {latest.content}
        </p>
      </div>
      {pinnedMessages.length > 0 && (
        <button
          onClick={onViewAll}
          className="text-xs text-amber-600 hover:text-amber-800 whitespace-nowrap font-medium"
        >
          Xem tất cả
        </button>
      )}
    </div>
  );
}

// ─── User Picker Modal ─────────────────────────────────────────────────────────
function UserPickerModal({
  title, allUsers, excludeIds, onConfirm, onClose, confirmLabel = "Xác nhận",
}: {
  title: string;
  allUsers: ChatUser[];
  excludeIds: string[];
  onConfirm: (selected: string[]) => Promise<void>;
  onClose: () => void;
  confirmLabel?: string;
}) {
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const filtered = allUsers.filter(
    (u) =>
      !excludeIds.includes(u.userId) &&
      (keyword === "" ||
        u.fullName.toLowerCase().includes(keyword.toLowerCase()) ||
        (u.studentId || "").toLowerCase().includes(keyword.toLowerCase()) ||
        u.userId.toLowerCase().includes(keyword.toLowerCase())),
  );

  const toggle = (uid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selected.size === 0) { toast.error("Chọn ít nhất 1 người"); return; }
    setLoading(true);
    try { await onConfirm([...selected]); } finally { setLoading(false); }
  };

  return (
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[420px] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <span className="font-semibold text-slate-800">{title}</span>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên hoặc mã sinh viên..."
              className="flex-1 bg-transparent text-sm focus:outline-none" autoFocus />
          </div>
        </div>
        {selected.size > 0 && (
          <div className="px-4 py-2 border-b flex flex-wrap gap-1.5">
            {[...selected].map((uid) => {
              const u = allUsers.find((x) => x.userId === uid);
              return (
                <span key={uid} onClick={() => toggle(uid)}
                  className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full cursor-pointer hover:bg-blue-200">
                  {u?.fullName || uid} <X className="w-3 h-3" />
                </span>
              );
            })}
          </div>
        )}
        <div className="flex-1 overflow-y-auto py-1">
          {filtered.length === 0 && <p className="text-center text-slate-400 text-sm py-6">Không tìm thấy</p>}
          {filtered.map((u) => (
            <button key={u.userId} onClick={() => toggle(u.userId)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors ${selected.has(u.userId) ? "bg-blue-50" : ""}`}>
              <div className={`w-5 h-5 rounded flex-shrink-0 border-2 transition-colors ${selected.has(u.userId) ? "bg-blue-600 border-blue-600" : "border-slate-300"} flex items-center justify-center`}>
                {selected.has(u.userId) && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <Avatar name={u.fullName} size="sm" />
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{u.fullName}</p>
                <p className="text-xs text-slate-400 truncate">{u.studentId ? `${u.studentId} · ` : ""}{u.role}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="p-4 border-t flex gap-2">
          <button onClick={onClose} className="flex-1 border rounded-xl py-2 text-sm text-slate-600 hover:bg-slate-50">Hủy</button>
          <button onClick={handleConfirm} disabled={loading || selected.size === 0}
            className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Đang xử lý..." : `${confirmLabel} (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Group Modal ────────────────────────────────────────────────────────
function CreateGroupModal({ allUsers, currentUserId, onCreated, onClose }: {
  allUsers: ChatUser[];
  currentUserId: string;
  onCreated: (conv: Conversation) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"name" | "pick">("name");
  const [groupName, setGroupName] = useState("");

  const handlePickConfirm = async (ids: string[]) => {
    if (!groupName.trim()) { toast.error("Nhập tên nhóm trước"); setStep("name"); return; }
    try {
      const conv = await chatService.createGroup({ name: groupName.trim(), memberIds: ids });
      toast.success("Tạo nhóm thành công");
      onCreated(conv);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Tạo nhóm thất bại");
    }
  };

  if (step === "pick") {
    return (
      <UserPickerModal title="Chọn thành viên nhóm (tối thiểu 2)"
        allUsers={allUsers} excludeIds={[currentUserId]}
        onConfirm={handlePickConfirm} onClose={() => setStep("name")} confirmLabel="Tạo nhóm" />
    );
  }

  return (
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-96 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <span className="font-semibold text-slate-800">Tạo nhóm chat</span>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Tên nhóm</label>
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && groupName.trim() && setStep("pick")}
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Nhập tên nhóm..." autoFocus />
          </div>
          <button onClick={() => { if (!groupName.trim()) { toast.error("Nhập tên nhóm"); return; } setStep("pick"); }}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
            <Users className="w-4 h-4" /> Chọn thành viên
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Rename Group Modal ────────────────────────────────────────────────────────
function RenameGroupModal({ current, onConfirm, onClose }: {
  current: string;
  onConfirm: (name: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(current);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Tên nhóm không được để trống"); return; }
    setLoading(true);
    try { await onConfirm(name.trim()); } finally { setLoading(false); }
  };

  return (
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-96 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-slate-800">Đổi tên nhóm</span>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4" autoFocus />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border rounded-xl py-2 text-sm text-slate-600 hover:bg-slate-50">Hủy</button>
          <button onClick={handleSubmit} disabled={loading || !name.trim()}
            className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ChatView ─────────────────────────────────────────────────────────────
export default function ChatView() {
  const { user } = useAuthStore();
  const {
    conversations, activeConv, messages, loading,
    loadConversations, openConversation, sendMessage, sendFile,
    editMessage, deleteMessage, pinMessage, unpinMessage,
    searchMessages, displayName, convDisplayName, userCache,
  } = useChat();

  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msg: Message } | null>(null);

  const allUsers = Object.values(userCache);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Tải danh sách tin ghim khi chuyển conversation
  useEffect(() => {
    if (!activeConv) { setPinnedMessages([]); return; }
    chatService.getPinnedMessages(activeConv.conversationId)
      .then(setPinnedMessages)
      .catch(() => setPinnedMessages([]));
  }, [activeConv?.conversationId]);

  // ── Kiểm tra quyền theo nghiệp vụ ──────────────────────────────────────────
  /** Chỉ TEACHER/ADMIN hệ thống mới được ghim tin nhắn */
  const canPin = user?.role === "TEACHER" || user?.role === "ADMIN";

  /** Admin nhóm (group role) — dùng cho quản lý thành viên */
  const isGroupAdmin = activeConv?.adminIds.includes(user?.userId || "") ?? false;

  /** Chỉnh sửa/thu hồi: người gửi HOẶC admin nhóm */
  const canEditOrDelete = (msg: Message) =>
    msg.senderId === user?.userId || isGroupAdmin;

  /** Chỉ TEACHER/ADMIN hệ thống mới tạo được nhóm */
  const canCreateGroup = user?.role === "ADMIN" || user?.role === "TEACHER";

  /** CLASS conversation: không cho phép rời hoặc xoá (do hệ thống quản lý) */
  const isClassConv = activeConv?.type === "CLASS";

  // ── Phân nhóm sidebar ──────────────────────────────────────────────────────
  const kw = sidebarSearch.toLowerCase().trim();
  const filteredAll = conversations.filter((c) =>
    kw === "" || convDisplayName(c).toLowerCase().includes(kw)
  );
  const classConvs  = filteredAll.filter((c) => c.type === "CLASS");
  const privateConvs = filteredAll.filter((c) => c.type === "PRIVATE");
  const groupConvs  = filteredAll.filter((c) => c.type === "GROUP");

  // Danh sách user chưa có chat PRIVATE để gợi ý "Bắt đầu chat"
  const suggestedDirectUsers = sidebarSearch
    ? allUsers.filter(
        (u) =>
          u.userId !== user?.userId &&
          (u.fullName.toLowerCase().includes(kw) ||
            (u.studentId || "").toLowerCase().includes(kw)) &&
          !conversations.some(
            (c) => c.type === "PRIVATE" && c.memberIds.includes(u.userId)
          )
      )
    : [];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim()) return;
    try { await sendMessage(input); setInput(""); }
    catch { toast.error("Gửi thất bại"); }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { await sendFile(file); toast.success("Đã gửi file"); }
    catch { toast.error("Gửi file thất bại"); }
    e.target.value = "";
  };

  const handleEdit = (msg: Message) => {
    setEditingId(msg.messageId);
    setEditContent(msg.content);
    setContextMenu(null);
  };

  const submitEdit = async () => {
    if (!editingId) return;
    try { await editMessage(editingId, editContent); setEditingId(null); setEditContent(""); }
    catch (e: any) { toast.error(e?.response?.data?.message || "Chỉnh sửa thất bại"); }
  };

  const handleDelete = async (msg: Message) => {
    try { await deleteMessage(msg.messageId); setContextMenu(null); }
    catch (e: any) { toast.error(e?.response?.data?.message || "Thu hồi thất bại"); }
  };

  const handlePin = async (msg: Message) => {
    try {
      // Lấy trạng thái mới nhất từ messages state (tránh dùng snapshot cũ từ contextMenu)
      const freshMsg = messages.find((m) => m.messageId === msg.messageId) ?? msg;
      if (freshMsg.isPinned) {
        await unpinMessage(freshMsg.messageId);
        // Reload danh sách ghim từ server sau khi bỏ ghim
        if (activeConv) {
          const pins = await chatService.getPinnedMessages(activeConv.conversationId);
          setPinnedMessages(pins);
        }
        toast.success("Đã bỏ ghim");
      } else {
        await pinMessage(freshMsg.messageId);
        // Reload danh sách ghim từ server sau khi ghim
        if (activeConv) {
          const pins = await chatService.getPinnedMessages(activeConv.conversationId);
          setPinnedMessages(pins);
        }
        toast.success("Đã ghim tin nhắn");
      }
      setContextMenu(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Thao tác ghim thất bại");
    }
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    const res = await searchMessages(searchKeyword);
    setSearchResults(res);
  };

  const handleShowPinnedModal = async () => {
    if (!activeConv) return;
    const pins = await chatService.getPinnedMessages(activeConv.conversationId);
    setPinnedMessages(pins);
    setShowPinned(true);
  };

  const handleLeave = async () => {
    if (!activeConv || isClassConv) return;
    try { await chatService.leaveGroup(activeConv.conversationId); toast.success("Đã rời nhóm"); loadConversations(); }
    catch { toast.error("Thất bại"); }
  };

  const handleDeleteGroup = async () => {
    if (!activeConv || !window.confirm("Xác nhận xóa nhóm?")) return;
    try { await chatService.deleteGroup(activeConv.conversationId); toast.success("Đã xoá nhóm"); loadConversations(); }
    catch { toast.error("Thất bại"); }
  };

  const handleRemoveMember = async (targetId: string) => {
    if (!activeConv) return;
    try { await chatService.removeMember(activeConv.conversationId, targetId); toast.success("Đã xóa thành viên"); loadConversations(); }
    catch (e: any) { toast.error(e?.response?.data?.message || "Thất bại"); }
  };

  const handlePromote = async (targetId: string) => {
    if (!activeConv) return;
    try { await chatService.promoteAdmin(activeConv.conversationId, targetId); toast.success("Đã nâng quyền admin"); loadConversations(); }
    catch (e: any) { toast.error(e?.response?.data?.message || "Thất bại"); }
  };

  const handleDemote = async (targetId: string) => {
    if (!activeConv) return;
    try { await chatService.demoteAdmin(activeConv.conversationId, targetId); toast.success("Đã hạ quyền admin"); loadConversations(); }
    catch (e: any) { toast.error(e?.response?.data?.message || "Thất bại"); }
  };

  const handleRename = async (newName: string) => {
    if (!activeConv) return;
    await chatService.renameGroup(activeConv.conversationId, newName);
    toast.success("Đã đổi tên nhóm");
    setShowRename(false);
    loadConversations();
  };

  const handleOpenDirect = async (targetUserId: string) => {
    try {
      const conv = await chatService.openDirect(targetUserId);
      await loadConversations();
      openConversation(conv);
    } catch { toast.error("Không thể mở chat"); }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-slate-50 relative" onClick={() => setContextMenu(null)}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-72 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-slate-800">Tin nhắn</span>
            {canCreateGroup && (
              <button onClick={() => setShowCreateGroup(true)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600" title="Tạo nhóm">
                <Users className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input value={sidebarSearch} onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Tìm cuộc trò chuyện..."
              className="flex-1 bg-transparent text-xs focus:outline-none text-slate-700 placeholder:text-slate-400" />
            {sidebarSearch && (
              <button onClick={() => setSidebarSearch("")}><X className="w-3 h-3 text-slate-400" /></button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Chat lớp học */}
          <SidebarSection label="Chat lớp" icon={<BookOpen className="w-3.5 h-3.5" />}
            convs={classConvs} activeConv={activeConv} onSelect={openConversation} convDisplayName={convDisplayName} />

          {/* Chat cá nhân */}
          <SidebarSection label="Chat cá nhân" icon={<MessageSquare className="w-3.5 h-3.5" />}
            convs={privateConvs} activeConv={activeConv} onSelect={openConversation} convDisplayName={convDisplayName} />

          {/* Chat nhóm */}
          <SidebarSection label="Chat nhóm" icon={<Users className="w-3.5 h-3.5" />}
            convs={groupConvs} activeConv={activeConv} onSelect={openConversation} convDisplayName={convDisplayName} />

          {/* Không có gì */}
          {filteredAll.length === 0 && suggestedDirectUsers.length === 0 && (
            <p className="text-center text-slate-400 text-xs mt-8 px-4">
              {sidebarSearch ? "Không tìm thấy" : "Chưa có cuộc trò chuyện"}
            </p>
          )}

          {/* Gợi ý bắt đầu chat trực tiếp */}
          {suggestedDirectUsers.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bắt đầu chat</span>
              </div>
              {suggestedDirectUsers.map((u) => (
                <button key={u.userId} onClick={() => handleOpenDirect(u.userId)}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 border-b border-slate-50 text-slate-600">
                  <Avatar name={u.fullName} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{u.fullName}</p>
                    <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Bắt đầu chat
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── Chat Area ─────────────────────────────────────────────────── */}
      {!activeConv ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
          <MessageSquare className="w-12 h-12 text-slate-300" />
          <p>Chọn cuộc trò chuyện để bắt đầu</p>
          {canCreateGroup && (
            <button onClick={() => setShowCreateGroup(true)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-xl px-4 py-2 hover:bg-blue-50">
              <Plus className="w-4 h-4" /> Tạo nhóm mới
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm
              ${activeConv.type === "CLASS" ? "bg-emerald-100 text-emerald-700"
                : activeConv.type === "GROUP" ? "bg-violet-100 text-violet-700"
                : "bg-blue-100 text-blue-700"}`}>
              {activeConv.type !== "PRIVATE"
                ? <ConvIcon conv={activeConv} />
                : convDisplayName(activeConv).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800 text-sm">{convDisplayName(activeConv)}</p>
              <p className="text-xs text-slate-400">
                {activeConv.type === "CLASS" && "Nhóm lớp học · "}
                {activeConv.type !== "PRIVATE" && `${activeConv.memberIds.length} thành viên`}
                {activeConv.type === "PRIVATE" && "Chat cá nhân"}
                {isGroupAdmin && activeConv.type !== "CLASS" && (
                  <span className="ml-1 text-blue-500">· Admin nhóm</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowSearch(!showSearch)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="Tìm kiếm tin nhắn">
                <Search className="w-4 h-4" />
              </button>
              <button onClick={handleShowPinnedModal}
                className={`p-2 rounded-lg hover:bg-slate-100 text-slate-500 relative ${pinnedMessages.length > 0 ? "text-amber-500" : ""}`}
                title="Tin nhắn đã ghim">
                <Pin className="w-4 h-4" />
                {pinnedMessages.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {pinnedMessages.length}
                  </span>
                )}
              </button>
              <button onClick={() => setShowInfo(!showInfo)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="Thông tin">
                <InfoIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pinned Banner — hiển thị tin ghim mới nhất */}
          {pinnedMessages.length > 0 && (
            <PinnedBanner pinnedMessages={pinnedMessages} onViewAll={handleShowPinnedModal} />
          )}

          {/* Message Search Bar */}
          {showSearch && (
            <div className="bg-white border-b px-4 py-2 flex gap-2">
              <input value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Tìm kiếm tin nhắn..."
                className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <button onClick={handleSearch} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm">Tìm</button>
              <button onClick={() => { setShowSearch(false); setSearchResults([]); setSearchKeyword(""); }}
                className="text-slate-500 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
          )}

          {searchResults.length > 0 && showSearch && (
            <div className="bg-yellow-50 border-b px-4 py-2 max-h-40 overflow-y-auto">
              <p className="text-xs font-medium text-yellow-700 mb-1">Kết quả ({searchResults.length})</p>
              {searchResults.map((m) => (
                <div key={m.messageId} className="text-sm text-slate-700 py-1 border-b last:border-0">
                  <span className="font-medium text-blue-700 mr-1">{m.senderName}:</span>
                  {m.content}
                </div>
              ))}
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {loading && <p className="text-center text-slate-400 text-sm">Đang tải...</p>}
            {[...messages].reverse().map((msg) => {
              const isMe = msg.senderId === user?.userId;
              const hasActions = !msg.isDeleted && (canEditOrDelete(msg) || canPin);
              return (
                <div key={msg.messageId} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                  <div className={`flex items-end gap-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="max-w-xs lg:max-w-md relative"
                      onContextMenu={(e) => { e.preventDefault(); if (!msg.isDeleted) setContextMenu({ x: e.clientX, y: e.clientY, msg }); }}>
                      {!isMe && <p className="text-xs text-slate-500 mb-0.5 ml-1">{msg.senderName}</p>}
                      <div className={`rounded-2xl px-3 py-2 text-sm
                        ${msg.isDeleted ? "bg-slate-100 text-slate-400 italic"
                          : isMe ? "bg-blue-600 text-white"
                          : "bg-white text-slate-800 border"}`}>
                        {msg.type === "FILE" && !msg.isDeleted ? (
                          (() => {
                            const isImage = msg.fileName && /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(msg.fileName);
                            return isImage ? (
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer">
                                <img
                                  src={msg.fileUrl}
                                  alt={msg.fileName || "Ảnh"}
                                  className="max-w-[220px] max-h-[180px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}
                                />
                              </a>
                            ) : (
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer"
                                className={`flex items-center gap-1 underline ${isMe ? "text-blue-100" : "text-blue-600"}`}>
                                <Paperclip className="w-3 h-3" />
                                {msg.fileName || "File đính kèm"}
                              </a>
                            );
                          })()
                        ) : (
                          <span>{msg.isDeleted ? "Tin nhắn đã bị thu hồi" : msg.content}</span>
                        )}
                        <div className={`flex items-center gap-1 mt-0.5 text-xs ${isMe ? "text-blue-200" : "text-slate-400"}`}>
                          <span>{new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                          {msg.isEdited && <span>· đã chỉnh sửa</span>}
                          {msg.isPinned && <Pin className="w-3 h-3 text-amber-400" />}
                        </div>
                      </div>
                    </div>
                    {hasActions && (
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-slate-200 text-slate-500 mb-1 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setContextMenu({ x: rect.left, y: rect.bottom, msg });
                        }}>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <circle cx="10" cy="4" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="10" cy="16" r="1.5" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Edit Mode */}
          {editingId && (
            <div className="bg-yellow-50 border-t px-4 py-2 flex items-center gap-2">
              <span className="text-xs text-yellow-700 font-medium">Chỉnh sửa:</span>
              <input value={editContent} onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitEdit()}
                className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none" autoFocus />
              <button onClick={submitEdit} className="text-blue-600 text-sm font-medium">Lưu</button>
              <button onClick={() => setEditingId(null)}><X className="w-4 h-4 text-slate-500" /></button>
            </div>
          )}

          {/* Input Area */}
          <div className="bg-white border-t px-4 py-3 flex items-center gap-2">
            <input type="file" ref={fileRef} className="hidden" onChange={handleFile} />
            <button onClick={() => fileRef.current?.click()}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg">
              <Paperclip className="w-4 h-4" />
            </button>
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Nhập tin nhắn..."
              className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <button onClick={handleSend} disabled={!input.trim()}
              className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Info Panel ──────────────────────────────────────────────── */}
      {showInfo && activeConv && (
        <aside className="w-72 bg-white border-l flex flex-col overflow-y-auto">
          <div className="p-4 border-b flex items-center justify-between">
            <span className="font-semibold text-slate-800">Thông tin</span>
            <button onClick={() => setShowInfo(false)}><X className="w-4 h-4 text-slate-500" /></button>
          </div>
          <div className="p-4 space-y-4">
            <div className="text-center py-2">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-2
                ${activeConv.type === "CLASS" ? "bg-emerald-100 text-emerald-700"
                  : activeConv.type === "GROUP" ? "bg-violet-100 text-violet-700"
                  : "bg-blue-100 text-blue-700"}`}>
                {activeConv.type !== "PRIVATE"
                  ? <ConvIcon conv={activeConv} className="w-6 h-6" />
                  : convDisplayName(activeConv).charAt(0).toUpperCase()}
              </div>
              <p className="font-semibold text-slate-800">{convDisplayName(activeConv)}</p>
              {activeConv.type !== "PRIVATE" && (
                <p className="text-xs text-slate-400">{activeConv.memberIds.length} thành viên</p>
              )}
              {activeConv.type === "CLASS" && (
                <span className="inline-flex items-center gap-1 mt-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" /> Nhóm lớp học
                </span>
              )}
              {activeConv.type === "GROUP" && isGroupAdmin && (
                <button onClick={() => setShowRename(true)}
                  className="mt-2 flex items-center gap-1 mx-auto text-xs text-blue-600 hover:text-blue-700">
                  <PenLine className="w-3 h-3" /> Đổi tên nhóm
                </button>
              )}
            </div>

            {activeConv.type !== "PRIVATE" && (
              <>
                {/* Thêm thành viên — chỉ GROUP admin, không áp dụng cho CLASS */}
                {isGroupAdmin && activeConv.type === "GROUP" && (
                  <button onClick={() => setShowAddMember(true)}
                    className="w-full flex items-center justify-center gap-2 border border-blue-200 text-blue-600 text-sm py-2 rounded-xl hover:bg-blue-50">
                    <UserPlus className="w-4 h-4" /> Thêm thành viên
                  </button>
                )}

                {/* Members list */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Thành viên ({activeConv.memberIds.length})
                  </p>
                  <div className="space-y-1">
                    {activeConv.memberIds.map((uid) => {
                      const isUidAdmin = activeConv.adminIds.includes(uid);
                      const isCreator = uid === activeConv.createdBy;
                      const memberName = displayName(uid);
                      return (
                        <div key={uid} className="flex items-center gap-2 py-1.5 group">
                          <Avatar name={memberName} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{memberName}</p>
                            {isCreator ? (
                              <span className="text-xs text-amber-600 font-medium">
                                {activeConv.type === "CLASS" ? "Giáo viên phụ trách" : "Người tạo"}
                              </span>
                            ) : isUidAdmin ? (
                              <span className="text-xs text-blue-600 font-medium">Admin nhóm</span>
                            ) : null}
                          </div>
                          {/* Quản lý thành viên — chỉ GROUP admin, không áp dụng CLASS */}
                          {isGroupAdmin && uid !== user?.userId && activeConv.type === "GROUP" && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!isUidAdmin ? (
                                <button onClick={() => handlePromote(uid)} title="Nâng quyền admin nhóm"
                                  className="p-1 rounded hover:bg-blue-50 text-blue-500">
                                  <Shield className="w-3.5 h-3.5" />
                                </button>
                              ) : !isCreator ? (
                                <button onClick={() => handleDemote(uid)} title="Hạ quyền admin nhóm"
                                  className="p-1 rounded hover:bg-orange-50 text-orange-500">
                                  <ShieldOff className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                              {!isCreator && (
                                <button onClick={() => handleRemoveMember(uid)} title="Xóa khỏi nhóm"
                                  className="p-1 rounded hover:bg-red-50 text-red-500">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chỉ GROUP mới có nút rời/xoá — CLASS không cho */}
                {activeConv.type === "GROUP" && (
                  <div className="pt-2 space-y-1 border-t">
                    <button onClick={handleLeave}
                      className="flex items-center gap-2 w-full text-sm text-orange-600 hover:bg-orange-50 px-2 py-2 rounded-lg">
                      <LogOut className="w-4 h-4" /> Rời nhóm
                    </button>
                    {isGroupAdmin && (
                      <button onClick={handleDeleteGroup}
                        className="flex items-center gap-2 w-full text-sm text-red-600 hover:bg-red-50 px-2 py-2 rounded-lg">
                        <Trash2 className="w-4 h-4" /> Xoá nhóm
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      )}

      {/* ── Pinned Messages Modal ─────────────────────────────────────── */}
      {showPinned && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-30">
          <div className="bg-white rounded-xl shadow-xl w-96 max-h-[60vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-amber-500" />
                <span className="font-semibold">Tin nhắn đã ghim ({pinnedMessages.length})</span>
              </div>
              <button onClick={() => setShowPinned(false)}><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {pinnedMessages.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">Chưa có tin nhắn ghim</p>
              )}
              {pinnedMessages.map((m) => (
                <div key={m.messageId} className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm flex items-start gap-2">
                  <Pin className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium text-blue-700 block mb-0.5">{m.senderName}</span>
                    <span className="text-slate-700">{m.content}</span>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(m.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  {/* Chỉ TEACHER/ADMIN mới có nút bỏ ghim trong modal */}
                  {canPin && (
                    <button onClick={() => handlePin(m)} title="Bỏ ghim"
                      className="p-1 hover:bg-amber-100 rounded text-amber-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Create Group Modal ──────────────────────────────────────── */}
      {showCreateGroup && user && (
        <CreateGroupModal allUsers={allUsers} currentUserId={user.userId}
          onCreated={(conv) => { setShowCreateGroup(false); loadConversations(); openConversation(conv); }}
          onClose={() => setShowCreateGroup(false)} />
      )}

      {/* ── Add Member Modal ────────────────────────────────────────── */}
      {showAddMember && activeConv && (
        <UserPickerModal title="Thêm thành viên vào nhóm"
          allUsers={allUsers} excludeIds={activeConv.memberIds}
          onConfirm={async (ids) => {
            await chatService.addMembers(activeConv.conversationId, ids);
            toast.success(`Đã thêm ${ids.length} thành viên`);
            setShowAddMember(false);
            loadConversations();
          }}
          onClose={() => setShowAddMember(false)} confirmLabel="Thêm" />
      )}

      {/* ── Rename Group Modal ──────────────────────────────────────── */}
      {showRename && activeConv && (
        <RenameGroupModal current={activeConv.name || ""}
          onConfirm={handleRename} onClose={() => setShowRename(false)} />
      )}

      {/* ── Context Menu ────────────────────────────────────────────── */}
      {contextMenu && (
        <div className="fixed z-50 bg-white border rounded-lg shadow-lg py-1 min-w-36"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}>
          {/* Chỉnh sửa: người gửi HOẶC admin nhóm */}
          {canEditOrDelete(contextMenu.msg) && !contextMenu.msg.isDeleted && (
            <button onClick={() => handleEdit(contextMenu.msg)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
              <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
            </button>
          )}
          {/* Thu hồi: người gửi HOẶC admin nhóm */}
          {canEditOrDelete(contextMenu.msg) && !contextMenu.msg.isDeleted && (
            <button onClick={() => handleDelete(contextMenu.msg)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" /> Thu hồi
            </button>
          )}
          {/* Ghim/Bỏ ghim: chỉ TEACHER hoặc ADMIN (system role) */}
          {canPin && !contextMenu.msg.isDeleted && (() => {
            const freshMsg = messages.find((m) => m.messageId === contextMenu.msg.messageId) ?? contextMenu.msg;
            return (
              <button onClick={() => handlePin(freshMsg)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                <Pin className="w-3.5 h-3.5 text-amber-500" />
                {freshMsg.isPinned ? "Bỏ ghim" : "Ghim tin nhắn"}
              </button>
            );
          })()}
          {!canEditOrDelete(contextMenu.msg) && !canPin && (
            <p className="px-3 py-2 text-xs text-slate-400">Không có thao tác</p>
          )}
        </div>
      )}
    </div>
  );
}

function Info(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}