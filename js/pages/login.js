import { store } from '../store.js';

// --- View Toggling ---
window.showView = function (viewId) {
    ['login-form-view', 'set-password-view', 'forgot-password-view', 'reset-password-final-view'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = id === viewId ? 'block' : 'none';
    });
};

window.togglePassword = (btn) => {
    const input = btn.previousElementSibling;
    if (input.type === "password") {
        input.type = "text";
        btn.innerHTML = '<i data-lucide="eye-off" width="20"></i>';
    } else {
        input.type = "password";
        btn.innerHTML = '<i data-lucide="eye" width="20"></i>';
    }
    if (window.lucide) window.lucide.createIcons();
};

window.handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.elements['email'].value;
    const password = e.target.elements['password'].value;
    const errorEl = document.getElementById('login-error');

    // Async Login Call (Supabase)
    const res = await store.login(email, password);

    if (res.success) {
        window.location.hash = '#dashboard';
        window.location.reload();
    } else if (res.error === 'PENDING_REGISTRATION') {
        showView('set-password-view');
        document.getElementById('sp-email').value = email;
    } else {
        errorEl.textContent = 'Invalid email or password';
        errorEl.style.display = 'block';
    }
};

window.handleCompleteRegistration = (e) => {
    e.preventDefault();
    const email = document.getElementById('sp-email').value;
    const newPass = e.target.elements['new-password'].value;

    if (store.completeRegistration(email, newPass)) {
        alert("Registration Complete! Logging you in...");
        window.location.hash = '#dashboard';
        window.location.reload();
    }
};

window.handleForgotPassword = (e) => {
    e.preventDefault();
    const email = e.target.elements['email'].value;

    // Check if user exists (mocking server check)
    const users = store.getUsers();
    const user = users.find(u => u.email === email);

    if (user) {
        alert(`📧 SIMULATED EMAIL SENT TO: ${email}\n\nSubject: Password Reset Request\n\n"Hello ${user.name},\nClick the link below to reset your password:\n[LINK: Reset Password]"\n\n(Click OK to simulate clicking the link)`);

        // Simulate link click -> Go to Reset View
        showView('reset-password-final-view');
        document.getElementById('rp-email').value = email;
    } else {
        // Security practice: Don't reveal if user exists, but for this app we'll just say email sent to avoid confusion
        alert(`If an account exists for ${email}, a reset link has been sent.`);
    }
};

window.handleResetPasswordFinal = (e) => {
    e.preventDefault();
    const email = document.getElementById('rp-email').value;
    const newPass = e.target.elements['new-password'].value;

    if (store.resetUserPassword(email, newPass)) {
        alert("Password Successfully Reset! Please login with your new password.");
        showView('login-form-view');
    } else {
        alert("Error resetting password.");
    }
};

