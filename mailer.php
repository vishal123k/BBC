<?php
/**
 * Brown Boys Customs (BBC) — Unified Mailer
 * Supports PHPMailer via Gmail SMTP (with Google App Password)
 * and falls back to PHP mail() if SMTP is not configured or disabled.
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

require_once __DIR__ . '/lib/phpmailer/Exception.php';
require_once __DIR__ . '/lib/phpmailer/PHPMailer.php';
require_once __DIR__ . '/lib/phpmailer/SMTP.php';

function send_bbc_email($toEmail, $toName, $subject, $htmlContent, $plainContent = '', $replyToEmail = '', $replyToName = '') {
    $settingsFile = __DIR__ . '/data/settings.json';
    $settings = file_exists($settingsFile) ? (json_decode(file_get_contents($settingsFile), true) ?: []) : [];

    $smtpEnabled = !empty($settings['smtp_enabled']);
    $smtpHost    = $settings['smtp_host'] ?? 'smtp.gmail.com';
    $smtpPort    = intval($settings['smtp_port'] ?? 587);
    $smtpSecure  = $settings['smtp_secure'] ?? 'tls';
    $smtpUser    = $settings['smtp_user'] ?? ($settings['notification_email'] ?? 'brownboyscustoms@gmail.com');
    $smtpPass    = trim($settings['smtp_pass'] ?? '');

    $fromEmail   = $settings['production_email'] ?? 'brownboyscustoms@gmail.com';
    $fromName    = $settings['store_name'] ?? 'Brown Boys Customs';

    // 1. Try sending via PHPMailer SMTP if App Password is provided
    if (!empty($smtpPass)) {
        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host       = $smtpHost;
            $mail->SMTPAuth   = true;
            $mail->Username   = $smtpUser;
            $mail->Password   = $smtpPass;
            $mail->SMTPSecure = ($smtpSecure === 'ssl') ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = $smtpPort;
            $mail->CharSet    = 'UTF-8';
            $mail->Timeout    = 15;

            // Sender and Recipient
            $mail->setFrom($fromEmail, $fromName);
            $mail->addAddress($toEmail, $toName ?: $toEmail);

            if (!empty($replyToEmail)) {
                $mail->addReplyTo($replyToEmail, $replyToName ?: $replyToEmail);
            } else {
                $mail->addReplyTo($fromEmail, $fromName);
            }

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlContent;
            $mail->AltBody = $plainContent ?: strip_tags($htmlContent);

            $mail->send();
            return ['success' => true, 'mode' => 'smtp'];
        } catch (\Throwable $e) {
            error_log('BBC PHPMailer error: ' . $e->getMessage());
            // Proceed to fallback
        }
    }

    // 2. Fallback to standard PHP mail()
    $fromHeader  = 'From: ' . $fromName . ' <' . $fromEmail . '>';
    $replyHeader = !empty($replyToEmail) ? ('Reply-To: ' . $replyToEmail) : ('Reply-To: ' . $fromEmail);
    $mailerHdr   = 'X-Mailer: PHP/' . phpversion();

    $headers = [
        $fromHeader,
        $replyHeader,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        $mailerHdr
    ];

    $mailSent = @mail($toEmail, $subject, $htmlContent, implode("\r\n", $headers));
    return ['success' => (bool)$mailSent, 'mode' => 'php_mail'];
}
