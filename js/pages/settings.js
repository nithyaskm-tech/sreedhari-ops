import { store } from '../store.js';

export function renderSettings() {
    const user = store.getCurrentUser();
    if (!user) return '<p>Please log in.</p>';

    // Mock missing fields if they don't exist yet
    if (!user.phone) user.phone = '+91 9988776655'; // Default mock
    if (!user.notifications) user.notifications = { email: true, sms: false };

    // Function to handle image selection
    window.triggerAvatarUpload = () => document.getElementById('avatar-upload').click();

    window.handleAvatarChange = (input) => {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const newAvatar = e.target.result; // Base64
                store.updateUserAvatar(newAvatar);
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    window.saveSettings = () => {
        const phone = document.getElementById('setting-phone').value;
        const email = document.getElementById('setting-email').value;
        const notifyEmail = document.getElementById('notify-email').checked;
        const notifySms = document.getElementById('notify-sms').checked;

        store.updateUserSettings({
            phone,
            email,
            notifications: { email: notifyEmail, sms: notifySms }
        });
        alert('Settings saved successfully!');
    };

    // Determine avatar display (URL vs Initials)
    const isImage = user.avatar && user.avatar.length > 5;
    const avatarContent = isImage
        ? `<img src="${user.avatar}" style="width: 100%; height: 100%; object-fit: cover;">`
        : (user.avatar || 'U');

    return `
        <div class="card settings-container" style="max-width: 800px; margin: 0 auto; animation: fadeIn 0.4s ease-out;">
            <div class="settings-header" style="display: flex; gap: 2rem; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 2rem; margin-bottom: 2rem;">
                <div class="avatar-section" style="position: relative;">
                    <div class="avatar-large" style="width: 100px; height: 100px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; overflow: hidden; font-size: 2.5rem; font-weight: bold; color: var(--primary-dark); box-shadow: var(--shadow-md);">
                        ${avatarContent}
                    </div>
                    <button class="icon-btn" onclick="triggerAvatarUpload()" title="Change Picture" style="position: absolute; bottom: 0; right: 0; box-shadow: var(--shadow-md); background: var(--surface-white);">
                        <i data-lucide="camera" style="width: 18px; height: 18px;"></i>
                    </button>
                    <input type="file" id="avatar-upload" hidden accept="image/*" onchange="handleAvatarChange(this)">
                </div>
                <div>
                    <h2 class="card-title" style="margin-bottom: 0.5rem; font-size: 1.5rem;">${user.name}</h2>
                    <p style="color: var(--text-muted);">${user.role} - ${user.dept}</p>
                </div>
            </div>

            <form onsubmit="event.preventDefault(); saveSettings();" style="display: grid; gap: 2rem;">
                <!-- Contact Info -->
                <div>
                    <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem;">Contact Information</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 500; color: var(--text-muted);">Email Address</label>
                            <input type="email" id="setting-email" value="${user.email}" class="form-input" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-family: inherit;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 500; color: var(--text-muted);">Phone Number</label>
                            <input type="tel" id="setting-phone" value="${user.phone}" class="form-input" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-family: inherit;">
                        </div>
                    </div>
                </div>

                <!-- Notifications -->
                <div>
                    <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem;">Notifications</h3>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: background 0.1s;">
                            <input type="checkbox" id="notify-email" ${user.notifications.email ? 'checked' : ''} style="width: 1.2rem; height: 1.2rem; accent-color: var(--primary);">
                            <span style="font-weight: 500;">Email Notifications</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: background 0.1s;">
                            <input type="checkbox" id="notify-sms" ${user.notifications.sms ? 'checked' : ''} style="width: 1.2rem; height: 1.2rem; accent-color: var(--primary);">
                            <span style="font-weight: 500;">SMS / Phone Notifications</span>
                        </label>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <button type="submit" class="btn btn-primary" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 2rem;">
                        <i data-lucide="save" style="width: 18px; height: 18px;"></i>
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    `;
}
