import { store } from '../store.js';

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentBookingContext = null;

// Navigation
window.changeMonth = (delta) => {
    currentMonth += delta;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendarGrid();
}

window.initiateBookingFromMatrix = (cottageId, day) => {
    // If we have a context, we might want to validate or just confirm
    // For simplicity in this vanilla version, we'll open a confirm prompt
    // Ideally, this would be drag-to-select, but click-to-start is easier

    const user = store.getCurrentUser();
    if (user.role === 'Staff') return; // Read only

    if (!currentBookingContext) {
        alert("Please select an inquiry from 'New Bookings' first to book a specific patient.");
        return;
    }

    if (confirm(`Book Cottage ${cottageId} for ${currentBookingContext.name} starting from day ${day}?`)) {
        // Calculate end date based on inquiry duration or default
        // USE NOON (12:00) to prevent Timezone shift to previous day when converting to ISO String
        const start = new Date(currentYear, currentMonth, day, 12, 0, 0);
        const end = new Date(start);

        // Calculate duration from context or default 7 days
        let duration = 7;
        if (currentBookingContext.from && currentBookingContext.to) {
            const d1 = new Date(currentBookingContext.from);
            const d2 = new Date(currentBookingContext.to);
            // Handle massive numbers or odd parsing
            const diffTime = Math.abs(d2 - d1);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (!isNaN(diffDays) && diffDays > 0) duration = diffDays;
        }

        // Add duration days to the noon-start-date
        end.setDate(end.getDate() + duration);

        store.addBooking({
            guest: currentBookingContext.name,
            cottage: cottageId,
            from: start.toISOString().split('T')[0],
            to: end.toISOString().split('T')[0],
            status: 'Confirmed'
        });

        // Update inquiry status
        // (Optional: store.updateInquiryStatus(currentBookingContext.id, 'Booked'))

        currentBookingContext = null;
        alert("Booking Confirmed!");
        renderCalendarGrid();
        // Refresh header area
        document.getElementById('calendar-header-area').innerHTML = renderHeader();
    }
}

function renderHeader() {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return `
        <div class="card" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="font-size: 1.5rem; font-weight: 600;">Cottage Availability</h2>
                    <p style="color: var(--text-muted);">Monthly Overview</p>
                </div>
                
                <div style="display: flex; align-items: center; gap: 1rem; background: var(--bg-body); padding: 0.5rem; border-radius: 8px;">
                    <button class="icon-btn" onclick="changeMonth(-1)"><i data-lucide="chevron-left"></i></button>
                    <span style="font-weight: 600; min-width: 150px; text-align: center;">${monthNames[currentMonth]} ${currentYear}</span>
                    <button class="icon-btn" onclick="changeMonth(1)"><i data-lucide="chevron-right"></i></button>
                </div>
            </div>
             ${currentBookingContext ? `
            <div style="margin-top: 1rem; padding: 1rem; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; color: #1E3A8A;">
                 <strong>Booking for:</strong> ${currentBookingContext.name} <br>
                 <span style="font-size: 0.9rem;">Requested: ${currentBookingContext.from} to ${currentBookingContext.to} (${currentBookingContext.type})</span>
                 <button onclick="currentBookingContext=null; location.reload()" style="margin-left: 1rem; font-size: 0.8rem; text-decoration: underline; background: none; border: none; color: #1E3A8A; cursor: pointer;">Cancel</button>
            </div>
            ` : ''}
        </div>
    `;
}

