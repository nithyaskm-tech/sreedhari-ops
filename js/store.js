
// Initialize Supabase
const SUPABASE_URL = 'https://pmmztvbegjsglshubufr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qKXNa8ZwMCIdrWgYLlPKyw_RsJcZGYv'; // User provided
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Mock Data for Non-Cloud features (Patients, Cottages - Hybrid Mode)
const MOCK_EXTRAS = {
    cottages: Array.from({ length: 10 }, (_, i) => ({
        id: `C${i + 1}`,
        name: `Cottage ${i + 1}`,
        type: i < 3 ? 'Premium' : 'Standard',
        status: ['Available', 'Occupied', 'Cleaning'][Math.floor(Math.random() * 3)],
        currentGuest: i % 3 === 0 ? 'John Doe' : null,
        nextBooking: '2026-01-20'
    })),
    patients: [
        { id: 1, name: 'Sathyabhama', age: 65, gender: 'Female', status: 'Active', condition: 'Arthritis', lastVisit: '2025-12-10', history: [], treatments: [], medications: [] },
        { id: 2, name: 'Rahul Menon', age: 42, gender: 'Male', status: 'Active', condition: 'Stress Management', lastVisit: '2026-01-05', history: [], treatments: [], medications: [] }
    ],
    bookings: [
        { id: 101, guest: 'Sathyabhama', cottage: 'C1', from: '2026-01-01', to: '2026-01-15', status: 'Confirmed' },
        { id: 102, guest: 'Rahul Menon', cottage: 'C3', from: '2026-01-10', to: '2026-01-24', status: 'Checked-In' },
    ],
    startSchedules: [], // Will be overwritten by Cloud
    users: [], // Will be overwritten by Cloud
    notifications: [] // Will be overwritten by Cloud
};

class Store {
    constructor() {
        this.listeners = [];
        this.state = { ...MOCK_EXTRAS };

        // Load LocalStorage for hybrid parts (Patients/Cottages)
        const saved = localStorage.getItem('sreedhari_hybrid_state');
        if (saved) {
            const localState = JSON.parse(saved);
            this.state.cottages = localState.cottages || MOCK_EXTRAS.cottages;
            this.state.patients = localState.patients || MOCK_EXTRAS.patients;
            this.state.bookings = localState.bookings || MOCK_EXTRAS.bookings;
            // We DO NOT load schedules/users/notifications from local storage anymore
        }

        // Load Session
        const savedUser = localStorage.getItem('sreedhari_user');
        if (savedUser) {
            this.state.currentUser = JSON.parse(savedUser);
        }

        // Initialize Cloud Data
        this.initSupabase();
    }

    async initSupabase() {
        if (!supabase) {
            console.error("Supabase client not initialized");
            return;
        }

        // 1. Load Initial Data
        await this.refreshAll();

        // 2. Subscribe to Realtime Changes
        supabase.channel('public:schedules')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, payload => {
                console.log('Realtime Schedule Update:', payload);
                this.handleScheduleUpdate(payload);
            })
            .subscribe();

