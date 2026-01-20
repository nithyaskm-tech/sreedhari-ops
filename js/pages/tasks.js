import { store } from '../store.js';

window.handleMyTaskAction = (id, action) => {
    const currentUser = store.getCurrentUser();

    if (action === 'accept') {
        store.acceptScheduleTask(id, currentUser.name);
        renderMyTasksList();
    } else if (action === 'complete') {
        const note = prompt('Add a completion note (optional):');
        if (note !== null) {
            store.completeScheduleTask(id, currentUser.name, note);
            renderMyTasksList();
        }
    }
};

function renderMyTasksList() {
    const el = document.getElementById('my-tasks-list');
    if (!el) return;

    const user = store.getCurrentUser();
    if (!user) return;

    const allSchedules = store.getStaffSchedules();
    // Filter logic: If general staff, show all. Else show only assigned.
    const myTasks = allSchedules.filter(s => {
        if (user.email === 'staff@sreedhari.com') return true;
        return s.staff === user.name;
    });

    // Sort: Pending first, then completed. Then by time.
    myTasks.sort((a, b) => {
        if (a.status === b.status) return 0; // or time sort
        // Pending comes before Completed
        if (a.status === 'Pending') return -1;
        if (b.status === 'Pending') return 1;
        return 0;
    });

    if (myTasks.length === 0) {
        el.innerHTML = `
            <div style="padding:3rem; text-align:center; color:var(--text-muted); background: white; border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
                <i data-lucide="clipboard-check" style="margin-bottom: 1rem; width: 48px; height: 48px; opacity: 0.5;"></i>
                <p>No tasks assigned to you today.</p>
            </div>`;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    el.innerHTML = myTasks.map(t => {
        const isDone = t.status === 'Completed';
        const isAccepted = t.status === 'Accepted';
        const isPending = t.status === 'Pending';

        let statusBadge = `<span style="display:inline-block; padding: 0.25rem 0.5rem; background: #DBEAFE; color: #1E40AF; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem;">${t.type}</span>`;
        if (isAccepted) statusBadge = `<span style="display:inline-block; padding: 0.25rem 0.5rem; background: #FEF3C7; color: #92400E; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem;">Running</span>`;
        if (isDone) statusBadge = `<span style="display:inline-block; padding: 0.25rem 0.5rem; background: #DCFCE7; color: #166534; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem;">Done</span>`;

        let actionArea = '';
        if (isPending) {
            actionArea = `<button onclick="handleMyTaskAction(${t.id}, 'accept')" class="btn" style="padding:0.6rem 1.5rem; font-weight: 500; display: flex; align-items: center; gap: 0.5rem; background-color: var(--primary); color: white; border: none; border-radius: 6px;">
                            <i data-lucide="play" width="18"></i> Accept Task
                          </button>`;
        } else if (isAccepted) {
            actionArea = `<button onclick="handleMyTaskAction(${t.id}, 'complete')" class="btn" style="padding:0.6rem 1.5rem; font-weight: 500; display: flex; align-items: center; gap: 0.5rem; background-color: #059669; color: white; border: none; border-radius: 6px;">
                            <i data-lucide="check-square" width="18"></i> Mark Done
                          </button>`;
        } else if (isDone) {
            actionArea = `<div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem;">
                                <div style="display: flex; align-items: center; gap: 0.5rem; color:#10B981; font-weight:700; font-size:1rem;">
                                    <i data-lucide="check-circle" width="20"></i> Completed
                                </div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">at ${t.completedAt}</div>
                           </div>`;
        }

        return `
            <div class="card" style="margin-bottom:1rem; padding:1.5rem; border-left: 5px solid ${isDone ? '#10B981' : (isAccepted ? '#F59E0B' : 'var(--primary)')}; opacity: ${isDone ? 0.75 : 1}; transition: transform 0.2s;">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div style="flex: 1;">
                        <div style="margin-bottom:0.5rem;">
                             ${statusBadge}
                             <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); background: var(--bg-body); padding: 0.2rem 0.5rem; border: 1px solid var(--border-color); border-radius: 4px;">Assigned to: ${t.staff}</span>
                        </div>
                        <div style="font-weight:700; font-size:1.2rem; margin-bottom: 0.5rem; ${isDone ? 'text-decoration:line-through; color: var(--text-muted);' : 'color: var(--text-main);'}">${t.task}</div>
                        <div style="color:var(--text-muted); font-size:0.95rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="clock" width="16"></i> <span style="font-weight:600; color:var(--text-main);">${t.time}</span> 
                            <span style="margin: 0 4px;">•</span>
                            <i data-lucide="user" width="16"></i> Patient: <span style="font-weight:600;">${t.patient}</span>
                        </div>
                        
                        ${t.completionNote ? `
                            <div style="margin-top:1rem; padding: 0.75rem; background: #F0FDF4; border-radius: 6px; border: 1px solid #BBF7D0;">
                                <div style="font-size: 0.75rem; font-weight: 600; color: #15803D; margin-bottom: 0.25rem;">Completion Note:</div>
                                <div style="font-size: 0.9rem; color: #166534;">${t.completionNote}</div>
                            </div>
                        ` : ''}
                    </div>
                    <div style="margin-left: 2rem;">
                         ${actionArea}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
}

export function renderTasks() {
    const user = store.getCurrentUser();
    if (!user) return '<div>Please log in</div>';

    setTimeout(renderMyTasksList, 50);

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
            
            <div id="my-tasks-list">
                <div class="loading-state">Loading your tasks...</div>
            </div>
        </div>
    `;
}
