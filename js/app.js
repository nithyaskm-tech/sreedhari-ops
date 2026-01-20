import { store } from './store.js?v=3';
import { renderDashboard } from './pages/dashboard.js?v=7';
import { renderCalendar } from './pages/calendar.js?v=3';
import { renderBooking } from './pages/booking.js?v=3';
import { renderPatients } from './pages/patients.js?v=5';
import { renderTreatments } from './pages/treatments.js?v=3';
import { renderStaff } from './pages/staff.js?v=4';
import { renderCare } from './pages/care.js?v=3';
import { renderSettings } from './pages/settings.js?v=2';

import { renderLogin } from './pages/login.js?v=8';

// Simple Router
import { renderTasks } from './pages/tasks.js';

const routes = {
    'login': { render: renderLogin, title: 'Login' },
    'dashboard': { render: renderDashboard, title: 'Dashboard' },
    'calendar': { render: renderCalendar, title: 'Cottage Calendar' },
    'booking': { render: renderBooking, title: 'New Booking' },
    'patients': { render: renderPatients, title: 'Patients' },
    'treatments': { render: renderTreatments, title: 'Treatments' },
    'tasks': { render: renderTasks, title: 'My Tasks' },
    'staff': { render: renderStaff, title: 'Staff Management' },
    'care': { render: renderCare, title: 'Diet & Care Monitor' },
    'settings': { render: renderSettings, title: 'Settings' }
};

// Update Sidebar based on Role
function updateSidebarVisibility(user) {
    const role = user ? user.role : 'Doctor';
    const isStaff = role === 'Staff';

    // Define restricted pages for Staff
    // Staff should NOT see: Dashboard, Booking, Staff Mgmt
    // Staff SHOULD see: Calendar (Cottages), Patients, Treatments, Care (Monitor)
    const restrictedForStaff = ['dashboard', 'booking', 'staff'];

    document.querySelectorAll('.nav-item').forEach(item => {
        const page = item.getAttribute('data-page');
        if (isStaff && restrictedForStaff.includes(page)) {
            item.style.display = 'none';
        } else {
            item.style.display = 'flex';
        }
    });
}

function handleRoute() {
    try {
        let hash = window.location.hash.slice(1) || 'dashboard';
        const user = store.getCurrentUser();
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');

        // AUTH GUARD
        if (!user) {
            // Force Login
            if (hash !== 'login') {
                window.location.hash = '#login';
                return;
            }
            // Layout adjustments for Login Screen
            if (sidebar) sidebar.style.display = 'none';
            if (mainContent) {
                mainContent.style.marginLeft = '0';
                mainContent.style.marginLeft = '0';
                mainContent.style.width = '100%';
            }
            const actions = document.querySelector('.actions');
            if (actions) actions.style.display = 'none';

            // Render Login
            document.getElementById('view-container').innerHTML = renderLogin();
            document.getElementById('page-title').textContent = 'Sign In';
            return;
        }

        // LOGGED IN STATE
        // Restore layout
        if (sidebar) sidebar.style.display = 'flex';
        // HTML Structure and CSS (#app { display: flex }) handles the layout automatically.
        if (mainContent) {
            mainContent.style.marginLeft = '';
            mainContent.style.width = '';
        }
        const actions = document.querySelector('.actions');
        if (actions) actions.style.display = 'flex';

        // Handle Login hash when already logged in
        if (hash === 'login') {
            window.location.hash = '#dashboard';
            return;
        }

        const role = user.role;

        if (role === 'Staff') {
            // Staff cannot access dashboard, booking, or staff management
            const restricted = ['dashboard', 'booking', 'staff'];
            if (restricted.includes(hash)) {
                // Redirect to first available page for staff (e.g., care)
                window.location.hash = '#care';
                return; // Stop execution
            }
        }

        const viewContainer = document.getElementById('view-container');
        const pageTitle = document.getElementById('page-title');
        const navItems = document.querySelectorAll('.nav-item');

        // If route doesn't exist, default to something safe based on role
        let route = routes[hash];
        if (!route) {
            if (role === 'Staff') route = routes['care'];
            else route = routes['dashboard'];
        }

        // Update View
        const content = route.render();
        // Check for undefined render
        if (content === undefined) {
            console.error(`Render failed for route: ${hash}`);
            viewContainer.innerHTML = `<div style="color:red">Error rendering page: ${hash}</div>`;
        } else {
            viewContainer.innerHTML = content;
        }

        pageTitle.textContent = route.title;

        // Update Nav State
        navItems.forEach(item => {
            if (item.getAttribute('data-page') === hash) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Re-initialize icons for new content
        if (window.lucide) {
            window.lucide.createIcons();
        }
    } catch (e) {
        console.error("Routing Error:", e);
        document.getElementById('view-container').innerHTML = `
            <div style="color: #991B1B; background: #FEE2E2; padding: 1rem; border-radius: 8px; border: 1px solid #F87171;">
                <strong>Page Load Error:</strong> <br>
                ${e.message}
            </div>`;
    }
}

// Notifications Logic
window.toggleNotifications = function () {
    const dropdown = document.getElementById('notify-dropdown');
    const btn = document.getElementById('notify-btn');

    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
    } else {
        dropdown.classList.add('show');
        renderNotifications();

        // Close when clicking outside
        if (!window.notifyCloseHandler) {
            window.notifyCloseHandler = function (e) {
                if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
                    dropdown.classList.remove('show');
                    document.removeEventListener('click', window.notifyCloseHandler);
                    window.notifyCloseHandler = null;
                }
            };
            // Delay adding to avoid immediate close
            setTimeout(() => document.addEventListener('click', window.notifyCloseHandler), 0);
        }
    }
};

