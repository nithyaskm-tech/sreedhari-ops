import { store } from '../store.js';

window.handleAddStaff = (e) => {
    e.preventDefault();
    const form = e.target;

    // Call registerUser which internally adds to staff list and generates password
    const password = store.registerUser({
        name: form.elements['name'].value,
        email: form.elements['email'].value,
        dept: form.elements['dept'].value,
        role: form.elements['role'].value
    });

    // Simulate Email Notification
    const msg = "Success! User Account Created.\\n\\n 📧 SIMULATED EMAIL TO: " + form.elements['email'].value + "\\n ----------------------------------------------------\\n Welcome to Sreedhari! Your login credentials are:\\n Password: " + password + "\\n ----------------------------------------------------";
    alert(msg);

    form.reset();
    renderStaffList();
};

window.removeStaff = (id) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
        store.removeStaff(id);
        renderStaffList();
    }
};

function renderStaffList() {
    const listEl = document.getElementById('staff-list');
    if (!listEl) return;

    const staff = store.getStaff();
    listEl.innerHTML = staff.map(s => `
    <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="width: 40px; height: 40px; background: var(--bg-body); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--primary);">
                ${s.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
                <div style="font-weight: 600;">${s.name}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">${s.dept} • ${s.role}</div>
            </div>
        </div>
            ${s.role !== 'Manager' && s.role !== 'Doctor' ? `
            <button onclick="removeStaff(${s.id})" class="icon-btn" style="color: #EF4444;"><i data-lucide="trash-2" width="16"></i></button>
            ` : ''
        }
        </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
}

export function renderStaff() {
    const user = store.getCurrentUser();
    // Logic: Only Managers/Doctors can see this page content? 
    // The router might allow it, but we can restrict adding.

    const canEdit = user.role === 'Manager' || user.role === 'Doctor';
    if (!canEdit) {
        return `<div style="padding: 2rem; text-align: center;"> Access Restricted.Only Managers can view Staff details.</div>`;
    }

    setTimeout(renderStaffList, 50);

    return `
    <div class="staff-page">
             <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem;">Staff Management</h2>

             <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
                
                <!-- Add Staff Form -->
                <div class="card" style="height: fit-content;">
                    <h3 style="font-weight: 600; margin-bottom: 1rem;">Add New Staff</h3>
                    <form onsubmit="handleAddStaff(event)">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Staff Name</label>
                                <input name="name" type="text" required class="input" placeholder="Full Name" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                            <div>
                                 <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email Address</label>
                                <input name="email" type="email" required class="input" placeholder="staff@sreedhari.com" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Department</label>
                                <select name="dept" class="input" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: white;">
                                    <option>Treatment</option>
                                    <option>Consultation</option>
                                    <option>Pharmacy</option>
                                    <option>Administration</option>
                                </select>
                            </div>
                             <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Role</label>
                                <select name="role" class="input" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: white;">
                                    <option>Staff</option>
                                    <option>Doctor</option>
                                    <option>Manager</option>
                                </select>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary" style="width: 100%;">Add Staff Member</button>
                    </form>
                </div>

                <!-- Staff List -->
                <div>
                    <h3 style="font-weight: 600; margin-bottom: 1rem;">Current Team</h3>
                    <div id="staff-list" style="display: flex; flex-direction: column; gap: 1rem;">
                         Loading...
                    </div>
                </div>

             </div>
        </div>
    `;
}
