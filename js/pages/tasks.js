import { store } from '../store.js';

// --- STAFF LOGIC (My Tasks) ---

window.handleMyTaskAction = (id, action) => {
    const currentUser = store.getCurrentUser();

    if (action === 'accept') {
        store.acceptScheduleTask(id, currentUser.name);
    } else if (action === 'complete') {
        const note = prompt('Add a completion note (optional):');
        if (note !== null) {
            store.completeScheduleTask(id, currentUser.name, note);
        }
    }
    // Refresh
    const user = store.getCurrentUser();
    if (user.role === 'Manager' || user.role === 'Doctor') {
        renderManagerTasksList();
    } else {
        renderStaffTasksList();
    }
};

function renderStaffTasksList() {
    const el = document.getElementById('tasks-view-container');
    if (!el) return;

    const user = store.getCurrentUser();
    if (!user) return;

    const allSchedules = store.getStaffSchedules();
    const myTasks = allSchedules.filter(s => {
        if (user.email === 'staff@sreedhari.com') return true;
        return s.staff === user.name;
    });

    // Sort: Pending first
    myTasks.sort((a, b) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        return 0;
    });

    if (myTasks.length === 0) {
        el.innerHTML = `
            <div style="padding:3rem; text-align:center; color:var(--text-muted); background: white; border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
                <i data-lucide="clipboard-check" style="margin-bottom: 1rem; width: 48px; height: 48px; opacity: 0.5;"></i>
                <p>No tasks assigned to you today.</p>
            </div>`;
    } else {
        el.innerHTML = myTasks.map(t => createTaskCard(t)).join('');
    }

    if (window.lucide) window.lucide.createIcons();
}

function createTaskCard(t) {
    const isDone = t.status === 'Completed';
    const isAccepted = t.status === 'Accepted';
    const isPending = t.status === 'Pending';

    let statusBadge = `<span style="display:inline-block; padding: 0.25rem 0.5rem; background: #DBEAFE; color: #1E40AF; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem;">${t.type}</span>`;
    if (isAccepted) statusBadge = `<span style="display:inline-block; padding: 0.25rem 0.5rem; background: #FEF3C7; color: #92400E; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem;">Running</span>`;
    if (isDone) statusBadge = `<span style="display:inline-block; padding: 0.25rem 0.5rem; background: #DCFCE7; color: #166534; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem;">Done</span>`;

    let actionArea = '';

    // Check role for action visibility
    const user = store.getCurrentUser();
    const isManager = user && (user.role === 'Manager' || user.role === 'Doctor');

    if (isManager) {
        // Managers only see status
        if (isPending) {
            actionArea = `<span style="color:var(--text-muted); font-size:0.85rem; background:#F3F4F6; padding:0.25rem 0.5rem; border-radius:4px;">Pending</span>`;
        } else if (isAccepted) {
            actionArea = `<span style="color:#D97706; font-size:0.85rem; font-weight:600; background:#FFFBEB; padding:0.25rem 0.5rem; border-radius:4px;">In Progress</span>`;
        } else if (isDone) {
            actionArea = `<span style="color:#10B981; font-size:0.85rem; font-weight:600; background:#ECFDF5; padding:0.25rem 0.5rem; border-radius:4px;">✓ Completed</span>`;
        }
    } else {
        // Staff see buttons
        if (isPending) {
            actionArea = `<button onclick="handleMyTaskAction(${t.id}, 'accept')" class="btn" style="padding:0.5rem 1rem; font-size: 0.8rem; background-color: var(--primary); color: white;">Accept</button>`;
        } else if (isAccepted) {
            actionArea = `<button onclick="handleMyTaskAction(${t.id}, 'complete')" class="btn" style="padding:0.5rem 1rem; font-size: 0.8rem; background-color: #059669; color: white;">Mark Done</button>`;
        } else if (isDone) {
            actionArea = `<span style="color:#10B981; font-size:0.8rem;">✓ Done</span>`;
        }
    }

    return `
        <div class="card" style="margin-bottom:1rem; padding:1rem; border-left: 4px solid ${isDone ? '#10B981' : (isAccepted ? '#F59E0B' : 'var(--primary)')}; opacity: ${isDone ? 0.75 : 1};">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div style="flex: 1;">
                    <div style="margin-bottom:0.25rem;">
                            ${statusBadge}
                            <span style="font-size: 0.75rem; color: var(--text-muted);">Assigned to: <b>${t.staff}</b></span>
                    </div>
                    <div style="font-weight:600; font-size:1rem; margin-bottom: 0.25rem;">${t.task}</div>
                    <div style="color:var(--text-muted); font-size:0.85rem;">
                        <span style="white-space: nowrap;">Time: ${t.time}</span> • Patient: ${t.patient || 'N/A'}
                    </div>
                    ${t.completionNote ? `<div style="font-size:0.8rem; color:#166534; margin-top:0.5rem; background:#F0FDF4; padding:0.25rem;">Note: ${t.completionNote}</div>` : ''}
                </div>
                <div style="margin-left: 1rem;">${actionArea}</div>
            </div>
        </div>
    `;
}


// --- MANAGER LOGIC (Assign Tasks) ---