export function renderLogin() {
    return `
        <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%) !important; z-index: 2147483647; display: flex; align-items: center; justify-content: center; overflow-y: auto;">
            
            <!-- 1. LOGIN VIEW -->
            <div id="login-form-view" class="card" style="width: 100%; max-width: 400px; padding: 2.5rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <!-- LOGO -->
                    <div style="display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; background: #ECFDF5; color: #059669; border-radius: 50%; margin-bottom: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <i data-lucide="leaf" width="40" height="40"></i>
                    </div>
                    <h1 style="font-size: 1.75rem; font-weight: 800; color: #064E3B; letter-spacing: -0.025em;">Sreedhari</h1>
                    <p style="color: #6B7280; margin-top: 0.25rem; font-size: 0.9rem;">Ayurvedic Centre Operations</p>
                </div>

                <form onsubmit="handleLogin(event)">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; font-weight: 500; font-size: 0.875rem; color: #374151; margin-bottom: 0.5rem;">Email Address</label>
                        <input name="email" type="email" required placeholder="name@sreedhari.com" style="width: 100%; padding: 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; outline: none; transition: border-color 0.15s ease-in-out;">
                    </div>

                    <div style="margin-bottom: 1rem;">
                         <label style="display: block; font-weight: 500; font-size: 0.875rem; color: #374151; margin-bottom: 0.5rem;">Password</label>
                         <div style="position: relative;">
                            <input name="password" type="password" required placeholder="Enter Password" style="width: 100%; padding: 0.75rem; padding-right: 40px; border: 1px solid #D1D5DB; border-radius: 0.5rem; outline: none;">
                            <button type="button" onclick="togglePassword(this)" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #9CA3AF;">
                                <i data-lucide="eye" width="20"></i>
                            </button>
                         </div>
                    </div>
                    
                    <div style="text-align: right; margin-bottom: 1.5rem;">
                        <a href="#" onclick="showView('forgot-password-view'); return false;" style="font-size: 0.85rem; color: #059669; text-decoration: none; font-weight: 500;">Forgot Password?</a>
                    </div>

                    <div id="login-error" style="display: none; color: #DC2626; font-size: 0.875rem; margin-bottom: 1.5rem; text-align: center;"></div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 0.75rem; font-size: 1rem;">Sign In</button>
                    
                    <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #E5E7EB; text-align: center; font-size: 0.8rem; color: #6B7280;">
                         <p style="margin-bottom:0.5rem; font-weight:600;">Demo Credentials:</p>
                        <p>Doctor: doctor@sreedhari.com / doctor007</p>
                        <p>Manager: manager@sreedhari.com / admin</p>
                        <p>Staff: staff@sreedhari.com / staff</p>
                        <p>Admin: sreejithsdev@gmail.com / 123456789</p>
                    </div>
                </form>
            </div>
            
            <!-- 2. FORGOT PASSWORD VIEW (Enter Email) -->
            <div id="forgot-password-view" class="card" style="display: none; width: 100%; max-width: 400px; padding: 2.5rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <button onclick="showView('login-form-view')" style="position: absolute; top: 1rem; left: 1rem; background: none; border: none; cursor: pointer; color: #6B7280; display:flex; align-items:center; gap:0.5rem;">
                         <i data-lucide="arrow-left" width="18"></i> Back
                    </button>
                    <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: #DBEAFE; color: #2563EB; border-radius: 50%; margin-bottom: 1rem;">
                        <i data-lucide="key-round" width="32" height="32"></i>
                    </div>
                    <h1 style="font-size: 1.5rem; font-weight: 700; color: #1F2937;">Forgot Password?</h1>
                    <p style="color: #6B7280; margin-top: 0.5rem;">Enter your email to receive a reset link.</p>
                </div>
                <form onsubmit="handleForgotPassword(event)">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; font-weight: 500; font-size: 0.875rem; color: #374151; margin-bottom: 0.5rem;">Email Address</label>
                        <input name="email" type="email" required placeholder="name@sreedhari.com" style="width: 100%; padding: 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; outline: none;">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">Send Reset Link</button>
                </form>
            </div>

             <!-- 3. SET TEMP PASSWORD VIEW (For First Time Login) -->
            <div id="set-password-view" class="card" style="display: none; width: 100%; max-width: 400px; padding: 2.5rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);">
                 <div style="text-align: center; margin-bottom: 2rem;">
                     <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: #FEF3C7; color: #D97706; border-radius: 50%; margin-bottom: 1rem;">
                        <i data-lucide="shield-alert" width="32" height="32"></i>
                    </div>
                    <h1 style="font-size: 1.5rem; font-weight: 700; color: #1F2937;">Setup Password</h1>
                    <p style="color: #6B7280; margin-top: 0.5rem;">Please set a new password for your account.</p>
                </div>
                <form onsubmit="handleCompleteRegistration(event)">
                    <input type="hidden" id="sp-email">
                    <div style="margin-bottom: 1.5rem;">
                         <label style="display: block; font-weight: 500; font-size: 0.875rem; color: #374151; margin-bottom: 0.5rem;">New Password</label>
                        <input name="new-password" type="password" required minlength="4" placeholder="Enter new password" style="width: 100%; padding: 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; outline: none;">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">Update & Login</button>
                </form>
            </div>

            <!-- 4. RESET PASSWORD FINAL VIEW (After clicking email link) -->
            <div id="reset-password-final-view" class="card" style="display: none; width: 100%; max-width: 400px; padding: 2.5rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);">
                 <div style="text-align: center; margin-bottom: 2rem;">
                     <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: #E0E7FF; color: #4338CA; border-radius: 50%; margin-bottom: 1rem;">
                        <i data-lucide="lock" width="32" height="32"></i>
                    </div>
                    <h1 style="font-size: 1.5rem; font-weight: 700; color: #1F2937;">Reset Password</h1>
                    <p style="color: #6B7280; margin-top: 0.5rem;">Enter your new password below.</p>
                </div>
                <form onsubmit="handleResetPasswordFinal(event)">
                    <input type="hidden" id="rp-email">
                    <div style="margin-bottom: 1.5rem;">
                         <label style="display: block; font-weight: 500; font-size: 0.875rem; color: #374151; margin-bottom: 0.5rem;">New Password</label>
                        <input name="new-password" type="password" required minlength="4" placeholder="Enter new password" style="width: 100%; padding: 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; outline: none;">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">Change Password</button>
                    
                     <div style="margin-top: 1rem; text-align: center;">
                        <a href="#" onclick="showView('login-form-view'); return false;" style="font-size: 0.85rem; color: #6B7280; text-decoration: none;">Cancel</a>
                    </div>
                </form>
            </div>

        </div>
    `;
}
