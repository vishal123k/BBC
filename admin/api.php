<?php
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

// Ensure only authenticated requests can access API
if (!is_admin_logged_in()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized. Please log in.']);
    exit;
}

$action = $_GET['action'] ?? ($_POST['action'] ?? '');
$productsFile = __DIR__ . '/../data/products.json';
$blogFile     = __DIR__ . '/../data/blog.json';
$ordersFile   = __DIR__ . '/../data/orders.json';
$inquiriesFile = __DIR__ . '/../data/inquiries.json';
$settingsFile = __DIR__ . '/../data/settings.json';
$credsFile    = __DIR__ . '/../data/admin_credentials.json';

// Helper to read JSON
function read_json($file, $default = []) {
    if (!file_exists($file)) return $default;
    $raw = file_get_contents($file);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : $default;
}

// Helper to write JSON — atomic with exclusive lock (safe for concurrent admin actions)
function write_json($file, $data) {
    $fp = fopen($file, 'c+');
    if (!$fp) return false;
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    rewind($fp);
    $result = fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    flock($fp, LOCK_UN);
    fclose($fp);
    return $result;
}

switch ($action) {
    /* -------------------------------------------------------------
       1. STATS OVERVIEW
       ------------------------------------------------------------- */
    case 'get_stats':
        $products  = read_json($productsFile);
        $orders    = read_json($ordersFile);
        $inquiries = read_json($inquiriesFile);
        $settings  = read_json($settingsFile);

        $totalRevenue = 0;
        foreach ($orders as $ord) {
            $totalRevenue += floatval($ord['total'] ?? 0);
        }

        echo json_encode([
            'success' => true,
            'stats' => [
                'total_products'    => count($products),
                'total_orders'      => count($orders),
                'total_inquiries'   => count($inquiries),
                'total_revenue'     => number_format($totalRevenue, 2),
                'notification_email'=> $settings['notification_email'] ?? 'brownboyscustoms@gmail.com'
            ]
        ]);
        break;

    /* -------------------------------------------------------------
       2. PRODUCTS CRUD
       ------------------------------------------------------------- */
    case 'get_products':
        $products = read_json($productsFile);
        echo json_encode(['success' => true, 'products' => $products]);
        break;

    case 'save_product':
        $raw = file_get_contents('php://input');
        $item = json_decode($raw, true);
        if (!$item || empty($item['name'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Product name is required.']);
            exit;
        }

        $products = read_json($productsFile);
        $isEdit = false;

        // Clean values
        $price = floatval($item['price'] ?? 0);
        $comparePrice = !empty($item['comparePrice']) ? floatval($item['comparePrice']) : null;
        $onSale = ($comparePrice && $comparePrice > $price) || !empty($item['onSale']);

        $id = !empty($item['id']) ? preg_replace('/[^a-z0-9\-]/i', '', strtolower(trim($item['id']))) : '';
        if (empty($id)) {
            $id = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $item['name'])));
        }

        $productData = [
            'id'              => $id,
            'name'            => trim($item['name']),
            'category'        => trim($item['category'] ?? 'Car Accessories'),
            'subCategory'     => trim($item['subCategory'] ?? ''),
            'price'           => $price,
            'comparePrice'    => $comparePrice,
            'onSale'          => $onSale,
            'inStock'         => isset($item['inStock']) ? (bool)$item['inStock'] : true,
            'featured'        => isset($item['featured']) ? (bool)$item['featured'] : false,
            'badge'           => trim($item['badge'] ?? ($onSale ? 'SALE!' : '')),
            'image'           => trim($item['image'] ?? 'images/no-image-placeholder.svg'),
            'shortDescription'=> trim($item['shortDescription'] ?? ''),
            'fullDescription' => trim($item['fullDescription'] ?? ''),
            'sku'             => trim($item['sku'] ?? ('BBC-' . strtoupper(substr(uniqid(), -6)))),
            'rating'          => floatval($item['rating'] ?? 5.0),
            'reviewsCount'    => intval($item['reviewsCount'] ?? 12),
            'createdAt'       => $item['createdAt'] ?? date('Y-m-d')
        ];

        // Check if updating existing
        foreach ($products as $idx => $p) {
            if ($p['id'] === $id) {
                // Preserve existing gallery & specifications if not provided
                if (empty($item['gallery']) && !empty($p['gallery'])) $productData['gallery'] = $p['gallery'];
                if (empty($item['specifications']) && !empty($p['specifications'])) $productData['specifications'] = $p['specifications'];
                if (empty($item['features']) && !empty($p['features'])) $productData['features'] = $p['features'];
                
                $products[$idx] = array_merge($p, $productData);
                $isEdit = true;
                break;
            }
        }

        if (!$isEdit) {
            $productData['gallery'] = [$productData['image']];
            array_unshift($products, $productData);
        }

        write_json($productsFile, $products);
        echo json_encode(['success' => true, 'message' => $isEdit ? 'Product updated.' : 'Product created.', 'product' => $productData]);
        break;

    case 'delete_product':
        $id = $_GET['id'] ?? ($_POST['id'] ?? '');
        $products = read_json($productsFile);
        $filtered = array_values(array_filter($products, fn($p) => $p['id'] !== $id));
        write_json($productsFile, $filtered);
        echo json_encode(['success' => true, 'message' => 'Product removed.']);
        break;

    /* -------------------------------------------------------------
       3. IMAGE UPLOAD
       ------------------------------------------------------------- */
    case 'upload_image':
        if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No image uploaded or upload error.']);
            exit;
        }

        $file = $_FILES['image'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'];

        if (!in_array($ext, $allowed)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Allowed formats: JPG, PNG, WEBP, SVG, GIF.']);
            exit;
        }

        $targetDir = __DIR__ . '/../images/products/';
        if (!is_dir($targetDir)) {
            @mkdir($targetDir, 0755, true);
        }

        $cleanBase = preg_replace('/[^a-z0-9\-]/i', '-', strtolower(pathinfo($file['name'], PATHINFO_FILENAME)));
        $filename = $cleanBase . '-' . time() . '.' . $ext;
        $targetPath = $targetDir . $filename;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $publicUrl = 'images/products/' . $filename;
            echo json_encode([
                'success' => true,
                'url'     => $publicUrl,
                'path'    => $publicUrl,
                'message' => 'Image uploaded successfully.'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to save uploaded file to images/products/.']);
        }
        break;

    /* -------------------------------------------------------------
       4. BLOG POSTS CRUD
       ------------------------------------------------------------- */
    case 'get_blogs':
        $blogs = read_json($blogFile);
        echo json_encode(['success' => true, 'blogs' => $blogs]);
        break;

    case 'save_blog':
        $raw = file_get_contents('php://input');
        $item = json_decode($raw, true);
        if (!$item || empty($item['title'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Blog title is required.']);
            exit;
        }

        $blogs = read_json($blogFile);
        $id = !empty($item['id']) ? preg_replace('/[^a-z0-9\-]/i', '', strtolower(trim($item['id']))) : '';
        if (empty($id)) {
            $id = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $item['title'])));
        }

        $blogData = [
            'id'          => $id,
            'title'       => trim($item['title']),
            'author'      => trim($item['author'] ?? 'bbc'),
            'authorLabel' => 'By ' . trim($item['author'] ?? 'bbc'),
            'date'        => trim($item['date'] ?? date('F j, Y')),
            'category'    => trim($item['category'] ?? 'Automotive Styling'),
            'readTime'    => trim($item['readTime'] ?? '5 min read'),
            'image'       => trim($item['image'] ?? 'images/blog/car-decals-style.svg'),
            'slug'        => 'post.html?id=' . $id,
            'excerpt'     => trim($item['excerpt'] ?? ''),
            'contentHtml' => $item['contentHtml'] ?? '<p>Post content to be provided.</p>'
        ];

        $isEdit = false;
        foreach ($blogs as $idx => $b) {
            if ($b['id'] === $id) {
                $blogs[$idx] = array_merge($b, $blogData);
                $isEdit = true;
                break;
            }
        }

        if (!$isEdit) {
            array_unshift($blogs, $blogData);
        }

        write_json($blogFile, $blogs);
        echo json_encode(['success' => true, 'message' => $isEdit ? 'Article updated.' : 'Article created.']);
        break;

    case 'delete_blog':
        $id = $_GET['id'] ?? ($_POST['id'] ?? '');
        $blogs = read_json($blogFile);
        $filtered = array_values(array_filter($blogs, fn($b) => $b['id'] !== $id));
        write_json($blogFile, $filtered);
        echo json_encode(['success' => true, 'message' => 'Article removed.']);
        break;

    /* -------------------------------------------------------------
       5. ORDERS & INQUIRIES
       ------------------------------------------------------------- */
    case 'get_orders':
        $orders = read_json($ordersFile);
        echo json_encode(['success' => true, 'orders' => $orders]);
        break;

    case 'update_order_status':
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true);
        $orderNumber = $payload['orderNumber'] ?? ($payload['order_id'] ?? '');
        $newStatus   = $payload['status'] ?? 'pending';

        $orders = read_json($ordersFile);
        $updated = false;
        foreach ($orders as &$ord) {
            $thisId = $ord['orderNumber'] ?? ($ord['order_id'] ?? '');
            if ($thisId === $orderNumber) {
                $ord['status'] = $newStatus;
                $updated = true;
                break;
            }
        }
        if ($updated) {
            write_json($ordersFile, $orders);
            echo json_encode(['success' => true, 'message' => "Order {$orderNumber} marked as {$newStatus}."]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Order not found.']);
        }
        break;

    case 'get_inquiries':
        $inquiries = read_json($inquiriesFile);
        echo json_encode(['success' => true, 'inquiries' => $inquiries]);
        break;

    case 'delete_inquiry':
        $id = $_GET['id'] ?? ($_POST['id'] ?? '');
        $inquiries = read_json($inquiriesFile);
        $filtered = array_values(array_filter($inquiries, fn($inq) => ($inq['id'] ?? '') !== $id));
        write_json($inquiriesFile, $filtered);
        echo json_encode(['success' => true, 'message' => 'Inquiry removed.']);
        break;

    /* -------------------------------------------------------------
       6. STORE SETTINGS & PASSWORD
       ------------------------------------------------------------- */
    case 'get_settings':
        $settings = read_json($settingsFile);
        echo json_encode(['success' => true, 'settings' => $settings]);
        break;

    case 'save_settings':
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true);
        if (!$payload) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid data.']);
            exit;
        }

        $existing = read_json($settingsFile);
        $merged = array_merge($existing, [
            'notification_email' => trim($payload['notification_email'] ?? $existing['notification_email'] ?? 'brownboyscustoms@gmail.com'),
            'production_email'   => trim($payload['production_email'] ?? 'brownboyscustoms@gmail.com'),
            'store_phone'        => trim($payload['store_phone'] ?? '289-367-5047'),
            'store_address'      => trim($payload['store_address'] ?? 'Unit 20, 180 Wilkinson Road, Brampton, ON L6T 4W8 & Unit 1C30, 7215 Goreway Dr, Mississauga, ON L4T 2T9'),
            'hours_mon_fri'      => trim($payload['hours_mon_fri'] ?? '11:00 AM – 8:00 PM'),
            'hours_sat'          => trim($payload['hours_sat'] ?? '11:00 AM – 7:00 PM'),
            'hours_sun'          => trim($payload['hours_sun'] ?? '11:00 AM – 7:00 PM'),
            'smtp_enabled'       => !empty($payload['smtp_pass']) || !empty($payload['smtp_enabled']),
            'smtp_host'          => trim($payload['smtp_host'] ?? ($existing['smtp_host'] ?? 'smtp.gmail.com')),
            'smtp_port'          => intval($payload['smtp_port'] ?? ($existing['smtp_port'] ?? 587)),
            'smtp_secure'        => trim($payload['smtp_secure'] ?? ($existing['smtp_secure'] ?? 'tls')),
            'smtp_user'          => trim($payload['smtp_user'] ?? ($existing['smtp_user'] ?? 'brownboyscustoms@gmail.com')),
            'smtp_pass'          => trim($payload['smtp_pass'] ?? ($existing['smtp_pass'] ?? ''))
        ]);

        write_json($settingsFile, $merged);
        echo json_encode(['success' => true, 'message' => 'Settings saved successfully.']);
        break;

    case 'test_smtp':
        require_once __DIR__ . '/../mailer.php';
        $settings = read_json($settingsFile);
        $testRecipient = $settings['notification_email'] ?? 'brownboyscustoms@gmail.com';
        $res = send_bbc_email($testRecipient, 'BBC Admin', 'BBC SMTP Test Email — Brown Boys Customs', '<div style="padding:24px;font-family:sans-serif;background:#0d1126;color:#fff;border-radius:8px;"><h2 style="color:#d9a044;margin:0 0 10px 0;">BBC SMTP Test Successful!</h2><p>Your Gmail SMTP connection is working perfectly on brownboyscustoms.ca.</p><p style="color:#94a3b8;font-size:12px;">Sent via PHPMailer on InfinityFree.</p></div>', 'BBC SMTP Test Successful! Your Gmail SMTP connection is working.');
        if (!empty($res['success'])) {
            echo json_encode(['success' => true, 'message' => "Test email successfully dispatched to {$testRecipient}! Check your inbox."]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to send test email. Please verify your 16-character Google App Password.']);
        }
        break;

    case 'change_password':
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true);
        $currentPass = $payload['current_password'] ?? '';
        $newPass     = $payload['new_password'] ?? '';

        if (strlen($newPass) < 6) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'New password must be at least 6 characters.']);
            exit;
        }

        $creds = get_admin_credentials();
        if (!password_verify($currentPass, $creds['password_hash'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Current password is incorrect.']);
            exit;
        }

        $creds['password_hash'] = password_hash($newPass, PASSWORD_DEFAULT);
        $creds['updated_at']    = date('Y-m-d H:i:s');
        write_json($credsFile, $creds);

        echo json_encode(['success' => true, 'message' => 'Password updated successfully.']);
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid action: ' . htmlspecialchars($action)]);
        break;
}
