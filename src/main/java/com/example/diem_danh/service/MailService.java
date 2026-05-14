package com.example.diem_danh.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendPasswordResetEmail(String toEmail, String fullName, String resetLink) {
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("[Hệ thống Điểm danh] Yêu cầu đặt lại mật khẩu");
            helper.setText(buildHtmlContent(fullName, resetLink), true);

            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildHtmlContent(String fullName, String resetLink) {
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head><meta charset="UTF-8"></head>
                <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
                    <tr><td align="center">
                      <table width="480" cellpadding="0" cellspacing="0"
                             style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                        <!-- Header -->
                        <tr>
                          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
                            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Hệ thống Điểm danh</h1>
                            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Đặt lại mật khẩu</p>
                          </td>
                        </tr>
                        <!-- Body -->
                        <tr>
                          <td style="padding:36px 32px;">
                            <p style="margin:0 0 16px;color:#111827;font-size:16px;">Xin chào <strong>%s</strong>,</p>
                            <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
                              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
                              Nhấn vào nút bên dưới để tiến hành. Link chỉ có hiệu lực trong <strong>15 phút</strong>.
                            </p>
                            <div style="text-align:center;margin:32px 0;">
                              <a href="%s"
                                 style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);
                                        color:#ffffff;text-decoration:none;padding:14px 36px;
                                        border-radius:8px;font-size:15px;font-weight:600;">
                                Đặt lại mật khẩu
                              </a>
                            </div>
                            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Hoặc copy link sau vào trình duyệt:</p>
                            <p style="margin:0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;
                                       padding:10px 14px;font-size:12px;color:#374151;word-break:break-all;">%s</p>
                            <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0;">
                            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                              Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
                              Tài khoản của bạn vẫn an toàn.
                            </p>
                          </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                          <td style="background:#f9fafb;padding:20px 32px;text-align:center;
                                     border-top:1px solid #f3f4f6;">
                            <p style="margin:0;color:#9ca3af;font-size:12px;">© 2024 Hệ thống Điểm danh</p>
                          </td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(fullName, resetLink, resetLink);
    }
}