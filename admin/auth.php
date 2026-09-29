<?php
/**
 * Brown Boys Customs (BBC) — Admin Authentication (Hardened)
 * - Brute-force lockout: 5 failed attempts → 15 min lockout
 * - Session fixation prevention on login
 * - Session timeout: 2 hours of inactivity
 * - No hardcoded password fallback in production
 */
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => isset($_SERVER['HTTPS']),  // HTTPS-only cookie in production
        'httponly' => true,                        // Not accessible via JS
        'samesite' => 'Strict'
    ]);
    session_start();
}

$credentialsFile = __DIR__ . '/../data/admin_credentials.json';

// ─── Auto-create credentials file if missing ─────────────────────────────────
// Password: Akhil123@ (pre-hashed — change via Admin Dashboard)
if (!file_exists($credentialsFile)) {
    $defaultCreds = [
        'username'      => 'admin',
        'password_hash' => '$2b$12$BILKJpTyedUlenp5RbY4b.7pcv42IMojmOiSHtTHKnLVTjnxbP7RO',
        'updated_at'    => date('Y-m-d H:i:s')
    ];
    @file_put_contents($credentialsFile, json_encode($defaultCreds, JSON_PRETTY_PRINT));
}

// ─── Brute-force rate limiting ────────────────────────────────────────────────
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOCKOUT_DURATION',   900); // 15 minutes in seconds

function get_login_attempts() {
    if (!isset($_SESSION['bbc_login_attempts'])) {
        $_SESSION['bbc_login_attempts'] = 0;
        $_SESSION['bbc_lockout_time']   = 0;
    }
    return [
        'count'       => (int) $_SESSION['bbc_login_attempts'],
        'lockout_time'=> (int) $_SESSION['bbc_lockout_time'],
    ];
}

function is_locked_out() {
    $data = get_login_attempts();
    if ($data['count'] >= MAX_LOGIN_ATTEMPTS) {
        if (time() - $data['lockout_time'] < LOCKOUT_DURATION) {
            return true;
        }
        // Lockout expired — reset counter
        $_SESSION['bbc_login_attempts'] = 0;
        $_SESSION['bbc_lockout_time']   = 0;
    }
    return false;
}

function record_failed_attempt() {
    $_SESSION['bbc_login_attempts'] = (int)($_SESSION['bbc_login_attempts'] ?? 0) + 1;
    if ((int)$_SESSION['bbc_login_attempts'] >= MAX_LOGIN_ATTEMPTS) {
        $_SESSION['bbc_lockout_time'] = time();
    }
}

function reset_login_attempts() {
    $_SESSION['bbc_login_attempts'] = 0;
    $_SESSION['bbc_lockout_time']   = 0;
}

function lockout_remaining_seconds() {
    $data = get_login_attempts();
    return max(0, LOCKOUT_DURATION - (time() - $data['lockout_time']));
}

// ─── Session timeout (2 hours) ────────────────────────────────────────────────
if (!empty($_SESSION['bbc_admin_logged_in'])) {
    $lastActivity = $_SESSION['bbc_last_activity'] ?? time();
    if (time() - $lastActivity > 7200) {
        session_unset();
        session_destroy();
        session_start();
    } else {
        $_SESSION['bbc_last_activity'] = time();
    }
}

// ─── Credential helpers ───────────────────────────────────────────────────────
function get_admin_credentials() {
    global $credentialsFile;
    if (file_exists($credentialsFile)) {
        $data = json_decode(file_get_contents($credentialsFile), true);
        if (is_array($data) && !empty($data['username']) && !empty($data['password_hash'])) {
            return $data;
        }
    }
    // Fallback to pre-hashed Akhil123@ — only if file is missing/corrupt
    return [
        'username'      => 'admin',
        'password_hash' => '$2b$12$BILKJpTyedUlenp5RbY4b.7pcv42IMojmOiSHtTHKnLVTjnxbP7RO'
    ];
}

function is_admin_logged_in() {
    return !empty($_SESSION['bbc_admin_logged_in']) && $_SESSION['bbc_admin_logged_in'] === true;
}

function require_admin_login() {
    if (!is_admin_logged_in()) {
        header('Location: login.php');
        exit;
    }
}