window.handleNewTaskSubmit = (e) => {
    e.preventDefault();
    const form = e.target;

    // Construct task object
    const taskData = {
        type: form.elements['type'].value,
        staff: form.elements['staff'].value,
        patient: form.elements['patient'].value || 'General',
        time: form.elements['time'].value,
        task: form.elements['task'].value,
        status: 'Pending'
    };

    // Conflict Check
    const hasConflict = store.checkScheduleConflict(taskData.staff, taskData.time);
    if (hasConflict) {
        alert(`Conflict: ${taskData.staff} is busy around ${taskData.time}.`);
        return;
    }

    store.addStaffSchedule(taskData);
    form.reset();
    renderManagerTasksList();
    alert("Task Assigned Successfully!");
};

function renderManagerTasksList() {
    const el = document.getElementById('tasks-view-container');
    if (!el) return;

    // Get all tasks
    const allSchedules = store.getStaffSchedules() || [];

    // Sort logic: Pending -> Accepted -> Completed
    const sorted = [...allSchedules].sort((a, b) => {
        const order = { 'Pending': 1, 'Accepted': 2, 'Completed': 3 };
        return (order[a.status] || 4) - (order[b.status] || 4);
    });

    if (sorted.length === 0) {
        el.innerHTML = '<div style="text-align:center; color:gray; padding:2rem;">No tasks found. Assign one!</div>';
        return;
    }

    el.innerHTML = sorted.map(t => createTaskCard(t)).join('');
    if (window.lucide) window.lucide.createIcons();
}


// --- MAIN RENDER ---

export function renderTasks() {
    const user = store.getCurrentUser();
    if (!user) return '<div>Please log in</div>';

    const isManager = user.role === 'Manager' || user.role === 'Doctor';
    const patients = store.getPatients();
    const staffList = store.getStaff();

    // Determine initial render call
    setTimeout(() => {
        if (isManager) renderManagerTasksList();
        else renderStaffTasksList();
    }, 50);

    // Layout
    if (isManager) {
        return `
            <div class="tasks-page" style="max-width: 1200px; margin: 0 auto; animation: fadeIn 0.3s ease;">
                <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                    <h2 style="font-size: 1.8rem; font-weight: 700; color: var(--primary-dark);">Assign & Monitor Tasks</h2>
                    <p style="color: var(--text-muted);">Create new tasks and track completion status</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
                    
                    <!-- LEFT: Assign Form -->
                    <div class="card" style="height: fit-content;">
                        <h3 style="font-weight: 600; margin-bottom: 1.5rem;">Assign New Task</h3>
                        <form onsubmit="handleNewTaskSubmit(event)">
                            <div style="margin-bottom: 1rem;">
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Task Type</label>
                                <select name="type" required style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: white;">
                                    <option value="General">General Task</option>
                                    <option value="Therapy">Therapy</option>
                                    <option value="Kitchen">Diet/Kitchen</option>
                                    <option value="Admin">Administrative</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            
                            <div style="margin-bottom: 1rem;">
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Select Staff</label>
                                <select name="staff" required style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: white;">
                                    <option value="">-- Choose Staff --</option>
                                    ${staffList.map(s => `<option value="${s.name}">${s.name} (${s.role})</option>`).join('')}
                                     <!-- Fallback for generic typing? No, stick to list for now -->
                                </select>
                            </div>

                            <div style="margin-bottom: 1rem;">
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Related Patient (Optional)</label>
                                <select name="patient" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: white;">
                                    <option value="">None / General</option>
                                    ${patients.filter(p => p.status === 'Active').map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
                                </select>
                            </div>

                            <div style="margin-bottom: 1rem;">
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Time</label>
                                <input name="time" type="time" required style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>

                            <div style="margin-bottom: 1.5rem;">
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Task Description</label>
                                <textarea name="task" rows="2" placeholder="e.g. Clean Cottage 4, Prepare medicine..." required style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);"></textarea>
                            </div>

                            <button type="submit" class="btn btn-primary" style="width: 100%;">Assign Task</button>
                        </form>
                    </div>

                    <!-- RIGHT: Task List -->
                    <div>
                        <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="font-weight: 600;">All Active Tasks</h3>
                            <button onclick="renderManagerTasksList()" class="icon-btn" title="Refresh"><i data-lucide="refresh-cw"></i></button>
                        </div>
                        <div id="tasks-view-container">
                            <div class="loading-state">Loading tasks...</div>
                        </div>
                    </div>

                </div>
            </div>
        `;
    }

    // STAFF VIEW
    else {
        return `
            <div class="tasks-page" style="max-width: 900px; margin: 0 auto; animation: fadeIn 0.4s ease-out;">
                 <div style="margin-bottom: 2rem; display:flex; justify-content:space-between; align-items:end; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                    <div>
                        <h2 style="font-size: 2rem; font-weight: 800; color: var(--primary-dark); margin-bottom: 0.5rem;">My Tasks</h2>
                        <p style="color: var(--text-muted);">Manage your assigned duties for today</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.2rem; font-weight: 600; color: var(--text-main);">${new Date().toLocaleDateString('en-US', { weekday: 'long' })}</div>
                        <div style="color:var(--text-muted);">${new Date().toLocaleDateString()}</div>
                    </div>
                </div>
                
                <div id="tasks-view-container">
                    <div class="loading-state">Loading your tasks...</div>
                </div>
            </div>
        `;
    }
}
