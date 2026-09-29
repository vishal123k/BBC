<?php
require_once __DIR__ . '/auth.php';

// If already logged in, redirect to dashboard
if (is_admin_logged_in()) {
    header('Location: index.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // ── Brute-force lockout check ─────────────────────────────────────────────
    if (is_locked_out()) {
        $remaining = ceil(lockout_remaining_seconds() / 60);
        $error = "Too many failed attempts. Account locked. Try again in {$remaining} minute(s).";
    } else {
        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';
        $creds    = get_admin_credentials();

        if ($username === $creds['username'] && password_verify($password, $creds['password_hash'])) {
            reset_login_attempts();
            session_regenerate_id(true); // Prevent session fixation
            $_SESSION['bbc_admin_logged_in'] = true;
            $_SESSION['bbc_admin_user']      = $username;
            $_SESSION['bbc_last_activity']   = time();
            header('Location: index.php');
            exit;
        } else {
            record_failed_attempt();
            $attempts = get_login_attempts();
            $remaining_attempts = MAX_LOGIN_ATTEMPTS - $attempts['count'];
            if ($remaining_attempts <= 0) {
                $error = 'Too many failed attempts. Account locked for 15 minutes.';
            } else {
                $error = "Invalid username or password. {$remaining_attempts} attempt(s) remaining.";
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Portal Login — Brown Boys Customs (BBC)</title>
  <link rel="icon" type="image/svg+xml" href="../images/favicon.svg">
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="css/admin.css">
  <style>
    body {
      background: #080b18;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      margin: 0;
      font-family: var(--font-body, -apple-system, sans-serif);
      color: var(--text-white, #fff);
    }
    .login-card {
      width: 100%;
      max-width: 440px;
      background: #0e122b;
      border: 1px solid rgba(201, 161, 61, 0.3);
      border-radius: 12px;
      padding: 2.5rem 2.2rem;
      box-shadow: 0 15px 35px rgba(0,0,0,0.6);
    }
    .login-brand {
      text-align: center;
      margin-bottom: 2rem;
    }
    .login-brand img {
      max-width: 220px;
      height: auto;
      margin-bottom: 0.75rem;
    }
    .login-subtitle {
      color: #c9a13d;
      font-family: var(--font-heading, sans-serif);
      font-size: 1.1rem;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 0;
    }
    .login-error {
      background: rgba(239, 68, 68, 0.15);
      border-left: 4px solid #ef4444;
      color: #fca5a5;
      padding: 0.85rem 1rem;
      border-radius: 4px;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }
    .default-creds-hint {
      margin-top: 1.8rem;
      padding: 0.85rem 1rem;
      background: rgba(255,255,255,0.03);
      border: 1px dashed rgba(255,255,255,0.12);
      border-radius: 6px;
      font-size: 0.82rem;
      color: #94a3b8;
      text-align: center;
      line-height: 1.5;
    }
  </style>
</head>
<body>

  <div class="login-card">
    <div class="login-brand" style="text-align: center; margin-bottom: 1.5rem;"><img src="../images/logo.png" alt="BBC Admin Logo" style="height: 56px; width: auto; object-fit: contain;"></div>
    </div>

    <?php if (!empty($error)): ?>
      <div class="login-error">
        <strong>Error:</strong> <?php echo htmlspecialchars($error); ?>
      </div>
    <?php endif; ?>

    <form method="POST" action="login.php">
      <div class="form-group" style="margin-bottom: 1.25rem;">
        <label class="form-label" style="display: block; margin-bottom: 0.4rem; color: #cbd5e1; font-size: 0.9rem; font-weight: 600;">
          Username
        </label>
        <input type="text" name="username" class="form-control" required value="admin" style="width: 100%; box-sizing: border-box; padding: 0.75rem 1rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 6px;">
      </div>

      <div class="form-group" style="margin-bottom: 1.75rem;">
        <label class="form-label" style="display: block; margin-bottom: 0.4rem; color: #cbd5e1; font-size: 0.9rem; font-weight: 600;">
          Password
        </label>
        <input type="password" name="password" class="form-control" required placeholder="••••••••" style="width: 100%; box-sizing: border-box; padding: 0.75rem 1rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 6px;">
      </div>

      <button type="submit" class="btn btn-gold" style="width: 100%; padding: 0.85rem; font-size: 1.05rem; font-weight: 700; background: #c9a13d; color: #000; border: none; border-radius: 6px; cursor: pointer;">
        SIGN IN TO DASHBOARD
      </button>

      <div class="default-creds-hint">
        <em>Contact your site administrator if you have forgotten your login credentials.</em>
      </div>

      <div style="text-align: center; margin-top: 1.5rem;">
        <a href="../index.html" style="color: #94a3b8; font-size: 0.85rem; text-decoration: underline;">&larr; Back to Public Website</a>
      </div>
    </form>
  </div>

</body>
</html>
