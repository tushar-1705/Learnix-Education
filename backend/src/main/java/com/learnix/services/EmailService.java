package com.learnix.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.learnix.models.Announcement;
import com.learnix.models.UpcomingEvent;
import com.learnix.models.Users;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;
    
    private String getLogoUrl() {
        // TODO: Replace with your actual logo URL or base64 encoded image
        // Example with URL: return "https://yourdomain.com/logo.png";
        // Example with base64: return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...";
        
        // For now, using a styled placeholder that matches your brand colors
        return "https://via.placeholder.com/200x60/667eea/FFFFFF?text=LEARNIX";
    }

    private String getEmailTemplate(String content, String title) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset='UTF-8'>" +
                "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "<style>" +
                "  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }" +
                "  .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }" +
                "  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; }" +
                "  .logo { max-width: 200px; height: auto; margin-bottom: 10px; }" +
                "  .header-title { color: #ffffff; font-size: 24px; font-weight: bold; margin: 10px 0; }" +
                "  .content { padding: 40px 30px; color: #333333; line-height: 1.6; }" +
                "  .content h2 { color: #667eea; font-size: 22px; margin-top: 0; }" +
                "  .content p { margin: 15px 0; font-size: 16px; }" +
                "  .highlight-box { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 10px; margin: 20px 0; color: #ffffff; text-align: center; }" +
                "  .info-box { background-color: #e8f4f8; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 5px; }" +
                "  .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; }" +
                "  .footer { background-color: #2d3748; color: #a0aec0; padding: 30px 20px; text-align: center; font-size: 14px; }" +
                "  .footer a { color: #667eea; text-decoration: none; }" +
                "  .divider { height: 2px; background: linear-gradient(90deg, transparent, #667eea, transparent); margin: 30px 0; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "  <div class='email-container'>" +
                "    <div class='header'>" +
                "      <img src='" + getLogoUrl() + "' alt='Learnix Logo' class='logo' />" +
                "      <div class='header-title'>" + title + "</div>" +
                "    </div>" +
                "    <div class='content'>" +
                content +
                "    </div>" +
                "    <div class='divider'></div>" +
                "    <div class='footer'>" +
                "      <p><strong>Learnix Education Portal</strong></p>" +
                "      <p>Empowering Education, Transforming Lives</p>" +
                "      <p style='margin-top: 20px; font-size: 12px;'>This is an automated email. Please do not reply to this message.</p>" +
                "    </div>" +
                "  </div>" +
                "</body>" +
                "</html>";
    }

    public void sendAbsentNotificationEmail(Users student, String date, String teacherName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(String.format("Learnix Education <%s>", fromEmail));
            helper.setTo(student.getEmail());
            helper.setSubject("Absence Notification - " + date);
            
            String emailBody = buildAbsentEmailBody(student.getName(), date, teacherName);
            helper.setText(emailBody, true);
            
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Failed to send absent notification email to " + student.getEmail() + ": " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Failed to send absent notification email to " + student.getEmail() + ": " + e.getMessage());
        }
    }

    private String buildAbsentEmailBody(String studentName, String date, String teacherName) {
        String content = "<h2 style='color: #f5576c;'>⚠️ Absence Notification</h2>" +
                "<p>Dear <strong>" + (studentName != null ? studentName : "Student") + "</strong>,</p>" +
                "<div class='highlight-box'>" +
                "<p style='margin: 0; font-size: 18px;'><strong>You have been marked as ABSENT</strong></p>" +
                "<p style='margin: 10px 0 0 0;'>Date: <strong>" + date + "</strong></p>" +
                "</div>" +
                "<div class='info-box'>" +
                "<p style='margin: 0;'><strong>📧 Contact Your Teacher:</strong></p>" +
                "<p style='margin: 5px 0 0 0;'>If you have any questions or concerns regarding this absence, please contact your teacher: <strong>" + teacherName + "</strong></p>" +
                "</div>" +
                "<p>We hope to see you back in class soon!</p>" +
                "<p>Best regards,<br><strong>Learnix Portal Team</strong></p>";
        
        return getEmailTemplate(content, "Absence Notification");
    }
    
    public void sendAnnouncementEmail(Users student, Announcement announcement) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(String.format("Learnix Education <%s>", fromEmail));
            helper.setTo(student.getEmail());
            helper.setSubject("New Announcement: " + (announcement.getTitle() == null ? "Update" : announcement.getTitle()));

            String emailBody = buildAnnouncementEmailBody(student.getName(), announcement);
            helper.setText(emailBody, true);
            
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Failed to send announcement email to " + student.getEmail() + ": " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Failed to send announcement email to " + student.getEmail() + ": " + e.getMessage());
        }
    }

    private String buildAnnouncementEmailBody(String studentName, Announcement announcement) {
        StringBuilder content = new StringBuilder();
        content.append("<h2 style='color: #667eea;'>📢 New Announcement</h2>");
        content.append("<p>Dear <strong>").append(studentName != null ? studentName : "Student").append("</strong>,</p>");
        content.append("<p>A new announcement has been posted by your teacher.</p>");
        
        if (announcement.getTitle() != null) {
            content.append("<div class='highlight-box'>");
            content.append("<p style='margin: 0; font-size: 20px;'><strong>").append(announcement.getTitle()).append("</strong></p>");
            content.append("</div>");
        }
        
        if (announcement.getCourse() != null && announcement.getCourse().getTitle() != null) {
            content.append("<div class='info-box'>");
            content.append("<p style='margin: 0;'><strong>📚 Course:</strong> ").append(announcement.getCourse().getTitle()).append("</p>");
            content.append("</div>");
        }
        
        if (announcement.getMessage() != null) {
            content.append("<div style='background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;'>");
            content.append("<p style='margin: 0; white-space: pre-wrap;'>").append(announcement.getMessage().replace("\n", "<br>")).append("</p>");
            content.append("</div>");
        }
        
        content.append("<p>Best regards,<br><strong>Learnix Portal Team</strong></p>");
        
        return getEmailTemplate(content.toString(), "New Announcement");
    }
    
    public void sendEventNotificationEmail(Users student, UpcomingEvent event) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(String.format("Learnix Education <%s>", fromEmail));
            helper.setTo(student.getEmail());
            helper.setSubject("New Upcoming Event: " + (event.getTitle() == null ? "Event Notification" : event.getTitle()));

            String emailBody = buildEventNotificationEmailBody(student.getName(), event);
            helper.setText(emailBody, true);
            
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Failed to send event notification email to " + student.getEmail() + ": " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Failed to send event notification email to " + student.getEmail() + ": " + e.getMessage());
        }
    }

    private String buildEventNotificationEmailBody(String studentName, UpcomingEvent event) {
        StringBuilder content = new StringBuilder();
        content.append("<h2 style='color: #f5576c;'>🎉 Upcoming Event</h2>");
        content.append("<p>Dear <strong>").append(studentName != null ? studentName : "Student").append("</strong>,</p>");
        content.append("<p>We are excited to inform you about a new upcoming event!</p>");
        
        if (event.getTitle() != null) {
            content.append("<div class='highlight-box' style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);'>");
            content.append("<p style='margin: 0; font-size: 22px;'><strong>").append(event.getTitle()).append("</strong></p>");
            content.append("</div>");
        }
        
        if (event.getEventAt() != null) {
            java.time.format.DateTimeFormatter formatter = 
                java.time.format.DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm a");
            content.append("<div class='info-box' style='background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; border-left: 4px solid #ffffff;'>");
            content.append("<p style='margin: 0;'><strong>📅 Event Date & Time:</strong></p>");
            content.append("<p style='margin: 10px 0 0 0; font-size: 18px;'><strong>").append(event.getEventAt().format(formatter)).append("</strong></p>");
            content.append("</div>");
        }
        
        if (event.getDescription() != null && !event.getDescription().trim().isEmpty()) {
            content.append("<div style='background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;'>");
            content.append("<p style='margin: 0 0 10px 0; color: #667eea; font-weight: bold;'>📝 Description:</p>");
            content.append("<p style='margin: 0; white-space: pre-wrap;'>").append(event.getDescription().replace("\n", "<br>")).append("</p>");
            content.append("</div>");
        }
        
        content.append("<p style='text-align: center; margin-top: 30px;'><strong style='color: #667eea; font-size: 18px;'>We hope to see you there! 🎊</strong></p>");
        content.append("<p>Best regards,<br><strong>Learnix Portal Team</strong></p>");
        
        return getEmailTemplate(content.toString(), "Upcoming Event");
    }
    
    public void sendOtpEmail(Users user, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(String.format("Learnix Education <%s>", fromEmail));
            helper.setTo(user.getEmail());
            helper.setSubject("Password Reset OTP - Learnix");
            
            String emailBody = buildOtpEmailBody(user.getName(), otp);
            helper.setText(emailBody, true);
            
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Failed to send OTP email to " + user.getEmail() + ": " + e.getMessage());
            throw new RuntimeException("Failed to send OTP email", e);
        } catch (Exception e) {
            System.err.println("Failed to send OTP email to " + user.getEmail() + ": " + e.getMessage());
            throw new RuntimeException("Failed to send OTP email", e);
        }
    }
    
    private String buildOtpEmailBody(String userName, String otp) {
        String content = "<h2 style='color: #667eea;'>🔐 Password Reset Request</h2>" +
                "<p>Dear <strong>" + (userName != null ? userName : "User") + "</strong>,</p>" +
                "<p>You have requested to reset your password for your Learnix account.</p>" +
                "<div class='highlight-box' style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px;'>" +
                "<p style='margin: 0 0 15px 0; font-size: 16px;'>Your One-Time Password (OTP) is:</p>" +
                "<p style='margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 5px; font-family: monospace;'>" + otp + "</p>" +
                "</div>" +
                "<div class='info-box' style='background-color: #fff3cd; border-left-color: #ffc107;'>" +
                "<p style='margin: 0;'><strong>⏰ Important:</strong> This OTP will expire in <strong>10 minutes</strong> for security reasons.</p>" +
                "</div>" +
                "<p>Please enter this OTP on the password reset page to proceed with resetting your password.</p>" +
                "<div style='background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px;'>" +
                "<p style='margin: 0; color: #721c24;'><strong>⚠️ Security Notice:</strong> If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>" +
                "</div>" +
                "<p>Best regards,<br><strong>Learnix Portal Team</strong></p>";
        
        return getEmailTemplate(content, "Password Reset");
    }
}
