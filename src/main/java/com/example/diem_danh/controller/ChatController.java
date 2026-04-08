package com.example.diem_danh.controller;

import com.example.diem_danh.dto.request.CreateGroupRequest;
import com.example.diem_danh.dto.request.SendMessageRequest;
import com.example.diem_danh.dto.response.ApiResponse;
import com.example.diem_danh.dto.response.ConversationResponse;
import com.example.diem_danh.dto.response.MessageResponse;
import com.example.diem_danh.security.UserPrincipal;
import com.example.diem_danh.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // ─── Conversations ────────────────────────────────────────────────────────

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> myConversations(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.getMyConversations(principal.getUserId())));
    }

    @PostMapping("/conversations/direct/{targetUserId}")
    public ResponseEntity<ApiResponse<ConversationResponse>> openDirect(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String targetUserId) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.getOrCreateDirectConversation(principal.getUserId(), targetUserId)));
    }

    @PostMapping("/conversations/group")
    public ResponseEntity<ApiResponse<ConversationResponse>> createGroup(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateGroupRequest req) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.createGroup(principal.getUserId(), req)));
    }

    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<ConversationResponse>> getConversation(
            @PathVariable String conversationId) {
        return ResponseEntity.ok(ApiResponse.success(chatService.getConversation(conversationId)));
    }

    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String conversationId) {
        chatService.deleteGroup(principal.getUserId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success("Đã xoá nhóm", null));
    }

    @PostMapping("/conversations/{conversationId}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveGroup(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String conversationId) {
        chatService.leaveGroup(principal.getUserId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success("Đã rời nhóm", null));
    }

    @PostMapping("/conversations/{conversationId}/members/{targetUserId}")
    public ResponseEntity<ApiResponse<Void>> addMember(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String conversationId,
            @PathVariable String targetUserId) {
        chatService.addMember(principal.getUserId(), conversationId, targetUserId);
        return ResponseEntity.ok(ApiResponse.success("Đã thêm thành viên", null));
    }

    @DeleteMapping("/conversations/{conversationId}/members/{targetUserId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String conversationId,
            @PathVariable String targetUserId) {
        chatService.removeMember(principal.getUserId(), conversationId, targetUserId);
        return ResponseEntity.ok(ApiResponse.success("Đã xoá thành viên", null));
    }

    // ─── Messages ─────────────────────────────────────────────────────────────

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getMessages(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.getMessages(conversationId, page, size)));
    }

    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody SendMessageRequest req) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.sendMessage(principal.getUserId(), req)));
    }

    @PutMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<MessageResponse>> editMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String messageId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.editMessage(principal.getUserId(), messageId, body.get("content"))));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<MessageResponse>> deleteMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String messageId) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.deleteMessage(principal.getUserId(), messageId)));
    }

    @PostMapping("/messages/{messageId}/pin")
    public ResponseEntity<ApiResponse<MessageResponse>> pinMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String messageId) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.pinMessage(principal.getUserId(), messageId)));
    }

    @PostMapping("/messages/{messageId}/unpin")
    public ResponseEntity<ApiResponse<MessageResponse>> unpinMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String messageId) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.unpinMessage(principal.getUserId(), messageId)));
    }

    @GetMapping("/conversations/{conversationId}/messages/search")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> searchMessages(
            @PathVariable String conversationId,
            @RequestParam String keyword) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.searchMessages(conversationId, keyword)));
    }

    @GetMapping("/conversations/{conversationId}/messages/pinned")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> pinnedMessages(
            @PathVariable String conversationId) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.getPinnedMessages(conversationId)));
    }

    /** Upload file đính kèm — lưu vào uploads/, trả về URL */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadFile(
            @RequestParam("file") MultipartFile file) throws IOException {
        String dir = "uploads/chat/";
        new File(dir).mkdirs();
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path path = Paths.get(dir + fileName);
        Files.write(path, file.getBytes());
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "fileUrl", "/api/chat/files/" + fileName,
                "fileName", file.getOriginalFilename()
        )));
    }

    @GetMapping("/files/{fileName}")
    public ResponseEntity<byte[]> getFile(@PathVariable String fileName) throws IOException {
        Path path = Paths.get("uploads/chat/" + fileName);
        byte[] bytes = Files.readAllBytes(path);
        String contentType = Files.probeContentType(path);
        return ResponseEntity.ok()
                .header("Content-Type", contentType != null ? contentType : "application/octet-stream")
                .header("Content-Disposition", "inline; filename=\"" + fileName + "\"")
                .body(bytes);
    }
}