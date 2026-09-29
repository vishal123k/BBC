<?php
/**
 * BROWN BOYS CUSTOMS (BBC) — CONTACT FORM HANDLER
 * Phase 9: Contact Page PHP Mailer for Hostinger deployment
 */

// Strict error reporting for debugging, silent in production
error_reporting(0);
ini_set('display_errors', '0');

// Response defaults
$response = [
    'success' => false,
    'message' => 'An unexpected error occurred. Please try again or call us directly at 289-367-5047.'
];

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// 1. Anti-Spam Honeypot Verification
// If the hidden 'website_hp' field contains any value, it was filled by a spam bot
if (!empty($_POST['website_hp'])) {
    // Return simulated success so bots do not retry, but do not send email
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Thank you! Your message has been received.'
    ]);
    exit;
}

// 2. Extract and Sanitize Inputs (support JSON or form POST, first_name or fname)
if (empty($_POST)) {
    $rawInput = file_get_contents('php://input');
    $jsonData = json_decode($rawInput, true);
    if (is_array($jsonData)) {
        $_POST = $jsonData;
    }
}

$firstName = isset($_POST['first_name']) ? trim(strip_tags($_POST['first_name'])) : (isset($_POST['fname']) ? trim(strip_tags($_POST['fname'])) : '');
$lastName  = isset($_POST['last_name']) ? trim(strip_tags($_POST['last_name'])) : (isset($_POST['lname']) ? trim(strip_tags($_POST['lname'])) : '');
$email     = isset($_POST['email']) ? trim(filter_var($_POST['email'], FILTER_SANITIZE_EMAIL)) : '';
$phone     = isset($_POST['phone']) ? trim(strip_tags($_POST['phone'])) : '';
$service   = isset($_POST['service']) ? trim(strip_tags($_POST['service'])) : (isset($_POST['subject']) ? trim(strip_tags($_POST['subject'])) : '');
$vehicle   = isset($_POST['vehicle']) ? trim(strip_tags($_POST['vehicle'])) : '';
$message   = isset($_POST['message']) ? trim(htmlspecialchars($_POST['message'], ENT_QUOTES, 'UTF-8')) : '';

// 3. Validation
$errors = [];

if (empty($firstName)) {
    $errors[] = 'First name is required.';
}
if (empty($lastName)) {
    $errors[] = 'Last name is required.';
}
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please provide a valid email address.';
}
if (empty($message) || strlen($message) < 5) {
    $errors[] = 'Please enter a message of at least 5 characters.';
}

// Prevent Email Header Injection Attacks
$cleanFirstName = str_replace(["\r", "\n"], '', $firstName);
$cleanLastName  = str_replace(["\r", "\n"], '', $lastName);
$cleanEmail     = str_replace(["\r", "\n"], '', $email);
$cleanPhone     = str_replace(["\r", "\n"], '', $phone);
$cleanService   = str_replace(["\r", "\n"], '', $service);
$cleanVehicle   = str_replace(["\r", "\n"], '', $vehicle);
$cleanMessage   = $message;
$fullName       = trim($cleanFirstName . ' ' . $cleanLastName);

if (!empty($errors)) {
    $isAjax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') || (isset($_POST['ajax']) && $_POST['ajax'] === '1');
    if ($isAjax) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
        exit;
    } else {
        header('Location: contact.html?status=error&msg=' . urlencode(implode(' ', $errors)) . '#contact-form-section');
        exit;
    }
}

// 4. Construct Email
$settingsFile = __DIR__ . '/data/settings.json';
$recipient = 'brownboyscustoms@gmail.com'; // Production recipient — overridden by settings.json
if (file_exists($settingsFile)) {
    $settingsData = json_decode(file_get_contents($settingsFile), true);
    if (!empty($settingsData['notification_email'])) {
        $recipient = $settingsData['notification_email'];
    }
}

$subject   = 'New Contact Inquiry: ' . $fullName . ' — Brown Boys Customs';
$submitTime = date('F j, Y, g:i a e');
$userIp     = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';

// Log inquiry to data/inquiries.json for Admin Dashboard
$inquiriesFile = __DIR__ . '/data/inquiries.json';
$inquiryRecord = [
    'id'        => 'INQ-' . date('ymd') . '-' . substr(uniqid(), -4),
    'date'      => date('Y-m-d H:i:s'),
    'name'      => $fullName,
    'email'     => $cleanEmail,
    'phone'     => $cleanPhone,
    'service'   => $cleanService,
    'vehicle'   => $cleanVehicle,
    'message'   => $cleanMessage,
    'ip'        => $userIp,
    'status'    => 'new'
];

// Ensure directory exists
if (!is_dir(__DIR__ . '/data')) {
    @mkdir(__DIR__ . '/data', 0777, true);
}

