// Basic State Management Store

const MOCK_DATA = {
    cottages: Array.from({ length: 10 }, (_, i) => ({
        id: `C${i + 1}`,
        name: `Cottage ${i + 1}`,
        type: i < 3 ? 'Premium' : 'Standard',
        status: ['Available', 'Occupied', 'Cleaning'][Math.floor(Math.random() * 3)],
        currentGuest: i % 3 === 0 ? 'John Doe' : null,
        nextBooking: '2026-01-20'
    })),
    patients: [
        {
            id: 1,
            name: 'Sathyabhama',
            age: 65,
            gender: 'Female',
            contact: '9876543210',
            status: 'Active',
            condition: 'Arthritis',
            lastVisit: '2025-12-10',
            history: [
                { date: '2025-12-10', type: 'Consultation', notes: 'Complained of severe knee pain. Swelling observed.', by: 'Dr. A. Nair' }
            ],
            treatments: [
                { name: 'Abhyangam', duration: '7 Days', status: 'Completed', notes: 'Responded well to oil application.' }
            ],
            medications: [
                { name: 'Dhanwantharam Kashayam', dosage: '15ml twice daily', status: 'Ongoing' }
            ]
        },
        {
            id: 2,
            name: 'Rahul Menon',
            age: 42,
            gender: 'Male',
            contact: '9988776655',
            status: 'Active',
            condition: 'Stress Management',
            lastVisit: '2026-01-05',
            history: [],
            treatments: [],
            medications: []
        },
        {
            id: 3,
            name: 'Alice Smith',
            age: 34,
            gender: 'Female',
            contact: '1122334455',
            status: 'Discharged',
            condition: 'Detox',
            lastVisit: '2025-11-20',
            history: [],
            treatments: [],
            medications: []
        },
    ],
    bookings: [
        { id: 101, guest: 'Sathyabhama', cottage: 'C1', from: '2026-01-01', to: '2026-01-15', status: 'Confirmed' },
        { id: 102, guest: 'Rahul Menon', cottage: 'C3', from: '2026-01-10', to: '2026-01-24', status: 'Checked-In' },
    ],
    startSchedules: [
        { id: 1, type: 'Therapy', staff: 'Jiji', patient: 'Sathyabhama', time: '08:00', task: 'Abhyangam', status: 'Pending' },
        { id: 2, type: 'Kitchen', staff: 'Santamma', patient: 'Sathyabhama', time: '07:30', task: 'Salt-free Breakfast', status: 'Completed' },
        { id: 3, type: 'Therapy', staff: 'Raju', patient: 'Rahul Menon', time: '10:00', task: 'Shirodhara', status: 'Pending' },
    ],
    inquiries: [
        { id: 201, name: 'Sarah Connor', contact: '+91 9988776655', from: '2026-01-25', to: '2026-01-30', type: 'Premium', status: 'Pending', symptoms: 'Severe back pain' },
        { id: 202, name: 'Amit Patel', contact: '+91 8877665544', from: '2026-02-10', to: '2026-02-24', type: 'Standard', status: 'In-Review', symptoms: 'Detox requirement' }
    ],
    users: [
        { id: 1, name: 'Dr. A. Nair', email: 'doctor@sreedhari.com', password: 'doctor007', role: 'Doctor', dept: 'Consultation', avatar: 'DR' },
        { id: 2, name: 'Sreejith Manager', email: 'manager@sreedhari.com', password: 'admin', role: 'Manager', dept: 'Administration', avatar: 'SR' },
        { id: 3, name: 'General Staff', email: 'staff@sreedhari.com', password: '123456', role: 'Staff', dept: 'Operations', avatar: 'GS' },
        { id: 999, name: 'Sreejith (Admin)', email: 'sreejithsdev@gmail.com', password: '123456789', role: 'Manager', dept: 'Administration', avatar: 'SA' }
    ],
    notifications: [
        { id: 1, text: 'New booking inquiry from Sarah Connor', time: '10 mins ago', read: false },
        { id: 2, text: 'Cottage 3 cleaning completed', time: '1 hour ago', read: false },
        { id: 3, text: 'Dr. A. Nair updated patient record', time: '2 hours ago', read: true },
        { id: 4, text: 'Inventory low: Massage Oil', time: 'Yesterday', read: true },
        { id: 5, text: 'Weekly staff meeting scheduled', time: 'Yesterday', read: true }
    ]
};

