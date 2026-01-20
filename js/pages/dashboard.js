import { store } from '../store.js';

export function renderDashboard() {
    // Get statuses for TODAY
    const today = new Date().toISOString().split('T')[0];
    const cottages = store.getCottageStatuses(today);

    // Calculate stats based on today's dynamic status
    const available = cottages.filter(c => c.status === 'Available').length;
    const occupied = cottages.filter(c => c.status === 'Occupied').length;
    const occupancyRate = Math.round((occupied / 10) * 100);

    // Get active in-house guests count directly from occupied cottages
    const guests = occupied;

    return `
        <div class="dashboard-content">
            <!-- Stats Row -->
            <div class="stats-grid">
                <div class="card stat-card">
                    <div class="stat-header">
                        <span>Active Guests</span>
                        <i data-lucide="users" size="16"></i>
                    </div>
                    <div class="stat-value">${guests}</div>
                    <div class="stat-trend trend-up">
                        <small style="color:var(--text-muted); font-size:0.8rem;">Currently In-House currently</small>
                    </div>
                </div>

                <div class="card stat-card">
                    <div class="stat-header">
                        <span>Occupied Rooms</span>
                        <i data-lucide="home" size="16"></i>
                    </div>
                    <div class="stat-value">${occupied}/10</div>
                    <div class="stat-trend">
                        <span>${available} Available</span>
                    </div>
                </div>

                <div class="card stat-card">
                    <div class="stat-header">
                        <span>New Inquiries</span>
                        <i data-lucide="message-square" size="16"></i>
                    </div>
                    <div class="stat-value">${store.getInquiries().filter(i => i.status === 'Pending').length}</div>
                    <div class="stat-trend trend-up">
                        <span>Pending response</span>
                    </div>
                </div>

                <div class="card stat-card">
                    <div class="stat-header">
                        <span>Date</span>
                        <i data-lucide="calendar" size="16"></i>
                    </div>
                    <div class="stat-value" style="font-size: 1.5rem;">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                     <div class="stat-trend">
                        <span>${new Date().toLocaleDateString('en-GB', { weekday: 'long' })}</span>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;">
                <!-- Recent Activity / Timeline -->
                <div class="card">
                    <h3 style="margin-bottom: 1rem; font-weight: 600;">Today's Schedule</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Patient</th>
                                    <th>Activity</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Mock Schedule Data for Demo -->
                                <tr>
                                    <td>08:00 AM</td>
                                    <td>Sathyabhama</td>
                                    <td>Abhyangam</td>
                                    <td><span class="status-badge bg-green">Completed</span></td>
                                </tr>
                                <tr>
                                    <td>10:30 AM</td>
                                    <td>Rahul Menon</td>
                                    <td>Shirodhara</td>
                                    <td><span class="status-badge bg-blue">In Progress</span></td>
                                </tr>
                                <tr>
                                    <td>02:00 PM</td>
                                    <td>New Admission</td>
                                    <td>Consultation</td>
                                    <td><span class="status-badge bg-yellow">Pending</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Quick Actions or Mini Calendar -->
                <div class="card">
                    <h3 style="margin-bottom: 1rem; font-weight: 600;">Cottage Status (Today)</h3>
                    <div class="cottage-mini-list" style="display: flex; flex-direction: column; gap: 0.5rem;">
                        ${cottages.map(c => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--bg-body); border-radius: 8px;">
                                <div style="display:flex; flex-direction:column;">
                                    <span style="font-weight: 500;">${c.name}</span>
                                    ${c.currentGuest ? `<span style="font-size:0.7rem; color:var(--text-muted);">${c.currentGuest}</span>` : ''}
                                </div>
                                <span class="status-badge ${c.status === 'Available' ? 'bg-green' : 'bg-red'}" style="font-size: 0.7rem;">${c.status}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div style="text-align: center; margin-top: 1rem;">
                        <a href="#calendar" style="color: var(--primary); font-size: 0.9rem; font-weight: 500;">View Full Calendar</a>
                    </div>
                </div>
            </div>
        </div>
    `;
}
