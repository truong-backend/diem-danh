package com.example.diem_danh.service.impl;

import com.example.diem_danh.dto.request.CreateGroupRequest;
import com.example.diem_danh.dto.request.SendMessageRequest;
import com.example.diem_danh.dto.response.ConversationResponse;
import com.example.diem_danh.dto.response.MessageResponse;
import com.example.diem_danh.dto.response.UserResponse;
import com.example.diem_danh.model.node.ConversationNode;
import com.example.diem_danh.model.node.MessageNode;
import com.example.diem_danh.model.node.PinnedMessageNode;
import com.example.diem_danh.model.node.UserNode;
import com.example.diem_danh.repository.ConversationRepository;
import com.example.diem_danh.repository.MessageRepository;
import com.example.diem_danh.repository.PinnedMessageRepository;
import com.example.diem_danh.repository.UserRepository;
import com.example.diem_danh.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final PinnedMessageRepository pinnedMessageRepository;
    private final UserRepository userRepository;

    // ─── Conversation ─────────────────────────────────────────────────────────

    @Override
    public ConversationResponse getOrCreatePrivateConversation(String currentUserId, String targetUserId) {
        return conversationRepository
                .findDirectConversation(currentUserId, targetUserId)
                .map(this::toConversationResponse)
                .orElseGet(() -> {
                    ConversationNode c = ConversationNode.builder()
                            .conversationId(UUID.randomUUID().toString())
                            .type("PRIVATE")
                            .createdBy(currentUserId)
                            .createdAt(LocalDateTime.now())
                            .memberIds(new ArrayList<>(List.of(currentUserId, targetUserId)))
                            .adminIds(new ArrayList<>())
                            .pinnedMessageIds(new ArrayList<>())
                            .build();
                    return toConversationResponse(conversationRepository.save(c));
                });
    }

    @Override
    public ConversationResponse createGroup(String currentUserId, String currentUserRole, CreateGroupRequest req) {
        if (!"ADMIN".equalsIgnoreCase(currentUserRole) && !"TEACHER".equalsIgnoreCase(currentUserRole)) {
            throw new RuntimeException("Chỉ giáo viên hoặc admin hệ thống mới có thể tạo nhóm chat");
        }
        if (req.getMemberIds() == null || req.getMemberIds().isEmpty()) {
            throw new RuntimeException("Nhóm phải có ít nhất 1 thành viên khác");
        }

        List<String> members = new ArrayList<>(req.getMemberIds());
        if (!members.contains(currentUserId)) members.add(0, currentUserId);
        if (members.size() < 2) throw new RuntimeException("Nhóm phải có ít nhất 2 thành viên");

        ConversationNode c = ConversationNode.builder()
                .conversationId(UUID.randomUUID().toString())
                .type("GROUP")
                .name(req.getName())
                .createdBy(currentUserId)
                .createdAt(LocalDateTime.now())
                .memberIds(members)
                .adminIds(new ArrayList<>(List.of(currentUserId)))
                .pinnedMessageIds(new ArrayList<>())
                .build();
        return toConversationResponse(conversationRepository.save(c));
    }

    /**
     * Tạo CLASS conversation tự động khi tạo lớp học.
     * Giáo viên phụ trách là admin nhóm.
     */
    @Override
    @Transactional
    public ConversationResponse createClassConversation(String classId, String className,
                                                        String teacherUserId,
                                                        List<String> studentUserIds) {
        // Nếu đã tồn tại CLASS conversation cho lớp này → trả về luôn
        Optional<ConversationNode> existing = conversationRepository.findByClassId(classId);
        if (existing.isPresent()) return toConversationResponse(existing.get());

        List<String> memberIds = new ArrayList<>();
        memberIds.add(teacherUserId);
        if (studentUserIds != null) {
            studentUserIds.forEach(sid -> {
                if (!memberIds.contains(sid)) memberIds.add(sid);
            });
        }

        ConversationNode c = ConversationNode.builder()
                .conversationId(UUID.randomUUID().toString())
                .type("CLASS")
                .classId(classId)
                .name(className)
                .createdBy(teacherUserId)
                .createdAt(LocalDateTime.now())
                .memberIds(memberIds)
                .adminIds(new ArrayList<>(List.of(teacherUserId)))
                .pinnedMessageIds(new ArrayList<>())
                .build();
        return toConversationResponse(conversationRepository.save(c));
    }

    /**
     * Thêm sinh viên vào CLASS conversation của lớp khi enroll.
     * Không kiểm tra quyền admin (gọi nội bộ từ ClassRoomService).
     */
    @Override
    @Transactional
    public void addMemberToClassConversation(String classId, String studentUserId) {
        conversationRepository.findByClassId(classId).ifPresent(conv -> {
            if (!conv.getMemberIds().contains(studentUserId)) {
                conv.getMemberIds().add(studentUserId);
                conversationRepository.save(conv);
            }
        });
    }

    @Override
    public void deleteGroup(String currentUserId, String conversationId) {
        ConversationNode c = findConv(conversationId);
        assertGroupAdmin(c, currentUserId, "Chỉ admin nhóm mới có thể xoá nhóm");
        conversationRepository.delete(c);
    }

    @Override
    public void leaveGroup(String currentUserId, String conversationId) {
        ConversationNode c = findConv(conversationId);
        c.getMemberIds().remove(currentUserId);
        c.getAdminIds().remove(currentUserId);
        conversationRepository.save(c);
    }

    @Override
    public void addMember(String currentUserId, String conversationId, String targetUserId) {
        ConversationNode c = findConv(conversationId);
        assertGroupAdmin(c, currentUserId, "Chỉ admin nhóm mới có thể thêm thành viên");
        if (!c.getMemberIds().contains(targetUserId)) {
            c.getMemberIds().add(targetUserId);
            conversationRepository.save(c);
        }
    }

    @Override
    public void addMembers(String currentUserId, String conversationId, List<String> targetUserIds) {
        ConversationNode c = findConv(conversationId);
        assertGroupAdmin(c, currentUserId, "Chỉ admin nhóm mới có thể thêm thành viên");
        boolean changed = false;
        for (String uid : targetUserIds) {
            if (!c.getMemberIds().contains(uid)) {
                c.getMemberIds().add(uid);
                changed = true;
            }
        }
        if (changed) conversationRepository.save(c);
    }

    @Override
    public void removeMember(String currentUserId, String conversationId, String targetUserId) {
        ConversationNode c = findConv(conversationId);
        assertGroupAdmin(c, currentUserId, "Chỉ admin nhóm mới có thể xoá thành viên");
        if (targetUserId.equals(c.getCreatedBy()))
            throw new RuntimeException("Không thể xóa người tạo nhóm");
        c.getMemberIds().remove(targetUserId);
        c.getAdminIds().remove(targetUserId);
        conversationRepository.save(c);
    }

    @Override
    public void promoteAdmin(String currentUserId, String conversationId, String targetUserId) {
        ConversationNode c = findConv(conversationId);
        assertGroupAdmin(c, currentUserId, "Chỉ admin nhóm mới có thể nâng quyền");
        if (!c.getMemberIds().contains(targetUserId))
            throw new RuntimeException("Người dùng không phải thành viên nhóm");
        if (!c.getAdminIds().contains(targetUserId)) {
            c.getAdminIds().add(targetUserId);
            conversationRepository.save(c);
        }
    }

    @Override
    public void demoteAdmin(String currentUserId, String conversationId, String targetUserId) {
        ConversationNode c = findConv(conversationId);
        assertGroupAdmin(c, currentUserId, "Chỉ admin nhóm mới có thể hạ quyền");
        if (targetUserId.equals(c.getCreatedBy()))
            throw new RuntimeException("Không thể hạ quyền người tạo nhóm");
        c.getAdminIds().remove(targetUserId);
        conversationRepository.save(c);
    }

    @Override
    public void renameGroup(String currentUserId, String conversationId, String newName) {
        ConversationNode c = findConv(conversationId);
        assertGroupAdmin(c, currentUserId, "Chỉ admin nhóm mới có thể đổi tên nhóm");
        if (newName == null || newName.isBlank())
            throw new RuntimeException("Tên nhóm không được để trống");
        c.setName(newName.trim());
        conversationRepository.save(c);
    }

    @Override
    public List<ConversationResponse> getMyConversations(String userId, String userRole) {
        List<ConversationNode> all = conversationRepository.findByMemberId(userId);
        return all.stream()
                .map(this::toConversationResponseWithLastMessage)
                .collect(Collectors.toList());
    }

    @Override
    public ConversationResponse getConversation(String conversationId) {
        return toConversationResponse(findConv(conversationId));
    }

    // ─── Members ──────────────────────────────────────────────────────────────

    @Override
    public List<UserResponse> getConversationMembers(String conversationId) {
        ConversationNode c = findConv(conversationId);
        return c.getMemberIds().stream()
                .map(uid -> userRepository.findByUserId(uid).orElse(null))
                .filter(Objects::nonNull)
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserResponse> searchUsersForChat(String keyword) {
        String kw = (keyword == null || keyword.isBlank()) ? null : keyword.trim();
        return userRepository.searchUsersForChat(kw, 0, 50)
                .stream()
                .filter(UserNode::isActive)
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }

    // ─── Messages ─────────────────────────────────────────────────────────────

    @Override
    public MessageResponse sendMessage(String senderId, SendMessageRequest req) {
        ConversationNode conv = findConv(req.getConversationId());
        if (!conv.getMemberIds().contains(senderId))
            throw new RuntimeException("Bạn không phải thành viên của cuộc trò chuyện này");

        UserNode sender = userRepository.findByUserId(senderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        MessageNode msg = MessageNode.builder()
                .messageId(UUID.randomUUID().toString())
                .conversationId(req.getConversationId())
                .senderId(senderId)
                .senderName(sender.getFullName())
                .content(req.getContent())
                .type(req.getType() != null ? req.getType() : "TEXT")
                .fileUrl(req.getFileUrl())
                .fileName(req.getFileName())
                .edited(false)
                .deleted(false)
                .pinned(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return toMessageResponse(messageRepository.save(msg));
    }

    @Override
    public MessageResponse editMessage(String callerId, String messageId, String newContent) {
        MessageNode msg = findMsg(messageId);
        ConversationNode conv = findConv(msg.getConversationId());

        boolean isSender = msg.getSenderId().equals(callerId);
        boolean isGroupAdmin = conv.getAdminIds().contains(callerId);

        if (!isSender && !isGroupAdmin)
            throw new RuntimeException("Chỉ người gửi hoặc admin nhóm mới có thể chỉnh sửa tin nhắn");

        msg.setContent(newContent);
        msg.setEdited(true);
        msg.setUpdatedAt(LocalDateTime.now());
        return toMessageResponse(messageRepository.save(msg));
    }

    @Override
    public MessageResponse deleteMessage(String callerId, String messageId) {
        MessageNode msg = findMsg(messageId);
        ConversationNode conv = findConv(msg.getConversationId());

        boolean isSender = msg.getSenderId().equals(callerId);
        boolean isGroupAdmin = conv.getAdminIds().contains(callerId);

        if (!isSender && !isGroupAdmin)
            throw new RuntimeException("Chỉ người gửi hoặc admin nhóm mới có thể thu hồi tin nhắn");

        msg.setDeleted(true);
        msg.setContent("Tin nhắn đã bị thu hồi");
        msg.setUpdatedAt(LocalDateTime.now());
        return toMessageResponse(messageRepository.save(msg));
    }

    /**
     * Ghim tin nhắn theo nghiệp vụ:
     * - User phải là thành viên conversation
     * - Role hệ thống phải là TEACHER hoặc ADMIN
     * - Lưu bản ghi PinnedMessage riêng (không sửa Message trực tiếp)
     */
    @Override
    @Transactional
    public MessageResponse pinMessage(String callerId, String callerRole, String messageId) {
        // Kiểm tra quyền ghim theo role hệ thống
        if (!"TEACHER".equalsIgnoreCase(callerRole) && !"ADMIN".equalsIgnoreCase(callerRole)) {
            throw new RuntimeException("Chỉ giáo viên hoặc admin mới có quyền ghim tin nhắn");
        }

        MessageNode msg = findMsg(messageId);
        ConversationNode conv = findConv(msg.getConversationId());

        // User phải là thành viên conversation
        if (!conv.getMemberIds().contains(callerId)) {
            throw new RuntimeException("Bạn không phải thành viên của cuộc trò chuyện này");
        }

        // Tạo bản ghi PinnedMessage nếu chưa ghim
        if (!pinnedMessageRepository.existsByMessageId(messageId)) {
            PinnedMessageNode pin = PinnedMessageNode.builder()
                    .pinnedId(UUID.randomUUID().toString())
                    .messageId(messageId)
                    .conversationId(conv.getConversationId())
                    .pinnedBy(callerId)
                    .pinnedAt(LocalDateTime.now())
                    .build();
            pinnedMessageRepository.save(pin);

            // Cập nhật flag isPinned trên MessageNode và danh sách pinnedMessageIds
            msg.setPinned(true);
            msg.setUpdatedAt(LocalDateTime.now());
            messageRepository.save(msg);

            if (!conv.getPinnedMessageIds().contains(messageId)) {
                conv.getPinnedMessageIds().add(messageId);
                conversationRepository.save(conv);
            }
        }

        return toMessageResponse(msg);
    }

    /**
     * Bỏ ghim tin nhắn.
     * Điều kiện: TEACHER hoặc ADMIN, phải là thành viên.
     */
    @Override
    @Transactional
    public MessageResponse unpinMessage(String callerId, String callerRole, String messageId) {
        if (!"TEACHER".equalsIgnoreCase(callerRole) && !"ADMIN".equalsIgnoreCase(callerRole)) {
            throw new RuntimeException("Chỉ giáo viên hoặc admin mới có quyền bỏ ghim tin nhắn");
        }

        MessageNode msg = findMsg(messageId);
        ConversationNode conv = findConv(msg.getConversationId());

        if (!conv.getMemberIds().contains(callerId)) {
            throw new RuntimeException("Bạn không phải thành viên của cuộc trò chuyện này");
        }

        // Xóa bản ghi PinnedMessage
        pinnedMessageRepository.deleteByMessageId(messageId);

        // Cập nhật flag và danh sách
        msg.setPinned(false);
        msg.setUpdatedAt(LocalDateTime.now());
        messageRepository.save(msg);

        conv.getPinnedMessageIds().remove(messageId);
        conversationRepository.save(conv);

        return toMessageResponse(msg);
    }

    @Override
    public List<MessageResponse> getMessages(String conversationId, int page, int size) {
        int skip = page * size;
        return messageRepository.findByConversationId(conversationId, skip, size)
                .stream().map(this::toMessageResponse).collect(Collectors.toList());
    }

    @Override
    public List<MessageResponse> searchMessages(String conversationId, String keyword) {
        return messageRepository.searchMessages(conversationId, keyword)
                .stream().map(this::toMessageResponse).collect(Collectors.toList());
    }

    /**
     * Lấy danh sách tin nhắn đã ghim từ bảng PinnedMessage,
     * sau đó join với MessageNode để trả về nội dung đầy đủ.
     * Sắp xếp theo pinnedAt giảm dần.
     */
    @Override
    public List<MessageResponse> getPinnedMessages(String conversationId) {
        List<PinnedMessageNode> pins = pinnedMessageRepository.findByConversationId(conversationId);
        return pins.stream()
                .map(pin -> messageRepository.findByMessageId(pin.getMessageId()).orElse(null))
                .filter(Objects::nonNull)
                .map(this::toMessageResponse)
                .collect(Collectors.toList());
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private void assertGroupAdmin(ConversationNode conv, String userId, String message) {
        if (!conv.getAdminIds().contains(userId))
            throw new RuntimeException(message);
    }

    private ConversationNode findConv(String conversationId) {
        return conversationRepository.findByConversationId(conversationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuộc trò chuyện"));
    }

    private MessageNode findMsg(String messageId) {
        return messageRepository.findByMessageId(messageId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tin nhắn"));
    }

    private MessageResponse getLastMessage(String conversationId) {
        List<MessageNode> msgs = messageRepository.findByConversationId(conversationId, 0, 1);
        return msgs.isEmpty() ? null : toMessageResponse(msgs.get(0));
    }

    private MessageResponse toMessageResponse(MessageNode m) {
        return MessageResponse.builder()
                .messageId(m.getMessageId())
                .conversationId(m.getConversationId())
                .senderId(m.getSenderId())
                .senderName(m.getSenderName())
                .content(m.isDeleted() ? "Tin nhắn đã bị thu hồi" : m.getContent())
                .type(m.getType())
                .fileUrl(m.isDeleted() ? null : m.getFileUrl())
                .fileName(m.isDeleted() ? null : m.getFileName())
                .isEdited(m.isEdited())
                .isDeleted(m.isDeleted())
                .isPinned(m.isPinned())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }

    private ConversationResponse toConversationResponse(ConversationNode c) {
        return ConversationResponse.builder()
                .conversationId(c.getConversationId())
                .type(c.getType())
                .name(c.getName())
                .classId(c.getClassId())
                .avatarUrl(c.getAvatarUrl())
                .createdBy(c.getCreatedBy())
                .createdAt(c.getCreatedAt())
                .memberIds(c.getMemberIds())
                .adminIds(c.getAdminIds())
                .pinnedMessageIds(c.getPinnedMessageIds())
                .build();
    }

    private ConversationResponse toConversationResponseWithLastMessage(ConversationNode c) {
        ConversationResponse resp = toConversationResponse(c);
        resp.setLastMessage(getLastMessage(c.getConversationId()));
        return resp;
    }

    private UserResponse toUserResponse(UserNode u) {
        return UserResponse.builder()
                .id(u.getId())
                .userId(u.getUserId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .role(u.getRole())
                .studentId(u.getStudentId())
                .phone(u.getPhone())
                .active(u.isActive())
                .createdAt(u.getCreatedAt() != null ? u.getCreatedAt().toString() : null)
                .build();
    }
}