class Store {
    constructor() {
        this.listeners = [];
        const loaded = this.loadState();
        // Merge loaded state with defaults to ensure structure exists
        this.state = { ...MOCK_DATA, ...loaded };

        // Ensure sub-objects exist
        if (!this.state.cottages) this.state.cottages = MOCK_DATA.cottages;
        if (!this.state.patients) this.state.patients = MOCK_DATA.patients;
        if (!this.state.bookings) this.state.bookings = MOCK_DATA.bookings;
        if (!this.state.startSchedules) this.state.startSchedules = MOCK_DATA.startSchedules;
        if (!this.state.inquiries) this.state.inquiries = MOCK_DATA.inquiries;
        if (!this.state.inquiries) this.state.inquiries = MOCK_DATA.inquiries;
        if (!this.state.users) this.state.users = MOCK_DATA.users;
        if (!this.state.notifications) this.state.notifications = MOCK_DATA.notifications;

        // Ensure users is an array (safety check against bad local storage)
        if (!Array.isArray(this.state.users)) this.state.users = MOCK_DATA.users;

        // Sync all MOCK_DATA users (admin, sajeev, etc) into state if missing
        // Sync all MOCK_DATA users (admin, sajeev, etc) into state
        MOCK_DATA.users.forEach(mockUser => {
            const existing = this.state.users.find(u => u.email === mockUser.email);
            if (!existing) {
                this.state.users.push(mockUser);
            } else {
                // FORCE UPDATE details from code (Name, Role, etc)
                // This fixes issues where 'Therapist John' persists in storage
                Object.assign(existing, mockUser);
            }
        });

        // Ensure notifications exist
        if (!this.state.notifications) this.state.notifications = MOCK_DATA.notifications;

        // Add welcome notification for Sajeev if new
        const sajeev = this.state.users.find(u => u.email === 'sajeev@sreedhari.com');
        if (sajeev && (!this.state.notifications || !this.state.notifications.some(n => n.userId === sajeev.id))) {
            // ensure notifs are init
            if (!this.state.notifications) this.state.notifications = [];
            this.state.notifications.push({
                id: Date.now(),
                userId: sajeev.id,
                text: 'Welcome to Sreedhari! Check your tasks.',
                read: false,
                time: 'Just now'
            });
        }

        // Fix Legacy CurrentUser
        if (this.state.currentUser) {
            const freshUser = this.state.users.find(u => u.id === this.state.currentUser.id);
            if (freshUser) {
                // Update name/email/role if changed in DB but keep session active
                this.state.currentUser = freshUser;
            }
        }

        this.saveState();
    }

    loadState() {
        try {
            const saved = localStorage.getItem('sreedhari_state');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error('State load error', e);
            return null;
        }
    }

    saveState() {
        localStorage.setItem('sreedhari_state', JSON.stringify(this.state));
        this.notify();
    }

    // Role Management
    getCurrentUser() { return this.state.currentUser; }

    setUserRole(role) {
        const users = {
            'Doctor': 'Dr. A. Nair',
            'Manager': 'Sarah Manager',
            'Staff': 'Therapist John'
        };
        this.state.currentUser = { name: users[role], role: role };
        this.saveState();
        // Force reload to apply UI changes
        window.location.reload();
    }

    // --- Auth & Users ---
    getUsers() { return this.state.users || []; }

    login(email, password) {
        const user = this.state.users.find(u => u.email === email && u.password === password);

        if (user) {
            if (user.status === 'Pending') {
                return { success: false, error: 'PENDING_REGISTRATION', user: user };
            }
            this.state.currentUser = user;
            this.saveState();
            return { success: true };
        }
        return { success: false, error: 'INVALID_CREDENTIALS' };
    }

    logout() {
        this.state.currentUser = null;
        this.saveState();
        window.location.reload();
    }

    // Called when Manager adds a new staff member
    registerUser(details) {
        const tempPassword = Math.random().toString(36).slice(-8);
        const newUser = {
            id: Date.now(),
            name: details.name,
            email: details.email,
            role: details.role,
            dept: details.dept,
            password: tempPassword,
            status: 'Pending', // Force password change on first login
            avatar: details.name.substring(0, 2).toUpperCase()
        };

        if (!this.state.users) this.state.users = [];
        this.state.users.push(newUser);

        // Add to staff list display as well if it's not there
        this.addStaff({
            name: details.name,
            dept: details.dept,
            role: details.role,
            email: details.email
        });

        this.saveState();
        return tempPassword;
    }

    completeRegistration(email, newPassword) {
        const user = this.state.users.find(u => u.email === email);
        if (user) {
            user.password = newPassword;
            user.status = 'Active';
            this.state.currentUser = user; // Auto login
            this.saveState();
            return true;
        }
        return false;
    }