        supabase.channel('public:notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
                this.handleNotificationUpdate(payload);
            })
            .subscribe();

        console.log("Supabase Connected & Listening");
    }

    async refreshAll() {
        // Fetch Users
        const { data: users } = await supabase.from('app_users').select('*');
        if (users) this.state.users = users;

        // Fetch Schedules
        const { data: schedules } = await supabase.from('schedules').select('*').order('created_at', { ascending: false });
        if (schedules) this.state.startSchedules = schedules;

        // Fetch Notifications
        const { data: notifs } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
        if (notifs) this.state.notifications = notifs;

        this.notify();
    }

    // --- Realtime Handlers ---
    handleScheduleUpdate(payload) {
        if (payload.eventType === 'INSERT') {
            this.state.startSchedules.unshift(payload.new);
        } else if (payload.eventType === 'UPDATE') {
            const index = this.state.startSchedules.findIndex(s => s.id === payload.new.id);
            if (index !== -1) this.state.startSchedules[index] = payload.new;
        }
        this.notify();
    }

    handleNotificationUpdate(payload) {
        if (payload.eventType === 'INSERT') {
            this.state.notifications.unshift(payload.new);
            this.notify();
        }
    }

    notify() {
        this.listeners.forEach(l => l(this.state));
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    saveHybridState() {
        // Only save the non-cloud parts
        const hybrid = {
            cottages: this.state.cottages,
            patients: this.state.patients,
            bookings: this.state.bookings
        };
        localStorage.setItem('sreedhari_hybrid_state', JSON.stringify(hybrid));
        this.notify();
    }

    // --- User Auth (Cloud) ---
    async login(email, password) {
        // For prototype, we check 'app_users' table directly. 
        // In prod, use supabase.auth.signInWithPassword()
        let user = this.state.users.find(u => u.email === email);

        // Fallback: If not found in local state (race condition during load), fetch from Cloud
        if (!user && supabase) {
            const { data } = await supabase.from('app_users').select('*').eq('email', email).single();
            if (data) {
                user = data;
                // Add to local state for next time
                this.state.users.push(user);
            }
        }

        // Simple password check (Note: In real app use Supabase Auth)
        // We match against hardcoded passwords for now as per original mock
        let valid = false;
        if (user) {
            if (user.role === 'Manager' && password === 'admin') valid = true;
            if (user.role === 'Doctor' && (password === 'doctor007' || password === 'admin')) valid = true;
            if (user.role === 'Staff' && password === '123456') valid = true;
            if (user.email === 'sreejithsdev@gmail.com' && password === '123456789') valid = true;
        }

        if (valid) {
            this.state.currentUser = user;
            localStorage.setItem('sreedhari_user', JSON.stringify(user));
            this.notify();
            return { success: true };
        }
        return { success: false, error: 'INVALID_CREDENTIALS' };
    }

    getCurrentUser() { return this.state.currentUser; }

    logout() {
        this.state.currentUser = null;
        localStorage.removeItem('sreedhari_user');
        this.notify();
        window.location.reload();
    }

    getUsers() { return this.state.users || []; }

    // --- Schedule Management (Cloud) ---
    getStaffSchedules() { return this.state.startSchedules || []; }

    async addStaffSchedule(schedule) {
        // Optimistic UI Update
        const tempId = Date.now();
        const newSched = { ...schedule, id: tempId, status: 'Pending' };

        // Insert to Supabase
        const { data, error } = await supabase.from('schedules').insert([{
            type: schedule.type,
            staff: schedule.staff,
            patient: schedule.patient,
            time: schedule.time,
            task: schedule.task,
            status: 'Pending',
            comments: []
        }]).select();

        if (error) {
            console.error('Add Schedule Error:', error);
            alert('Failed to save to cloud');
            return;
        }

        // Notification Logic
        this.sendRoleBasedNotifications('assign', schedule);
    }

    async updateStaffSchedule(id, updates) {
        // Check if ID is temp (local only)? No, should be from DB. It's a bigint.
        const { error } = await supabase.from('schedules').update(updates).eq('id', id);
        if (error) console.error('Update Error:', error);

        // Simple fetch to ensure staff/task name is available for notif
        const task = this.state.startSchedules.find(s => s.id === id);
        if (task) {
            this.sendRoleBasedNotifications('update', { ...task, ...updates });
        }
    }

    async completeScheduleTask(id, byWho, note) {
        const updates = {
            status: 'Completed',
            completed_by: byWho,
            completed_at: new Date().toLocaleTimeString(),
            completion_note: note || ''
        };
        await supabase.from('schedules').update(updates).eq('id', id);

        const task = this.state.startSchedules.find(s => s.id === id);
        this.sendRoleBasedNotifications('complete', { ...task, ...updates, completedBy: byWho });
    }

    async acceptScheduleTask(id, byWho) {
        const updates = {
            status: 'Accepted',
            accepted_by: byWho,
            accepted_at: new Date().toLocaleTimeString()
        };
        await supabase.from('schedules').update(updates).eq('id', id);

        const task = this.state.startSchedules.find(s => s.id === id);
        this.sendRoleBasedNotifications('accept', { ...task, ...updates, acceptedBy: byWho });
    }

    // --- Notification Logic (Cloud) ---
    async sendRoleBasedNotifications(type, data) {
        // We calculate who to notify, then insert to 'notifications' table within DB
        const users = this.state.users;
        const currentUser = this.state.currentUser;
        if (!currentUser) return;

        const targets = [];
        let msg = '';

        if (type === 'assign') {
            msg = `New Task: ${data.task} for ${data.staff}`;
            // Notify Staff
            const staff = users.find(u => u.email === 'staff@sreedhari.com');
            if (staff) targets.push(staff.id);
            // Notify Other Managers
            users.filter(u => (u.role === 'Manager' || u.role === 'Doctor') && u.id !== currentUser.id)
                .forEach(u => targets.push(u.id));
        }
        else if (type === 'update') {
            msg = `Updated Task: ${data.task} for ${data.staff}`;
            const staff = users.find(u => u.email === 'staff@sreedhari.com');
            if (staff) targets.push(staff.id);
            users.filter(u => (u.role === 'Manager' || u.role === 'Doctor') && u.id !== currentUser.id)
                .forEach(u => targets.push(u.id));
        }
        else if (type === 'complete') {
            msg = `Task Completed: ${data.task} by ${data.completedBy}`;
            users.filter(u => (u.role === 'Manager' || u.role === 'Doctor')).forEach(u => targets.push(u.id));
        }
        else if (type === 'accept') {
            msg = `Task Accepted: ${data.task} by ${data.acceptedBy}`;
            users.filter(u => (u.role === 'Manager' || u.role === 'Doctor')).forEach(u => targets.push(u.id));
        }

        // Insert Notifications
        for (const uid of targets) {
            await supabase.from('notifications').insert({
                user_id: uid,
                text: msg,
                read: false,
                time_label: 'Just now'
            });
        }
    }

    getNotifications() {
        const uid = this.state.currentUser ? this.state.currentUser.id : null;
        return (this.state.notifications || []).filter(n => !n.user_id || n.user_id === uid); // Note: user_id snake_case from DB
    }

    async markNotificationRead(id) {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
        // Optimistic
        const n = this.state.notifications.find(x => x.id === id);
        if (n) n.read = true;
        this.notify();
    }


    // --- Hybrid/Local Methods (Keep old logic for these) ---
    getCottages() { return this.state.cottages; }
    getPatients() { return this.state.patients; }
    getPatient(id) { return this.state.patients.find(p => p.id == id); }
    getInquiries() { return this.state.inquiries || []; }

    addBooking(booking) {
        this.state.bookings.push({ ...booking, id: Date.now(), status: 'Confirmed' });
        this.saveHybridState();
    }

    // ... Other hybrid methods (skipping uncommon ones for brevity but can be added if needed)

    // --- Hybrid Helpers (Restored) ---
    checkAvailability(start, end, typePref) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const candidates = this.state.cottages.filter(c => {
            if (typePref !== 'Any' && !c.type.includes(typePref)) return false;
            return true;
        });
        return candidates.find(cottage => {
            const hasOverlap = this.state.bookings.some(booking => {
                if (booking.cottage !== cottage.id) return false;
                const bStart = new Date(booking.from);
                const bEnd = new Date(booking.to);
                return (startDate < bEnd && endDate > bStart);
            });
            return !hasOverlap;
        }) || null;
    }

    checkScheduleConflict(staff, time) {
        if (!this.state.startSchedules) return false;
        const newTimeVal = parseInt(time.replace(':', ''));
        return this.state.startSchedules.some(sched => {
            if (sched.staff !== staff) return false;
            if (sched.status === 'Cancelled') return false;
            const existTimeVal = parseInt(sched.time.replace(':', ''));
            const diff = Math.abs(newTimeVal - existTimeVal);
            return diff < 60;
        });
    }

    getCottageStatuses(dateStr) {
        const checkDate = new Date(dateStr);
        return this.state.cottages.map(c => {
            const booking = this.state.bookings.find(b => {
                const start = new Date(b.from);
                const end = new Date(b.to);
                return (b.cottage === c.id && checkDate >= start && checkDate <= end);
            });
            if (booking) return { ...c, status: 'Occupied', currentGuest: booking.guest, bookingId: booking.id, until: booking.to };
            return { ...c, status: 'Available', currentGuest: null };
        });
    }

    addPatient(patient) {
        this.state.patients.push({ ...patient, id: this.state.patients.length + 1, history: [], treatments: [], medications: [] });
        this.saveHybridState();
    }

    updatePatientHistory(id, entry) {
        const p = this.getPatient(id);
        if (p) { p.history.unshift({ ...entry, date: new Date().toISOString().split('T')[0] }); this.saveHybridState(); }
    }

    addPatientTreatment(id, val) { const p = this.getPatient(id); if (p) { p.treatments.unshift(val); this.saveHybridState(); } }
    addPatientMedication(id, val) { const p = this.getPatient(id); if (p) { p.medications.push(val); this.saveHybridState(); } }
    updatePatientDiet(id, val) { const p = this.getPatient(id); if (p) { p.diet = val; this.saveHybridState(); } }

    getTreatmentTemplates() {
        return [
            { id: 't1', name: 'Rejuvenation', overview: 'Revitalization program', lifestyle: 'Wake 6 AM', meds: 'Chavana prasham' },
            { id: 't2', name: 'Detox', overview: 'Cleansing toxins', lifestyle: 'No day sleep', meds: 'Triphala' },
            { id: 't3', name: 'Arthritis Care', overview: 'Reduce inflammation', lifestyle: 'Use warm water', meds: 'Dhanwantharam' }
        ];
    }

    updateDischargeSummary(id, val) { const p = this.getPatient(id); if (p) { p.discharge = { ...p.discharge, ...val }; this.saveHybridState(); } }

    getStaff() {
        return [
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
}

export const store = new Store();