// Write inquiry with atomic file lock and fallback
$written = false;
if (file_exists($inquiriesFile)) {
    $fp = @fopen($inquiriesFile, 'c+');
    if ($fp) {
        @flock($fp, LOCK_EX);
        $existingInquiries = json_decode(stream_get_contents($fp), true) ?: [];
        array_unshift($existingInquiries, $inquiryRecord);
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($existingInquiries, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        @flock($fp, LOCK_UN);
        fclose($fp);
        $written = true;
    }
}
if (!$written) {
    $existing = file_exists($inquiriesFile) ? (json_decode(@file_get_contents($inquiriesFile), true) ?: []) : [];
    array_unshift($existing, $inquiryRecord);
    @file_put_contents($inquiriesFile, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

// HTML Email Body
$htmlBody = '
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background-color: #080b18; color: #e2e8f0; margin: 0; padding: 20px; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #121835; border: 1px solid #1e294f; border-radius: 8px; overflow: hidden; }
    .email-header { background: linear-gradient(135deg, #0d1229 0%, #161f42 100%); padding: 25px; border-bottom: 2px solid #c9a13d; }
    .email-header h2 { margin: 0; color: #ffffff; font-size: 20px; letter-spacing: 1px; }
    .email-header p { margin: 5px 0 0; color: #c9a13d; font-size: 13px; font-weight: bold; }
    .email-body { padding: 25px; line-height: 1.6; }
    .info-row { margin-bottom: 12px; }
    .info-label { font-weight: bold; color: #94a3b8; font-size: 13px; text-transform: uppercase; }
    .info-value { color: #ffffff; font-size: 15px; margin-top: 2px; }
    .message-box { background-color: #090d20; border: 1px solid #1e294f; border-left: 3px solid #c9a13d; padding: 15px; border-radius: 4px; margin-top: 15px; color: #f8fafc; font-size: 14px; white-space: pre-wrap; }
    .email-footer { background-color: #090d20; padding: 15px 25px; font-size: 12px; color: #64748b; border-top: 1px solid #1e294f; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h2>BROWN BOYS CUSTOMS (BBC)</h2>
      <p>NEW WEBSITE CONTACT FORM SUBMISSION</p>
    </div>
    <div class="email-body">
      <div class="info-row">
        <div class="info-label">Customer Name</div>
        <div class="info-value">' . htmlspecialchars($fullName) . '</div>
      </div>
      <div class="info-row">
        <div class="info-label">Email Address</div>
        <div class="info-value"><a href="mailto:' . htmlspecialchars($cleanEmail) . '" style="color: #c9a13d;">' . htmlspecialchars($cleanEmail) . '</a></div>
      </div>
      <div class="info-row">
        <div class="info-label">Mobile Phone</div>
        <div class="info-value">' . ($cleanPhone ? htmlspecialchars($cleanPhone) : '<span style="color:#64748b;">Not provided</span>') . '</div>
      </div>
      <div class="info-row" style="margin-top: 18px;">
        <div class="info-label">Customer Message / Inquiry</div>
        <div class="message-box">' . nl2br($message) . '</div>
      </div>
    </div>
    <div class="email-footer">
      Submitted on ' . $submitTime . ' | IP: ' . htmlspecialchars($userIp) . '<br>
      Brown Boys Customs • Westwood Mall, Unit 1C30, 7215 Goreway Dr, Mississauga ON
    </div>
  </div>
</body>
</html>
';

// 5. Send Mail using unified mailer (Gmail SMTP if configured, fallback to mail)
require_once __DIR__ . '/mailer.php';
$mailRes = send_bbc_email($recipient, 'Brown Boys Customs Admin', $subject, $htmlBody, strip_tags($htmlBody), $cleanEmail, $fullName);
$mailSent = !empty($mailRes['success']);

// 6. Handle Response
$isAjax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') || (isset($_POST['ajax']) && $_POST['ajax'] === '1');

if ($mailSent) {
    if ($isAjax) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'message' => 'Thank you, ' . htmlspecialchars($cleanFirstName) . '! Your message has been received. Our Mississauga crew will get back to you shortly.'
        ]);
        exit;
    } else {
        header('Location: contact.html?status=success&name=' . urlencode($cleanFirstName) . '#contact-form-section');
        exit;
    }
} else {
    // If mail() failed on server (e.g. SMTP config pending on Hostinger), return helpful fallback notice without CMS crash screen
    if ($isAjax) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true, // Return friendly success acknowledgment to user
            'message' => 'Thank you, ' . htmlspecialchars($cleanFirstName) . '! Your inquiry has been logged. You can also reach us directly at 289-367-5047.'
        ]);
        exit;
    } else {
        header('Location: contact.html?status=success&name=' . urlencode($cleanFirstName) . '#contact-form-section');
        exit;
    }
}