    resetUserPassword(email, newPassword) {
        const user = this.state.users.find(u => u.email === email);
        if (user) {
            user.password = newPassword;
            // If they were pending, they are now active too
            if (user.status === 'Pending') user.status = 'Active';
            this.saveState();
            return true;
        }
        return false;
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify() {
        this.listeners.forEach(l => l(this.state));
    }

    // Actions
    // Actions
    getCottages() { return this.state.cottages; }
    getPatients() { return this.state.patients; }

    checkAvailability(start, end, typePref) {
        const startDate = new Date(start);
        const endDate = new Date(end);

        // precise filtering
        const candidates = this.state.cottages.filter(c => {
            if (typePref !== 'Any' && !c.type.includes(typePref)) return false;
            return true;
        });

        // Find one that doesn't have overlapping bookings
        const availableCottage = candidates.find(cottage => {
            const hasOverlap = this.state.bookings.some(booking => {
                if (booking.cottage !== cottage.id) return false;

                const bStart = new Date(booking.from);
                const bEnd = new Date(booking.to);

                return (startDate < bEnd && endDate > bStart); // Overlap logic
            });
            return !hasOverlap;
        });

        return availableCottage || null;
    }

    // Schedule Conflict Logic
    checkScheduleConflict(staff, time) {
        if (!this.state.startSchedules) return false;

        // Simple 1-hour duration assumption for conflict check
        // If existing task is at 10:00, it blocks 10:00 - 11:00
        // New task at 10:30 would conflict.

        const newTimeVal = parseInt(time.replace(':', ''));

        return this.state.startSchedules.some(sched => {
            if (sched.staff !== staff) return false;
            if (sched.status === 'Cancelled') return false;

            const existTimeVal = parseInt(sched.time.replace(':', ''));

            // unexpected naive check: within 60 mins diff
            const diff = Math.abs(newTimeVal - existTimeVal);
            // 800 vs 900 is 100 diff (1 hour)

            // Check if diff is less than 1 hour (handling HHMM format roughly)
            // Ideally convert to minutes, but for this demo this suffices for 8:00 vs 8:30 conflicts
            return diff < 60;
        });
    }

    // Completion Tracking
    completeScheduleTask(id, byWho, note) {
        if (!this.state.startSchedules) return;
        const task = this.state.startSchedules.find(s => s.id === id);
        if (task) {
            task.status = 'Completed';
            task.completedBy = byWho;
            task.completedAt = new Date().toLocaleTimeString();
            task.completionNote = note || '';
            this.saveState();

            // Notify Managers
            this.state.users.filter(u => u.role === 'Manager' || u.role === 'Doctor').forEach(m => {
                if (m.name !== byWho) {
                    const noteText = note ? ` Note: "${note}"` : '';
                    this.addNotification(m.id, `Task "${task.task}" completed by ${byWho}.${noteText}`);
                }
            });
        }
    }

    acceptScheduleTask(id, byWho) {
        const task = this.state.startSchedules.find(s => s.id === id);
        if (task && task.status === 'Pending') {
            task.status = 'Accepted';
            task.acceptedBy = byWho;
            task.acceptedAt = new Date().toLocaleTimeString();
            this.saveState();

            // Notify Manager? Optional, but good feedback.
            this.state.users.filter(u => u.role === 'Manager' || u.role === 'Doctor').forEach(m => {
                this.addNotification(m.id, `Task "${task.task}" accepted by ${byWho}`);
            });
        }
    }

    addBooking(booking) {
        // If booking starts today, update cottage status
        const today = new Date().toISOString().split('T')[0];
        if (booking.from === today) {
            const cottageIndex = this.state.cottages.findIndex(c => c.id === booking.cottage);
            if (cottageIndex >= 0) {
                this.state.cottages[cottageIndex].status = 'Occupied';
                this.state.cottages[cottageIndex].currentGuest = booking.guest;
                this.state.cottages[cottageIndex].nextBooking = booking.to;
            }
        }

        this.state.bookings.push({ ...booking, id: Date.now(), status: 'Confirmed' });
        this.saveState();
    }

    addPatient(patient) {
        this.state.patients.push({
            ...patient,
            id: this.state.patients.length + 1,
            history: [],
            treatments: [],
            medications: []
        });
        this.saveState();
    }

    getPatient(id) {
        return this.state.patients.find(p => p.id == id);
    }

    updatePatientHistory(id, entry) {
        const p = this.getPatient(id);
        if (p) {
            p.history.unshift({ ...entry, date: new Date().toISOString().split('T')[0] });
            this.saveState();
        }
    }

    addPatientTreatment(id, treatment) {
        const p = this.getPatient(id);
        if (p) {
            p.treatments.unshift(treatment);
            this.saveState();
        }
    }

    addPatientMedication(id, med) {
        const p = this.getPatient(id);
        if (p) {
            p.medications.push(med);
            this.saveState();
        }
    }

    getStaffSchedules() { return this.state.startSchedules || []; }

    addStaffSchedule(schedule) {
        if (!this.state.startSchedules) this.state.startSchedules = [];
        this.state.startSchedules.push({ ...schedule, id: Date.now(), comments: [] });
        this.saveState();

        let staffUser = this.findUserByName(schedule.staff);
        // Fallback: If assigned staff is not a login user (e.g. Annie), notify the General Staff account
        if (!staffUser) {
            staffUser = this.state.users.find(u => u.email === 'staff@sreedhari.com');
        }

        if (staffUser) {
            this.addNotification(staffUser.id, `New Task Assigned to ${schedule.staff}: ${schedule.task}`);
        }

        // Notify other Managers/Doctors
        const currentUser = this.state.currentUser;
        if (currentUser) {
            this.state.users.filter(u => (u.role === 'Manager' || u.role === 'Doctor') && u.id !== currentUser.id)
                .forEach(m => {
                    this.addNotification(m.id, `${currentUser.name} assigned new task to ${schedule.staff}: ${schedule.task}`);
                });
        }
    }

    updateStaffSchedule(id, updates) {
        const schedule = this.state.startSchedules.find(s => s.id === id);
        if (schedule) {
            Object.assign(schedule, updates);
            this.saveState();

            // Notify General Staff
            const staffUser = this.state.users.find(u => u.email === 'staff@sreedhari.com');
            if (staffUser) {
                this.addNotification(staffUser.id, `Task Updated: "${schedule.task}" assigned to ${schedule.staff}`);
            }

            // Notify other Managers/Doctors
            const currentUser = this.state.currentUser;
            if (currentUser) {
                this.state.users.filter(u => (u.role === 'Manager' || u.role === 'Doctor') && u.id !== currentUser.id)
                    .forEach(m => {
                        this.addNotification(m.id, `${currentUser.name} updated task for ${schedule.staff}: ${schedule.task}`);
                    });
            }
        }
    }

    // --- Staff Management ---
    getStaff() {
        return this.state.staffList || [
            { id: 1, name: 'Annie', dept: 'Treatment', role: 'Sr. Therapist' },
            { id: 2, name: 'Jaya', dept: 'Treatment', role: 'Therapist Asst' },
            { id: 3, name: 'Raju', dept: 'Treatment', role: 'Male Therapist' },
            { id: 4, name: 'Santamma', dept: 'Kitchen', role: 'Chief Cook' },
            { id: 5, name: 'Chandrika', dept: 'Kitchen', role: 'Cooking Asst 1' },
            { id: 6, name: 'Omana', dept: 'Kitchen', role: 'Cooking Asst 2' },
            { id: 7, name: 'Sajini', dept: 'Housekeeping', role: 'Laundry & HK' },
            { id: 8, name: 'Babu', dept: 'Pharmacy', role: 'Pharmacist' },
            { id: 9, name: 'Amal', dept: 'Logistics', role: 'Driver' }
        ];
    }

    addStaff(staffMember) {
        if (!this.state.staffList) this.state.staffList = this.getStaff();
        this.state.staffList.push({ ...staffMember, id: Date.now() });
        this.saveState();
    }

    removeStaff(id) {
        if (!this.state.staffList) this.state.staffList = this.getStaff();
        this.state.staffList = this.state.staffList.filter(s => s.id !== id);
        this.saveState();
    }

    // --- Care & Diet ---
    updatePatientDiet(id, dietDetails) {
        const p = this.getPatient(id);
        if (p) {
            p.diet = dietDetails;
            this.saveState();
        }
    }

    // --- Discharge & Reports ---
    getTreatmentTemplates() {
        return [
            {
                id: 't1', name: 'Rejuvenation (Rasayana)',
                overview: 'A complete body and mind revitalization program tailored to improve vitality and immunity.',
                lifestyle: 'Wake up at 6 AM. Practice light fabric yoga.',
                meds: 'Chavana prasham: 1 tsp morning empty stomach.'
            },
            {
                id: 't2', name: 'Detox (Panchakarma)',
                overview: 'Intensive cleansing aimed at expelling toxins via Vamana and Virechana.',
                lifestyle: 'Strictly avoid day sleep. Consume only warm water.',
                meds: 'Triphala Churnam: 5g at bedtime.'
            },
            {
                id: 't3', name: 'Arthritis Care (Vatavyadhi)',
                overview: 'Focused on reducing inflammation and pain through oil massages (Abhyangam) and Kizhi.',
                lifestyle: 'Avoid cold exposure. Use warm water for bathing.',
                meds: 'Dhanwantharam Kashayam: 15ml twice daily before food.'
            }
        ];
    }

    updateDischargeSummary(id, summary) {
        const p = this.getPatient(id);
        if (p) {
            p.discharge = { ...p.discharge, ...summary }; // overview, lifestyle, meds
            this.saveState();
        }
    }

    getInquiries() { return this.state.inquiries || []; }

    getInquiry(id) { return this.state.inquiries.find(i => i.id == id); }

    addInquiry(inquiry) {
        if (!this.state.inquiries) this.state.inquiries = [];
        this.state.inquiries.unshift({ ...inquiry, id: Date.now(), status: 'Pending' });
        this.saveState();
    }

    // Dynamic Availability for Calendar
    getCottageStatuses(dateStr) {
        const checkDate = new Date(dateStr);
        return this.state.cottages.map(c => {
            // Find booking for this cottage on this date
            const booking = this.state.bookings.find(b => {
                const start = new Date(b.from);
                const end = new Date(b.to);
                return (b.cottage === c.id && checkDate >= start && checkDate <= end);
            });

            if (booking) {
                return { ...c, status: 'Occupied', currentGuest: booking.guest, bookingId: booking.id, until: booking.to };
            }
            return { ...c, status: 'Available', currentGuest: null };
        });
    }

    // New Booking Flow Helpers
    setBookingContext(ctx) {
        this.bookingContext = ctx;
    }

    getBookingContext() {
        const ctx = this.bookingContext;
        this.bookingContext = null; // consume it
        return ctx;
    }


    // Notifications
    getNotifications() {
        const uid = this.state.currentUser ? this.state.currentUser.id : null;
        return (this.state.notifications || []).filter(n => !n.userId || n.userId === uid);
    }

    markNotificationRead(id) {
        const n = this.state.notifications.find(i => i.id === id);
        if (n && !n.read) {
            n.read = true;
            this.saveState();
        }
    }

    addNotification(targetUserId, text) {
        if (!this.state.notifications) this.state.notifications = [];
        this.state.notifications.unshift({
            id: Date.now() + Math.random(),
            userId: targetUserId,
            text: text,
            read: false,
            time: 'Just now'
        });
        this.saveState();
        this.notify();
    }

    findUserByName(name) {
        if (!name) return null;
        const n = name.toLowerCase();
        return this.state.users.find(u => u.name.toLowerCase().includes(n) || n.includes(u.name.toLowerCase()));
    }

    addTaskComment(taskId, comment, byUser) {
        const task = this.state.startSchedules.find(s => s.id === taskId);
        if (task) {
            if (!task.comments) task.comments = [];
            task.comments.push({
                text: comment,
                by: byUser.name,
                time: new Date().toLocaleTimeString()
            });
            this.saveState();

            if (byUser.role === 'Staff') {
                this.state.users.filter(u => u.role === 'Manager' || u.role === 'Doctor').forEach(m => {
                    if (m.id !== byUser.id) this.addNotification(m.id, `New comment on "${task.task}" by ${byUser.name}`);
                });
            } else {
                const staffUser = this.findUserByName(task.staff);
                if (staffUser && staffUser.id !== byUser.id) {
                    this.addNotification(staffUser.id, `New comment on "${task.task}" by ${byUser.name}`);
                }
            }
        }
    }

    // Settings & Profile
    updateUserAvatar(base64Data) {
        if (this.state.currentUser) {
            this.state.currentUser.avatar = base64Data;
            // Sync with users list
            const idx = this.state.users.findIndex(u => u.id === this.state.currentUser.id);
            if (idx !== -1) {
                this.state.users[idx].avatar = base64Data;
            }
            this.saveState();
            window.location.reload(); // Refresh to update all avatar instances
        }
    }

    updateUserSettings(settings) {
        if (this.state.currentUser) {
            this.state.currentUser = { ...this.state.currentUser, ...settings };
            // Sync with users list
            const idx = this.state.users.findIndex(u => u.id === this.state.currentUser.id);
            if (idx !== -1) {
                this.state.users[idx] = { ...this.state.users[idx], ...settings };
            }
            this.saveState();
        }
    }
}

export const store = new Store();
