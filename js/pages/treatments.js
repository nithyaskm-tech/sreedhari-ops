import { store } from '../store.js';

window.handleAddSchedule = (e) => {
    e.preventDefault();
    const form = e.target;

    const editId = document.getElementById('edit-task-id').value;
    const formData = {
        type: e.target.type.value,
        staff: e.target.staff.value,
        patient: e.target.patient.value,
        time: e.target.time.value,
        task: e.target.task.value
    };

    if (editId) {
        store.updateStaffSchedule(parseInt(editId), formData);
        document.getElementById('edit-task-id').value = '';
        const btn = document.querySelector('#schedule-form button[type="submit"]');
        if (btn) btn.innerHTML = '<i data-lucide="plus"></i> Add Schedule';
    } else {
        // Check Conflict only for new additions
        const hasConflict = store.checkScheduleConflict(formData.staff, formData.time);
        if (hasConflict) {
            alert(`Conflict Detected! ${formData.staff} is already assigned to another task around ${formData.time}. Please choose a different time or staff member.`);
            return;
        }
        formData.status = 'Pending';
        store.addStaffSchedule(formData);
    }

    renderScheduleList();
    e.target.reset();
    if (window.lucide) window.lucide.createIcons();
};

window.editTask = (id) => {
    const schedules = store.getStaffSchedules();
    const task = schedules.find(s => s.id === id);
    if (task) {
        const form = document.getElementById('schedule-form');
        if (form) {
            form.type.value = task.type;
            form.staff.value = task.staff;
            form.patient.value = task.patient;
            form.time.value = task.time;
            form.task.value = task.task;
            document.getElementById('edit-task-id').value = task.id;

            const btn = form.querySelector('button[type="submit"]');
            if (btn) btn.textContent = 'Update Schedule';

            // Scroll to form
            form.scrollIntoView({ behavior: 'smooth' });
        }
    }
};

window.markTaskComplete = (id) => {
    const currentUser = store.getCurrentUser();
    // Prompt for optional note
    const note = prompt('Enter a completion note (optional):');
    if (note !== null) { // If not cancelled
        store.completeScheduleTask(id, currentUser.name, note);
        renderScheduleList();
    }
};

window.toggleComments = (id) => {
    const el = document.getElementById(`comments-${id}`);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
};

window.handlePostComment = (e, id) => {
    e.preventDefault();
    const input = e.target.elements['comment'];
    const val = input.value.trim();
    if (val) {
        const user = store.getCurrentUser();
        store.addTaskComment(id, val, user);
        renderScheduleList();
        // Re-open comments
        setTimeout(() => {
            const el = document.getElementById(`comments-${id}`);
            if (el) el.style.display = 'block';
        }, 50);
    }
};

