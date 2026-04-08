package com.example.diem_danh.service.impl;

import com.example.diem_danh.dto.request.CreateGroupRequest;
import com.example.diem_danh.dto.request.SendMessageRequest;
import com.example.diem_danh.dto.response.ConversationResponse;
import com.example.diem_danh.dto.response.MessageResponse;
import com.example.diem_danh.model.node.ConversationNode;
import com.example.diem_danh.model.node.MessageNode;
import com.example.diem_danh.model.node.UserNode;
import com.example.diem_danh.repository.ConversationRepository;
import com.example.diem_danh.repository.MessageRepository;
import com.example.diem_danh.repository.UserRepository;
import com.example.diem_danh.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    // ─── Conversation ────────────────────────────────────────────────────────

    @Override
    public ConversationResponse getOrCreateDirectConversation(String currentUserId, String targetUserId) {
        return conversationRepository
                .findDirectConversation(currentUserId, targetUserId)
                .map(this::toConversationResponse)
                .orElseGet(() -> {
                    ConversationNode c = ConversationNode.builder()
                            .conversationId(UUID.randomUUID().toString())
                            .isGroup(false)
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
    public ConversationResponse createGroup(String currentUserId, CreateGroupRequest req) {
        List<String> members = new ArrayList<>(req.getMemberIds());
        if (!members.contains(currentUserId)) members.add(0, currentUserId);

        ConversationNode c = ConversationNode.builder()
                .conversationId(UUID.randomUUID().toString())
                .name(req.getName())
                .isGroup(true)
                .createdBy(currentUserId)
                .createdAt(LocalDateTime.now())
                .memberIds(members)
                .adminIds(new ArrayList<>(List.of(currentUserId)))
                .pinnedMessageIds(new ArrayList<>())
                .build();
        return toConversationResponse(conversationRepository.save(c));
    }

    @Override
    public void deleteGroup(String currentUserId, String conversationId) {
        ConversationNode c = findConv(conversationId);
        if (!c.getAdminIds().contains(currentUserId))
            throw new RuntimeException("Chỉ admin nhóm mới có thể xoá nhóm");
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
        if (!c.getAdminIds().contains(currentUserId))
            throw new RuntimeException("Chỉ admin nhóm mới có thể thêm thành viên");
        if (!c.getMemberIds().contains(targetUserId)) {
            c.getMemberIds().add(targetUserId);
            conversationRepository.save(c);
        }
    }

    @Override
    public void removeMember(String currentUserId, String conversationId, String targetUserId) {
        ConversationNode c = findConv(conversationId);
        if (!c.getAdminIds().contains(currentUserId))
            throw new RuntimeException("Chỉ admin nhóm mới có thể xoá thành viên");
        c.getMemberIds().remove(targetUserId);
        c.getAdminIds().remove(targetUserId);
        conversationRepository.save(c);
    }

    @Override
    public List<ConversationResponse> getMyConversations(String userId) {
        return conversationRepository.findByMemberId(userId)
                .stream().map(this::toConversationResponse).collect(Collectors.toList());
    }

    @Override
    public ConversationResponse getConversation(String conversationId) {
        return toConversationResponse(findConv(conversationId));
    }

    // ─── Messages ────────────────────────────────────────────────────────────

    @Override
    public MessageResponse sendMessage(String senderId, SendMessageRequest req) {
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
                .isEdited(false)
                .isDeleted(false)
                .isPinned(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return toMessageResponse(messageRepository.save(msg));
    }

    @Override
    public MessageResponse editMessage(String senderId, String messageId, String newContent) {
        MessageNode msg = findMsg(messageId);
        if (!msg.getSenderId().equals(senderId))
            throw new RuntimeException("Chỉ người gửi mới có thể chỉnh sửa tin nhắn");
        msg.setContent(newContent);
        msg.setEdited(true);
        msg.setUpdatedAt(LocalDateTime.now());
        return toMessageResponse(messageRepository.save(msg));
    }

    @Override
    public MessageResponse deleteMessage(String senderId, String messageId) {
        MessageNode msg = findMsg(messageId);
        if (!msg.getSenderId().equals(senderId))
            throw new RuntimeException("Chỉ người gửi mới có thể thu hồi tin nhắn");
        msg.setDeleted(true);
        msg.setContent("Tin nhắn đã bị thu hồi");
        msg.setUpdatedAt(LocalDateTime.now());
        return toMessageResponse(messageRepository.save(msg));
    }

    @Override
    public MessageResponse pinMessage(String senderId, String messageId) {
        MessageNode msg = findMsg(messageId);
        msg.setPinned(true);
        msg.setUpdatedAt(LocalDateTime.now());

        ConversationNode c = findConv(msg.getConversationId());
        if (!c.getPinnedMessageIds().contains(messageId)) {
            c.getPinnedMessageIds().add(messageId);
            conversationRepository.save(c);
        }
        return toMessageResponse(messageRepository.save(msg));
    }

    @Override
    public MessageResponse unpinMessage(String senderId, String messageId) {
        MessageNode msg = findMsg(messageId);
        msg.setPinned(false);
        msg.setUpdatedAt(LocalDateTime.now());

        ConversationNode c = findConv(msg.getConversationId());
        c.getPinnedMessageIds().remove(messageId);
        conversationRepository.save(c);
        return toMessageResponse(messageRepository.save(msg));
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

    @Override
    public List<MessageResponse> getPinnedMessages(String conversationId) {
        return messageRepository.findPinnedMessages(conversationId)
                .stream().map(this::toMessageResponse).collect(Collectors.toList());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private ConversationNode findConv(String conversationId) {
        return conversationRepository.findByConversationId(conversationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuộc trò chuyện"));
    }

    private MessageNode findMsg(String messageId) {
        return messageRepository.findByMessageId(messageId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tin nhắn"));
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
                .name(c.getName())
                .isGroup(c.isGroup())
                .avatarUrl(c.getAvatarUrl())
                .createdBy(c.getCreatedBy())
                .createdAt(c.getCreatedAt())
                .memberIds(c.getMemberIds())
                .adminIds(c.getAdminIds())
                .pinnedMessageIds(c.getPinnedMessageIds())
                .build();
    }
}