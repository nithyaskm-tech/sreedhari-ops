import { store } from '../store.js';

window.updateCarePlan = (e, patientId) => {
    e.preventDefault();
    const form = e.target;

    // Update Diet
    store.updatePatientDiet(patientId, {
        type: form.elements['diet-type'].value,
        notes: form.elements['diet-notes'].value
    });

    // Add Medication if filled
    const medName = form.elements['new-med'].value;
    if (medName) {
        store.addPatientMedication(patientId, {
            name: medName,
            dosage: form.elements['new-dosage'].value,
            status: 'Active'
        });
    }

    alert('Care Plan Updated!');
    renderCareList(); // Refresh
};

function renderCareList() {
    const container = document.getElementById('care-list');
    if (!container) return;

    const patients = store.getPatients().filter(p => p.status === 'Active');
    const user = store.getCurrentUser(); // 'Staff' or 'Manager'/'Doctor'
    const canEdit = user.role !== 'Staff'; // Managers/Doctors can edit

    if (patients.length === 0) {
        container.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--text-muted);">No active patients to monitor.</div>`;
        return;
    }

    container.innerHTML = patients.map(p => {
        const diet = p.diet || { type: 'Standard', notes: 'No restrictions' };

        return `
        <div class="card" style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                <div>
                    <h3 style="font-size: 1.2rem; font-weight: 700;">${p.name} <span style="font-weight: 400; font-size: 0.9rem; color: var(--text-muted);">(Age: ${p.age})</span></h3>
                    <div style="font-size: 0.9rem; color: var(--primary);">Condition: ${p.condition}</div>
                </div>
                <!-- Vitals or status could go here -->
            </div>

            <div style="display: grid; grid-template-columns: ${canEdit ? '1fr 1fr' : '1fr'}; gap: 2rem;">
                
                <!-- View Mode (Visible to All) -->
                <div>
                     <h4 style="font-weight: 600; margin-bottom: 1rem; color: #0F766E;"><i data-lucide="utensils" width="16"></i> Current Diet Plan</h4>
                     <div style="background: #F0FDFA; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem;">${diet.type}</div>
                        <div style="color: var(--text-muted);">${diet.notes}</div>
                     </div>

                     <h4 style="font-weight: 600; margin-bottom: 1rem; color: #BE185D;"><i data-lucide="pill" width="16"></i> Active Medications</h4>
                     <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        ${p.medications.length ? p.medications.map(m => `
                            <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: #FFF1F2; border-radius: 6px; border: 1px solid #FFE4E6;">
                                <span style="font-weight: 500;">${m.name}</span>
                                <span>${m.dosage}</span>
                            </div>
                        `).join('') : '<div style="font-style:italic; color:var(--text-muted);">No active medications</div>'}
                     </div>
                </div>

                <!-- Edit Mode (Manager/Doctor Only) -->
                ${canEdit ? `
                <div style="border-left: 1px solid var(--border-color); padding-left: 2rem;">
                     <h4 style="font-weight: 600; margin-bottom: 1rem;">Update Care Instructions</h4>
                     <form onsubmit="updateCarePlan(event, ${p.id})">
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 500;">Diet Type</label>
                            <select name="diet-type" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                                <option ${diet.type === 'Standard' ? 'selected' : ''}>Standard</option>
                                <option ${diet.type === 'Salt-Free' ? 'selected' : ''}>Salt-Free</option>
                                <option ${diet.type === 'Diabetic' ? 'selected' : ''}>Diabetic</option>
                                <option ${diet.type === 'Liquid' ? 'selected' : ''}>Liquid</option>
                                <option ${diet.type === 'Detox' ? 'selected' : ''}>Detox</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                             <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 500;">Diet Instructions</label>
                             <textarea name="diet-notes" rows="2" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">${diet.notes}</textarea>
                        </div>

                        <div style="padding-top: 1rem; border-top: 1px dashed var(--border-color);">
                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 500;">Prescribe New Medicine</label>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
                                <input name="new-med" placeholder="Medication Name" style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                                <input name="new-dosage" placeholder="Dosage" style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary" style="width: 100%;">Update Plan</button>
                     </form>
                </div>
                ` : ''}

            </div>
        </div>
    `}).join('');

    if (window.lucide) window.lucide.createIcons();
}

export function renderCare() {
    setTimeout(renderCareList, 50);

    return `
        <div class="care-page">
            <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem;">Daily Diet & Medicine Monitor</h2>
            <div id="care-list">
                Loading Care Plans...
            </div>
        </div>
    `;
}