function renderScheduleList() {
    const schedules = store.getStaffSchedules();
    const listContainer = document.getElementById('schedule-list-container');
    if (!listContainer) return;

    // Group by Type
    const therapy = schedules.filter(s => s.type === 'Therapy');
    const kitchen = schedules.filter(s => s.type === 'Kitchen');
    const other = schedules.filter(s => s.type !== 'Therapy' && s.type !== 'Kitchen');

    const currentUser = store.getCurrentUser();
    const isManager = currentUser.role === 'Manager' || currentUser.role === 'Doctor';

    const renderGroup = (items, title, icon) => `
        <div style="margin-bottom: 1.5rem;">
            <h4 style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.8rem; display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="${icon}" width="16"></i> ${title}
            </h4>
            <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                ${items.length ? items.map(s => {
        const isCompleted = s.status === 'Completed';
        // Show completion info to everyone if completed
        const completeInfo = isCompleted ?
            `<div style="font-size: 0.75rem; color: #059669; margin-top: 4px;">
                ✓ Done by ${s.completedBy} at ${s.completedAt}
                ${s.completionNote ? `<br><span style="color:var(--text-muted); font-style:italic;">Note: ${s.completionNote}</span>` : ''}
             </div>` : '';

        const actionBtn = !isCompleted ?
            `<button onclick="markTaskComplete(${s.id})" class="btn" style="font-size: 0.75rem; padding: 4px 8px; border: 1px solid var(--primary); background: transparent; color: var(--primary);">Mark Done</button>` :
            `<i data-lucide="check-circle" style="color: #10B981; width: 20px;"></i>`;

        const comments = s.comments || [];
        const commentCount = comments.length;

        const editBtn = isManager && !isCompleted ?
            `<button onclick="editTask(${s.id})" class="icon-btn" title="Edit" style="width:32px; height:32px; background:var(--bg-card);"><i data-lucide="edit-2" width="14"></i></button>` : '';

        return `
                    <div class="card" style="padding: 1rem; border-left: 4px solid ${isCompleted ? '#10B981' : 'var(--primary)'}; opacity: ${isCompleted ? '0.8' : '1'};">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <div style="font-weight: 600; margin-bottom: 0.2rem; ${isCompleted ? 'text-decoration: line-through;' : ''}">${s.task}</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">
                                    <span style="font-weight: 500; color: var(--text-main);">${s.time}</span> • ${s.staff} • For: ${s.patient}
                                </div>
                                ${completeInfo}
                            </div>
                             <div style="display:flex; align-items:center; gap:0.5rem;">
                                 ${editBtn}
                                 <button onclick="toggleComments(${s.id})" class="icon-btn" style="width: 32px; height: 32px; font-size: 0.8rem; cursor: pointer;" title="Comments">
                                    <i data-lucide="message-square" width="14"></i>
                                    ${commentCount > 0 ? `<span style="margin-left:4px; font-weight:600; font-size: 0.7rem;">${commentCount}</span>` : ''}
                                 </button>
                                 ${actionBtn}
                            </div>
                        </div>

                         <!-- Comments Section -->
                        <div id="comments-${s.id}" style="display: none; border-top: 1px solid var(--border-color); margin-top: 1rem; padding-top: 1rem;">
                            <div style="max-height: 150px; overflow-y: auto; margin-bottom: 0.8rem; display: flex; flex-direction: column; gap: 0.5rem;">
                                ${comments.length ? comments.map(c => `
                                    <div style="background: var(--bg-body); padding: 0.5rem; border-radius: 6px; font-size: 0.85rem;">
                                        <div style="font-weight: 600; font-size: 0.75rem; color: var(--text-muted); display: flex; justify-content: space-between;">
                                            <span>${c.by}</span>
                                            <span>${c.time}</span>
                                        </div>
                                        <div>${c.text}</div>
                                    </div>
                                `).join('') : '<div style="font-style:italic; color:var(--text-muted); font-size:0.8rem;">No comments yet.</div>'}
                            </div>
                            <form onsubmit="handlePostComment(event, ${s.id})" style="display: flex; gap: 0.5rem;">
                                <input name="comment" required placeholder="Add a comment..." style="flex: 1; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem;">
                                <button type="submit" class="btn btn-primary" style="padding: 0.5rem 1rem;">Send</button>
                            </form>
                        </div>
                    </div>
                `}).join('') : '<div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">No tasks scheduled.</div>'}
            </div>
        </div>
    `;

    listContainer.innerHTML =
        renderGroup(therapy, 'Therapy Schedules', 'calendar-heart') +
        renderGroup(kitchen, 'Diet & Kitchen', 'utensils') +
        renderGroup(other, 'Other Tasks', 'clipboard-list');

    if (window.lucide) window.lucide.createIcons();
}

export function renderTreatments() {
    // We'll use a unique ID for the container to target it
    setTimeout(renderScheduleList, 100);

    const patients = store.getPatients();
    const currentUser = store.getCurrentUser();
    const canEdit = currentUser.role === 'Doctor' || currentUser.role === 'Manager';

    return `
         <div class="treatments-page">
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
                
                <!-- Schedule Creator (Only for Doctor/Manager) -->
                ${canEdit ? `
                <div class="card" style="height: fit-content;">
                     <h3 style="font-weight: 600; margin-bottom: 1.5rem;">Assign Schedule</h3>
                     <form onsubmit="handleAddSchedule(event)" id="schedule-form">
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Task Type</label>
                            <select name="type" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: white;">
                                <option value="Therapy">Therapy Session</option>
                                <option value="Kitchen">Diet / Kitchen</option>
                                <option value="Medicine">Medicine Admin</option>
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Patient</label>
                            <select name="patient" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: white;">
                                <option value="">Select Patient...</option>
                                ${patients.filter(p => p.status === 'Active').map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
                            </select>
                        </div>

                         <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Assign Staff</label>
                            <input name="staff" type="text" placeholder="e.g. Staff Name" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                            <input type="hidden" id="edit-task-id">
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Time</label>
                                <input name="time" type="time" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                             <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Task Name</label>
                                <input name="task" type="text" placeholder="e.g. Abhyangam" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary" style="width: 100%;">Add to Schedule</button>
                     </form>

                     <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border-color);">
                         <!-- Helper note about conflicts -->
                        <div style="padding: 0.8rem; background: #FFF7ED; border-left: 3px solid #F97316; font-size: 0.8rem; color: #9A3412;">
                            <b>Conflict Check Active:</b> The system will prevent assigning the same staff member to overlapping slots (within 60 mins).
                        </div>
                     </div>
                </div>
                ` : ''}

                <!-- Schedule Display -->
                <div ${!canEdit ? 'style="grid-column: 1 / -1;"' : ''}>
                     <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3 style="font-weight: 600; font-size: 1.5rem;">Daily Schedules</h3>
                        <div style="color: var(--text-muted); font-size: 0.9rem;">Today: ${new Date().toLocaleDateString()}</div>
                    </div>
                    
                    <div id="schedule-list-container">
                        <div class="loading-state">Loading schedules...</div>
                    </div>
                </div>

            </div>
         </div>
    `;
}
