import { store } from '../store.js';

// Handler for existing booking form
window.handleBookingSubmit = (e) => {
    e.preventDefault();
    const form = e.target;

    // Create an inquiry from form data
    const inquiry = {
        name: form.elements['name'].value,
        contact: form.elements['contact'].value,
        from: form.elements['checkin'].value,
        to: form.elements['checkout'].value,
        type: form.elements['type'].value,
        symptoms: form.elements['symptoms'].value,
        status: 'Pending'
    };

    store.addInquiry(inquiry);
    alert("Inquiry Registered! You can now process it from the Inbox.");
    form.reset();
    renderBookingInbox(); // refresh list
};

window.processInquiry = (id) => {
    const inquiry = store.getInquiry(id);
    if (!inquiry) return;

    // Set context and redirect
    store.setBookingContext(inquiry);
    window.location.hash = '#calendar';
};

function renderBookingInbox() {
    const listEl = document.getElementById('inquiry-list');
    if (!listEl) return;

    const inquiries = store.getInquiries();
    const pending = inquiries.filter(i => i.status === 'Pending' || i.status === 'In-Review');

    if (pending.length === 0) {
        listEl.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No pending inquiries.</div>';
        return;
    }

    listEl.innerHTML = pending.map(i => `
        <div style="padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-weight: 600; font-size: 0.95rem;">${i.name}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px;">
                    ${i.type} Cottage • ${i.from} to ${i.to}
                </div>
                <div style="font-size: 0.8rem; color: var(--text-main); background: var(--bg-body); padding: 2px 6px; border-radius: 4px; display: inline-block;">
                    ${i.symptoms}
                </div>
            </div>
            <button onclick="processInquiry(${i.id})" class="btn btn-primary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
                Check Availability
            </button>
        </div>
    `).join('');
}

export function renderBooking() {
    // Initial Render
    setTimeout(renderBookingInbox, 100);

    return `
        <div class="booking-page">
            <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem;">New Booking & Inquiries</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                
                <!-- Section 1: Register New Inquiry -->
                <div class="card">
                     <h3 style="font-weight: 600; margin-bottom: 1rem;">Register New Inquiry</h3>
                     <form onsubmit="handleBookingSubmit(event)">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Patient Name</label>
                                <input name="name" type="text" required class="input-field" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Contact</label>
                                <input name="contact" type="tel" required class="input-field" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Check-in</label>
                                <input name="checkin" type="date" required class="input-field" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Check-out</label>
                                <input name="checkout" type="date" required class="input-field" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                        </div>

                         <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Cottage Preference</label>
                            <select name="type" class="input-field" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: white;">
                                <option value="Any">Any Type</option>
                                <option value="Premium">Premium Cottage</option>
                                <option value="Standard">Standard Cottage</option>
                            </select>
                        </div>

                         <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Primary Concerns / Symptoms</label>
                            <textarea name="symptoms" rows="2" class="input-field" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);"></textarea>
                        </div>
                        
                        <button type="submit" class="btn btn-primary" style="width: 100%;">Save Inquiry</button>
                     </form>
                </div>

                <!-- Section 2: Inquiry Inbox -->
                <div class="card" style="height: fit-content;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                        <h3 style="font-weight: 600;">Inquiry Box</h3>
                        <span class="badge bg-yellow" style="font-size: 0.75rem;">Action Required</span>
                    </div>
                    
                    <div id="inquiry-list" style="display: flex; flex-direction: column;">
                         <div class="loading-state">Loading inquiries...</div>
                    </div>
                </div>

            </div>
        </div>
    `;
}