function renderNotifications() {
    const list = document.getElementById('notify-list');
    const notifs = store.getNotifications();

    // Sort: Latest first (assuming IDs increase with time)
    const sorted = [...notifs].sort((a, b) => b.id - a.id);

    if (sorted.length === 0) {
        list.innerHTML = '<div style="padding:1rem; color:var(--text-muted); text-align:center;">No notifications</div>';
        return;
    }

    list.innerHTML = sorted.map(n => `
        <div class="notify-item ${n.read ? '' : 'unread'}" onclick="handleNotificationClick(${n.id})">
            <div class="notify-dot"></div>
            <div class="notify-content">
                <div class="notify-text">${n.text}</div>
                <div class="notify-time">${n.time}</div>
            </div>
        </div>
    `).join('');
}

window.handleNotificationClick = function (id) {
    store.markNotificationRead(id);
    renderNotifications(); // Re-render to clear bold
    updateBadgeCount();
};

function updateBadgeCount() {
    const badge = document.getElementById('notify-badge');
    if (badge) {
        const count = store.getNotifications().filter(n => !n.read).length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';

        // Also ensure badge styles are visible if hidden by default?
        // Badge CSS: .badge { display: flex; ... }
        // If count is 0, we hide it.
    }
}

// Initial Load
window.addEventListener('load', () => {
    try {
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Restore user state UI
        const user = store.getCurrentUser();
        if (user) {
            const nameEl = document.getElementById('user-name');
            const avatarEl = document.getElementById('user-avatar');
            const selectEl = document.querySelector('.user-profile select');

            if (nameEl) nameEl.textContent = user.name;
            if (avatarEl) avatarEl.textContent = user.role.substring(0, 2).toUpperCase();
            if (selectEl) selectEl.value = user.role;
        }

        // Update notification badge
        updateBadgeCount();

        updateSidebarVisibility(user);
        handleRoute();
    } catch (e) {
        console.error("Initialization Error:", e);
        document.body.innerHTML = `<div style="color:red; padding:2rem;">
            <h1>System Error</h1>
            <p>Failed to initialize application.</p>
            <pre>${e.message}\n${e.stack}</pre>
        </div>`;
    }
});

// Hash Change Listener
window.addEventListener('hashchange', handleRoute);