function renderCalendarGrid() {
    const container = document.getElementById('calendar-container');
    if (!container) return;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const cottages = store.state.cottages; // Direct access or via getter
    const bookings = store.state.bookings;

    // Build Header Row (Days)
    let headerHTML = '<div class="matrix-header-cell">Cottage</div>';
    for (let i = 1; i <= daysInMonth; i++) {
        headerHTML += `<div class="matrix-header-cell">${i}</div>`;
    }

    // Build Rows
    const rowsHTML = cottages.map(c => {
        // Sticky Header Cell for Cottage ID
        let rowCells = `<div class="matrix-row-header font-weight-bold" style="padding: 0.5rem; border-right: 1px solid var(--border-color); position: sticky; left: 0; background: white; z-index: 5;">${c.id}</div>`;

        for (let d = 1; d <= daysInMonth; d++) {
            // Safe Date Comparison: Compare YYYY-MM-DD strings only
            // Create date at NOON (12:00) to safely avoid timezone midnight shifts
            const cellDate = new Date(currentYear, currentMonth, d, 12, 0, 0);
            const cellDateStr = cellDate.toISOString().split('T')[0];

            // Check booking
            const booking = bookings.find(b => {
                return b.cottage === c.id && cellDateStr >= b.from && cellDateStr <= b.to;
            });

            if (booking) {
                // Determine if start, end or middle for styling
                const isStart = cellDateStr === booking.from;
                const isEnd = cellDateStr === booking.to;
                let borderRadius = '0';
                if (isStart) borderRadius = '4px 0 0 4px';
                if (isEnd) borderRadius = '0 4px 4px 0';
                if (isStart && isEnd) borderRadius = '4px';

                rowCells += `<div class="matrix-cell occupied" title="${booking.guest}" style="background: #F87171; border-radius: ${borderRadius}; cursor: not-allowed;"></div>`;
            } else {
                rowCells += `<div class="matrix-cell available" onclick="initiateBookingFromMatrix('${c.id}', ${d})" style="cursor: pointer;"></div>`;
            }
        }
        return `<div class="matrix-row" style="display: grid; grid-template-columns: 100px repeat(${daysInMonth}, 1fr); height: 40px; align-items: center; border-bottom: 1px solid var(--border-color);">${rowCells}</div>`;
    }).join('');

    container.innerHTML = `
        <div class="matrix-grid" style="overflow-x: auto;">
             <div class="matrix-header" style="display: grid; grid-template-columns: 100px repeat(${daysInMonth}, 1fr); border-bottom: 2px solid var(--border-color); font-weight: 600; font-size: 0.8rem; text-align: center; padding-bottom: 0.5rem;">
                ${headerHTML}
             </div>
             ${rowsHTML}
        </div>
        <div style="margin-top: 1rem; display: flex; gap: 1.5rem; justify-content: flex-end; font-size: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;"><div style="width: 12px; height: 12px; background: #F87171; border-radius: 2px;"></div> Occupied</div>
            <div style="display: flex; align-items: center; gap: 0.5rem;"><div style="width: 12px; height: 12px; background: var(--bg-body); border: 1px solid var(--border-color); border-radius: 2px;"></div> Available (Click to Book)</div>
        </div>
    `;

    // Slight hack for styling the grid cells dynamically
    if (!document.getElementById('matrix-styles')) {
        const style = document.createElement('style');
        style.id = 'matrix-styles';
        style.textContent = `
            .matrix-cell { height: 30px; margin: 5px 2px; background: #ECFDF5; border-radius: 2px; transition: background 0.2s; }
            .matrix-cell.available:hover { background: #34D399; }
            .matrix-header-cell { text-align: center; color: var(--text-muted); }
        `;
        document.head.appendChild(style);
    }
}

export function renderCalendar() {
    currentBookingContext = store.getBookingContext();
    if (currentBookingContext && currentBookingContext.from) {
        const d = new Date(currentBookingContext.from);
        currentMonth = d.getMonth();
        currentYear = d.getFullYear();
    }

    setTimeout(renderCalendarGrid, 50);

    return `
        <div class="calendar-page">
            <div id="calendar-header-area">
                ${renderHeader()}
            </div>
            <div id="calendar-container" class="card" style="padding: 1rem;">
                Loading Calendar...
            </div>
        </div>
    `;
}
