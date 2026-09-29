<?php
/**
 * Brown Boys Customs (BBC) — Server-Side Checkout Handler
 * Sends luxury HTML email to CUSTOMER + plain-text alert to ADMIN
 * Compatible with Hostinger Apache / PHP 8.x environments
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

// ─── Only allow POST ──────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed. Use POST.']);
    exit;
}

// ─── Parse JSON body ──────────────────────────────────────────────────────────
$rawInput  = file_get_contents('php://input');
$orderData = json_decode($rawInput, true);
if (!$orderData || !is_array($orderData)) { $orderData = $_POST; }

if (empty($orderData) || empty($orderData['items'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid order payload. Cart items are required.']);
    exit;
}

// ─── Extract order fields ─────────────────────────────────────────────────────
$orderNumber    = $orderData['orderNumber']    ?? ('BBC-' . rand(10000, 99999));
$orderDate      = $orderData['orderDate']      ?? date('F j, Y');
$items          = $orderData['items']          ?? [];
$subtotal       = floatval($orderData['subtotal']    ?? 0);
$discount       = floatval($orderData['discount']    ?? 0);
$shippingFee    = floatval($orderData['shippingFee'] ?? 0);
$shippingMethod = $orderData['shippingMethod'] ?? 'pickup';
$tax            = floatval($orderData['tax']   ?? 0);
$total          = floatval($orderData['total'] ?? ($subtotal - $discount + $shippingFee + $tax));
$paymentMethod  = $orderData['paymentMethod']  ?? 'instore';
$orderNotes     = htmlspecialchars(trim($orderData['orderNotes'] ?? ''), ENT_QUOTES, 'UTF-8');

$billing       = $orderData['billing'] ?? [];
$firstName     = htmlspecialchars(trim($billing['firstName'] ?? ''), ENT_QUOTES, 'UTF-8');
$lastName      = htmlspecialchars(trim($billing['lastName']  ?? ''), ENT_QUOTES, 'UTF-8');
$billingName   = trim("$firstName $lastName");
$billingEmail  = filter_var(trim($billing['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$billingPhone  = htmlspecialchars(trim($billing['phone']     ?? ''), ENT_QUOTES, 'UTF-8');
$billingAddr1  = htmlspecialchars(trim($billing['address1']  ?? ''), ENT_QUOTES, 'UTF-8');
$billingAddr2  = htmlspecialchars(trim($billing['address2']  ?? ''), ENT_QUOTES, 'UTF-8');
$billingCity   = htmlspecialchars(trim($billing['city']      ?? ''), ENT_QUOTES, 'UTF-8');
$billingState  = htmlspecialchars(trim($billing['state']     ?? 'ON'), ENT_QUOTES, 'UTF-8');
$billingPostal = htmlspecialchars(trim($billing['postcode']  ?? ''), ENT_QUOTES, 'UTF-8');
$shipping      = $orderData['shipping'] ?? null;

// Formatted numbers & year (needed in email)
$subtotal_fmt     = number_format($subtotal, 2);
$shippingFee_fmt  = number_format($shippingFee, 2);
$tax_fmt          = number_format($tax, 2);
$total_fmt        = number_format($total, 2);
$year             = date('Y');

// Human-readable labels
$paymentLabel = [
    'instore'     => 'Pay In-Store',
    'credit_card' => 'Credit / Debit Card',
    'e-transfer'  => 'Interac e-Transfer',
    'cash'        => 'Cash on Pickup',
][$paymentMethod] ?? ucwords(str_replace('_', ' ', $paymentMethod));

$shippingLabel = ($shippingMethod === 'pickup')
    ? 'Free In-Store Pickup'
    : 'Delivery — $' . number_format($shippingFee, 2) . ' CAD';

// ─── Save order to data/orders.json ──────────────────────────────────────────
$ordersFile = __DIR__ . '/data/orders.json';
$orderRecord = [
    'orderNumber'    => $orderNumber,
    'date'           => $orderDate,
    'timestamp'      => date('Y-m-d H:i:s'),
    'items'          => $items,
    'subtotal'       => $subtotal,
    'discount'       => $discount,
    'shippingFee'    => $shippingFee,
    'shippingMethod' => $shippingMethod,
    'tax'            => $tax,
    'total'          => $total,
    'paymentMethod'  => $paymentMethod,
    'billing'        => $billing,
    'shipping'       => $shipping,
    'orderNotes'     => $orderData['orderNotes'] ?? '',
    'status'         => 'pending',
];
// Ensure data directory exists
if (!is_dir(__DIR__ . '/data')) {
    @mkdir(__DIR__ . '/data', 0777, true);
}

// ── Atomic write with exclusive lock (safe for concurrent users) and fallback ──
$saved = false;
if (file_exists($ordersFile)) {
    $fp = @fopen($ordersFile, 'c+');
    if ($fp) {
        @flock($fp, LOCK_EX);                          // Wait for exclusive lock
        $existing = json_decode(stream_get_contents($fp), true) ?: [];
        array_unshift($existing, $orderRecord);        // Newest order first
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        @flock($fp, LOCK_UN);                          // Release lock
        fclose($fp);
        $saved = true;
    }
}
if (!$saved) {
    $existing = file_exists($ordersFile) ? (json_decode(@file_get_contents($ordersFile), true) ?: []) : [];
    array_unshift($existing, $orderRecord);
    @file_put_contents($ordersFile, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

// ─── Build item rows (HTML + plain-text) ─────────────────────────────────────
$itemRowsHtml = '';
$itemsText    = '';
foreach ($items as $item) {
    $iName     = htmlspecialchars($item['name'] ?? 'Product', ENT_QUOTES, 'UTF-8');
    $iQty      = intval($item['quantity'] ?? 1);
    $iPrice    = floatval($item['price'] ?? 0);
    $iTotal    = $iPrice * $iQty;
    $iTotalFmt = number_format($iTotal, 2);
    $itemRowsHtml .= "
      <tr>
        <td style='padding:12px 16px;border-bottom:1px solid #2a2a2a;color:#e8e8e8;font-size:14px;'>{$iName}</td>
        <td style='padding:12px 16px;border-bottom:1px solid #2a2a2a;color:#b0b0b0;font-size:14px;text-align:center;'>{$iQty}</td>
        <td style='padding:12px 16px;border-bottom:1px solid #2a2a2a;color:#c8a951;font-size:14px;text-align:right;font-weight:600;'>\${$iTotalFmt} CAD</td>
      </tr>";
    $itemsText .= "  - {$iName} x{$iQty} = \${$iTotalFmt} CAD\n";
}

// Optional discount row
$discountRow = '';
if ($discount > 0) {
    $discFmt = number_format($discount, 2);
    $discountRow = "<tr>
      <td style='padding:6px 0;color:#aaa;font-size:13px;'>Discount</td>
      <td style='padding:6px 0;color:#e57373;text-align:right;font-size:13px;'>-\${$discFmt} CAD</td>
    </tr>";
}

// Optional notes section
$notesSection = '';
if (!empty($orderNotes)) {
    $notesSection = "
  <tr>
    <td style='padding:0 40px 28px;'>
      <p style='margin:0 0 14px;color:#c8a951;font-size:13px;text-transform:uppercase;letter-spacing:2px;font-weight:600;'>Your Notes / Vehicle Info</p>
      <div style='background:#1a1a1a;border-radius:10px;padding:20px;border:1px solid #2a2a2a;color:#b0b0b0;font-size:14px;line-height:1.7;'>{$orderNotes}</div>
    </td>
  </tr>";
}

// Addr2 line
$addr2Line = $billingAddr2 ? "<br>{$billingAddr2}" : '';

// ─── CUSTOMER HTML EMAIL ──────────────────────────────────────────────────────
$customerHtml = "<!DOCTYPE html>
<html lang='en'>
<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
<title>BBC Order Confirmation #{$orderNumber}</title></head>
<body style='margin:0;padding:0;background:#0a0a0a;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;'>
<table width='100%' cellpadding='0' cellspacing='0' style='background:#0a0a0a;padding:30px 0;'>
<tr><td align='center'>
<table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%;background:#111111;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;'>

  <!-- HEADER -->
  <tr>
    <td style='background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:40px 40px 30px;text-align:center;border-bottom:2px solid #c8a951;'>
      <div style='display:inline-block;background:#c8a951;color:#0a0a0a;font-size:22px;font-weight:800;letter-spacing:3px;padding:10px 22px;border-radius:6px;margin-bottom:20px;'>BBC</div>
      <h1 style='margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:1px;'>Order Confirmed!</h1>
      <p style='margin:10px 0 0;color:#c8a951;font-size:14px;letter-spacing:2px;text-transform:uppercase;'>Brown Boys Customs</p>
    </td>
  </tr>

  <!-- GREETING -->
  <tr>
    <td style='padding:36px 40px 20px;'>
      <p style='margin:0 0 12px;color:#e8e8e8;font-size:16px;'>Hi <strong style='color:#c8a951;'>{$firstName}</strong>,</p>
      <p style='margin:0;color:#b0b0b0;font-size:14px;line-height:1.7;'>
        Thank you for choosing Brown Boys Customs! Your order has been received and our team is already on it.
        We'll contact you shortly to confirm pickup or delivery arrangements.
      </p>
    </td>
  </tr>

  <!-- ORDER META -->
  <tr>
    <td style='padding:0 40px 28px;'>
      <table width='100%' cellpadding='0' cellspacing='0' style='background:#1a1a1a;border-radius:10px;overflow:hidden;border:1px solid #2a2a2a;'>
        <tr>
          <td style='padding:14px 20px;border-bottom:1px solid #2a2a2a;'>
            <span style='color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;'>Order Number</span><br>
            <strong style='color:#c8a951;font-size:17px;letter-spacing:1px;'>{$orderNumber}</strong>
          </td>
          <td style='padding:14px 20px;border-bottom:1px solid #2a2a2a;text-align:right;'>
            <span style='color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;'>Date</span><br>
            <strong style='color:#e8e8e8;font-size:14px;'>{$orderDate}</strong>
          </td>
        </tr>
        <tr>
          <td style='padding:14px 20px;'>
            <span style='color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;'>Payment</span><br>
            <strong style='color:#e8e8e8;font-size:14px;'>{$paymentLabel}</strong>
          </td>
          <td style='padding:14px 20px;text-align:right;'>
            <span style='color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;'>Shipping</span><br>
            <strong style='color:#e8e8e8;font-size:14px;'>{$shippingLabel}</strong>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ITEMS -->
  <tr>
    <td style='padding:0 40px 28px;'>
      <p style='margin:0 0 14px;color:#c8a951;font-size:13px;text-transform:uppercase;letter-spacing:2px;font-weight:600;'>Your Items</p>
      <table width='100%' cellpadding='0' cellspacing='0' style='border-radius:10px;overflow:hidden;border:1px solid #2a2a2a;'>
        <tr style='background:#1e1e1e;'>
          <th style='padding:10px 16px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:left;font-weight:500;'>Item</th>
          <th style='padding:10px 16px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:center;font-weight:500;'>Qty</th>
          <th style='padding:10px 16px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:right;font-weight:500;'>Total</th>
        </tr>
        {$itemRowsHtml}
      </table>
    </td>
  </tr>

  <!-- ORDER TOTAL -->
  <tr>
    <td style='padding:0 40px 28px;'>
      <table width='100%' cellpadding='0' cellspacing='0' style='background:#1a1a1a;border-radius:10px;padding:20px;border:1px solid #2a2a2a;'>
        <tr><td style='padding:6px 0;color:#aaa;font-size:13px;'>Subtotal</td><td style='padding:6px 0;color:#e8e8e8;text-align:right;font-size:13px;'>\${$subtotal_fmt} CAD</td></tr>
        {$discountRow}
        <tr><td style='padding:6px 0;color:#aaa;font-size:13px;'>Shipping</td><td style='padding:6px 0;color:#e8e8e8;text-align:right;font-size:13px;'>\${$shippingFee_fmt} CAD</td></tr>
        <tr><td style='padding:6px 0;color:#aaa;font-size:13px;'>HST / Tax (13%)</td><td style='padding:6px 0;color:#e8e8e8;text-align:right;font-size:13px;'>\${$tax_fmt} CAD</td></tr>
        <tr>
          <td style='padding:14px 0 6px;color:#ffffff;font-size:16px;font-weight:700;border-top:1px solid #333;'>Grand Total</td>
          <td style='padding:14px 0 6px;color:#c8a951;text-align:right;font-size:20px;font-weight:800;border-top:1px solid #333;'>\${$total_fmt} CAD</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- BILLING -->
  <tr>
    <td style='padding:0 40px 28px;'>
      <p style='margin:0 0 14px;color:#c8a951;font-size:13px;text-transform:uppercase;letter-spacing:2px;font-weight:600;'>Billing Details</p>
      <table width='100%' cellpadding='0' cellspacing='0' style='background:#1a1a1a;border-radius:10px;padding:20px;border:1px solid #2a2a2a;'>
        <tr>
          <td style='color:#e8e8e8;font-size:14px;line-height:1.8;'>
            <strong>{$billingName}</strong><br>
            {$billingAddr1}{$addr2Line}<br>
            {$billingCity}, {$billingState} {$billingPostal}<br>
            {$billingPhone}<br>
            <a href='mailto:{$billingEmail}' style='color:#c8a951;'>{$billingEmail}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  {$notesSection}

  <!-- PICKUP INFO -->
  <tr>
    <td style='padding:0 40px 28px;'>
      <div style='background:linear-gradient(135deg,#1a1500 0%,#2a2000 100%);border-radius:10px;padding:22px;border:1px solid #c8a951;text-align:center;'>
        <p style='margin:0 0 8px;color:#c8a951;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;'>Pickup Locations</p>
        <p style='margin:0 0 4px;color:#e8e8e8;font-size:13px;font-weight:600;'><strong>Location 1 (Brampton):</strong> Unit 20, 180 Wilkinson Rd, Brampton, ON L6T 4W8</p>
        <p style='margin:0 0 8px;color:#e8e8e8;font-size:13px;font-weight:600;'><strong>Location 2 (Mississauga):</strong> Unit 1C30, 7215 Goreway Dr, Mississauga, ON L4T 2T9</p>
        <p style='margin:14px 0 4px;color:#c8a951;font-size:13px;font-weight:600;'>Store Hours</p>
        <p style='margin:0;color:#b0b0b0;font-size:12px;line-height:1.8;'>Mon &ndash; Fri: 11AM &ndash; 8PM &nbsp;|&nbsp; Sat: 11AM &ndash; 7PM (Brampton) / 11AM &ndash; 6PM (Mississauga) &nbsp;|&nbsp; Sun: 11AM &ndash; 7PM (Brampton) / 12PM &ndash; 5PM (Mississauga)</p>
        <p style='margin:14px 0 0;'><a href='tel:2893675047' style='color:#c8a951;font-size:14px;font-weight:700;text-decoration:none;'>289-367-5047</a></p>
      </div>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style='background:#0d0d0d;padding:30px 40px;text-align:center;border-top:1px solid #2a2a2a;'>
      <div style='display:inline-block;background:#c8a951;color:#0a0a0a;font-size:16px;font-weight:800;letter-spacing:3px;padding:7px 18px;border-radius:4px;margin-bottom:16px;'>BBC</div>
      <p style='margin:0 0 6px;color:#888;font-size:12px;'>Brown Boys Customs &mdash; Precision, Performance, Perfection</p>
      <p style='margin:0 0 6px;color:#555;font-size:11px;'>
        <a href='https://brownboyscustoms.ca' style='color:#c8a951;text-decoration:none;'>brownboyscustoms.ca</a>
        &nbsp;&bull;&nbsp; Brampton &amp; Mississauga, Ontario
      </p>
      <p style='margin:12px 0 0;color:#444;font-size:10px;'>
        &copy; {$year} Brown Boys Customs. All rights reserved.<br>
        This email was sent to {$billingEmail} because you placed an order on our website.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>";

// ─── ADMIN PLAIN-TEXT NOTIFICATION ───────────────────────────────────────────
$settingsFile = __DIR__ . '/data/settings.json';
$adminEmail   = 'brownboyscustoms@gmail.com'; // fallback — set in Admin > Settings
if (file_exists($settingsFile)) {
    $settings = json_decode(file_get_contents($settingsFile), true) ?: [];
    if (!empty($settings['notification_email'])) {
        $adminEmail = $settings['notification_email'];
    }
}

$adminSubject = "NEW ORDER {$orderNumber} - \${$total_fmt} CAD - Brown Boys Customs";
$adminBody    = "NEW BROWN BOYS CUSTOMS ORDER\n";
$adminBody   .= "============================\n\n";
$adminBody   .= "Order #:   {$orderNumber}\n";
$adminBody   .= "Date:      {$orderDate}\n";
$adminBody   .= "Total:     \${$total_fmt} CAD\n";
$adminBody   .= "Payment:   {$paymentLabel}\n";
$adminBody   .= "Shipping:  {$shippingLabel}\n\n";
$adminBody   .= "CUSTOMER\n--------\n";
$adminBody   .= "Name:      {$billingName}\n";
$adminBody   .= "Email:     {$billingEmail}\n";
$adminBody   .= "Phone:     {$billingPhone}\n";
$adminBody   .= "Address:   {$billingAddr1}, {$billingCity}, {$billingState} {$billingPostal}\n\n";
$adminBody   .= "ITEMS\n-----\n{$itemsText}\n";
$adminBody   .= "Subtotal:  \${$subtotal_fmt} CAD\n";
if ($discount > 0) { $adminBody .= "Discount:  -\$" . number_format($discount, 2) . " CAD\n"; }
$adminBody   .= "Shipping:  \${$shippingFee_fmt} CAD\n";
$adminBody   .= "Tax:       \${$tax_fmt} CAD\n";
$adminBody   .= "TOTAL:     \${$total_fmt} CAD\n\n";
if ($orderNotes) { $adminBody .= "NOTES:\n{$orderNotes}\n\n"; }
$adminBody   .= "Admin Dashboard: https://brownboyscustoms.ca/admin/index.php\n";

// ─── Send emails via unified mailer (Gmail SMTP if configured, fallback to mail) ───
require_once __DIR__ . '/mailer.php';

// Admin alert (HTML + plain text)
$adminHtml = nl2br(htmlspecialchars($adminBody));
send_bbc_email($adminEmail, 'Brown Boys Customs Admin', $adminSubject, $adminHtml, $adminBody, $billingEmail ?: '', $billingName ?: '');

// Customer receipt (Luxury HTML)
if ($billingEmail) {
    $customerSubject = "Your Brown Boys Customs Order is Confirmed! [{$orderNumber}]";
    send_bbc_email($billingEmail, $billingName ?: 'Valued Customer', $customerSubject, $customerHtml, strip_tags($customerHtml), $adminEmail, 'Brown Boys Customs');
}

// ─── Return success ───────────────────────────────────────────────────────────
http_response_code(200);
echo json_encode([
    'success'     => true,
    'orderNumber' => $orderNumber,
    'total'       => $total,
    'message'     => 'Order received and recorded successfully.',
]);
exit;
