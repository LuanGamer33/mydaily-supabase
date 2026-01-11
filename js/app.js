
import { AuthManager } from './modules/AuthManager.js';
import { UIManager } from './modules/UIManager.js';
import { NotesManager } from './modules/NotesManager.js';
import { HabitsManager } from './modules/HabitsManager.js';
import { EventsManager } from './modules/EventsManager.js';
import { ActivitiesManager } from './modules/ActivitiesManager.js';
import { SettingsManager } from './modules/SettingsManager.js';
import { getDailyMotivation } from './utils.js';
import { getUser } from './supabase.js';

class App {
    constructor() {
        this.auth = new AuthManager();
        this.ui = new UIManager();
        this.notes = new NotesManager(this.ui);
        this.habits = new HabitsManager(this.ui);
        this.events = new EventsManager(this.ui);
        this.activities = new ActivitiesManager(this.ui);
        this.settings = new SettingsManager(this.ui);
    }

    async init() {
        console.log('App Initializing...');
        
        // Setup Auth Listeners immediately (for login page)
        this.setupAuthUiListeners();
        this.configureDateLimits();

        // ESPERAR a que la inicialización de auth termine
        await this.auth.init();
        
        if (this.auth.isAuthenticated()) {
            this.ui.showToast('Sesión detectada', 'success');
            
            const path = window.location.pathname;
            if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
                // Si estamos en login y hay sesión -> Dashboard
                 window.location.href = 'dashboard.html';
            } else {
                 // Si estamos en interna -> Cargar la página actual CORRECTAMENTE con usuario
                 // NO cargar dashboardData ciegamente, renderCurrentPage lo manejará
                 await this.renderCurrentPage();
            }
        } else {
            // Logic for public pages or redirect done by AuthManager
        }

        this.setupGlobalListeners();
        // renderCurrentPage check removed from here to avoid double render or render before auth
        // Only render if we didn't redirect
    }

    setupGlobalListeners() {
        this.settings.setupListeners();
        
        // Logout Button
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.auth.logout();
            });
        }
    }

    setupAuthUiListeners() {
        // Login Form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = loginForm.Correo.value;
                const password = loginForm.pass.value;
                
                const { error } = await this.auth.login(email, password);
                if (error) {
                    this.ui.showToast(error, 'error');
                } else {
                    this.ui.showToast('¡Bienvenido!', 'success');
                    // AuthManager handles redirect on state change
                }
            });
        }

        // Register Form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(registerForm);
                const userData = {
                    email: formData.get('Correo'),
                    password: formData.get('pass'),
                    confirmPassword: formData.get('conf_pass'), // Changed key for internal consistency
                    nombre: formData.get('nombre'),
                    apellido: formData.get('apellido'),
                    username: formData.get('username'),
                    fechaNacimiento: formData.get('fn'),
                    genero: formData.get('genero')
                };

                const validationError = this.validateRegistrationData(userData);
                if (validationError) {
                    this.ui.showToast(validationError, 'error');
                    return;
                }

                const { error, session } = await this.auth.register(userData);
                if (error) {
                    this.ui.showToast(error, 'error');
                } else {
                    if (session) {
                         this.ui.showToast('¡Registro exitoso! Iniciando...', 'success');
                         // AuthManager observer will redirect
                    } else {
                        // Fallback only if Supabase still requires functionality
                        this.ui.showToast('Registro exitoso.', 'success');
                    }
                }
            });
        }

        // Toggle Container (Login/Register Switch)
        const container = document.querySelector('.container');
        const registerBtn = document.querySelector('.register-btn');
        const loginBtn = document.querySelector('.login-btn');
        const registerLink = document.querySelector('.register-link');
        const loginLink = document.querySelector('.login-link');

        if (container && registerBtn && loginBtn) {
            registerBtn.addEventListener('click', () => {
                container.classList.add('active');
            });
            loginBtn.addEventListener('click', () => {
                container.classList.remove('active');
            });
        }
        
        // Mobile links
        if (registerLink) {
            registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                container.classList.add('active');
            });
        }
        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                container.classList.remove('active');
            });
        }

        // Social Logins
        // Social Logins
        // Use class selectors as onclicks were removed from HTML
        const googleLinks = document.querySelectorAll('.social-login-google');
        googleLinks.forEach(link => {
            // Remove old listeners to be safe, though cloning/replacing is better if we worry about duplicates. 
            // Simple addEventListener is fine here as this runs once.
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.auth.loginWithProvider('google');
            });
        });

        const githubLinks = document.querySelectorAll('.social-login-github');
        githubLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.auth.loginWithProvider('github');
            });
        });
    }

    configureDateLimits() {
        const dateInput = document.querySelector('input[name="fn"]');
        if (dateInput) {
            const today = new Date();
            const maxDate = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());
            const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
            
            dateInput.max = maxDate.toISOString().split('T')[0];
            dateInput.min = minDate.toISOString().split('T')[0];
        }
    }

    validateRegistrationData(data) {
        const { email, password, confirmPassword, nombre, apellido, username, fechaNacimiento, genero } = data;
        
        if (!email || !password || !confirmPassword || !nombre || !apellido || !username || !fechaNacimiento || !genero) {
            return 'Por favor completa todos los campos';
        }
        
        // Simple email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return 'Por favor ingresa un correo electrónico válido';

        if (password !== confirmPassword) return 'Las contraseñas no coinciden';
        if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
        
        if (nombre.length < 2) return 'El nombre debe tener al menos 2 caracteres';
        if (apellido.length < 2) return 'El apellido debe tener al menos 2 caracteres';
        if (username.length < 3) return 'El nombre de usuario debe tener al menos 3 caracteres';

        const birthDate = new Date(fechaNacimiento);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 12) return 'Debes tener al menos 12 años para registrarte';
        if (age > 120) return 'Fecha de nacimiento no válida';

        return null;
    }

    async loadDashboardData() {
        // OPTIMIZACIÓN: Pasar el usuario ya autenticado para evitar llamadas repetitivas a getUser()
        const currentUser = this.auth.user; 
        if (!currentUser) return;

        // Load Profile first for Theme/Avatar
        await this.settings.loadUserProfile(currentUser);

        // Update Daily Motivation
        // Update Daily Motivation
        // Usar 'default' si no hay ID, para mostrar algo siempre
        const motivation = getDailyMotivation(currentUser ? currentUser.id : 'default');
        const motivationText = document.getElementById('motivation-message');
        const motivationTime = document.getElementById('motivation-time');
        
        if (motivationText) motivationText.textContent = motivation.text;
        if (motivationTime) motivationTime.textContent = `Actualizado: ${motivation.time}`;
    }

    async renderCurrentPage() {
        const path = window.location.pathname;
        const currentUser = this.auth.user;

        // CARGA GLOBAL DE PERFIL (Para sidebar y tema en todas las páginas)
        if (currentUser) {
            await this.settings.loadUserProfile(currentUser);
        }

        if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
            // Login page handled by AuthManager mostly, but we can clear things here
        } else if (path.includes('dashboard.html')) {
            await this.renderDashboard();
        } else if (path.includes('notes.html')) {
            await this.notes.loadNotes(currentUser);
        } else if (path.includes('habits.html')) {
            await this.habits.loadHabits(currentUser);
        } else if (path.includes('events.html')) {
            await this.events.loadEvents(currentUser);
        } else if (path.includes('activities.html')) {
            await this.activities.loadActivities(currentUser);
        } else if (path.includes('settings.html')) {
            // Re-run setup listeners ensuring elements exist
            this.settings.setupListeners();
            // Already loaded in loadDashboardData, but maybe refresh
        }
    }

    async renderDashboard() {
        const currentUser = this.auth.user;
        const [notes, habits, events, activities] = await Promise.all([
            this.notes.loadNotes(currentUser),
            this.habits.loadHabits(currentUser), // Pasar usuario
            this.events.loadEvents(currentUser),
            this.activities.loadActivities(currentUser)
        ]);

        this.renderDashboardStats(notes, habits, events, activities);
        this.renderDashboardPreviews(notes, habits, events, activities);
        this.generateCalendar(events, activities);
    }

    renderDashboardStats(notes, habits, events, activities) {
        const today = new Date().toDateString();
        
        // Notes
        const totalNotesEl = document.getElementById('total-notes-stat');
        if (totalNotesEl) totalNotesEl.textContent = notes.length;

        // Habits
        const totalHabitsEl = document.getElementById('total-habits-stat');
        if (totalHabitsEl) totalHabitsEl.textContent = habits.length;

        // Events
        const upcomingEvents = events.filter(e => new Date(e.fecha) >= new Date()).length;
        const totalEventsEl = document.getElementById('total-events-stat');
        if (totalEventsEl) totalEventsEl.textContent = upcomingEvents;

        // Activities
        const pendingActivities = activities.filter(a => !a.completada).length;
        const pendingActivitiesEl = document.getElementById('pending-activities-stat');
        if (pendingActivitiesEl) pendingActivitiesEl.textContent = pendingActivities;

        // Today specific
        const todayEvents = events.filter(e => new Date(e.fecha).toDateString() === today).length;
        const todayEventsEl = document.getElementById('today-events-stat');
        if (todayEventsEl) todayEventsEl.textContent = todayEvents;

        const todayActivities = activities.filter(a => new Date(a.fecha).toDateString() === today && !a.completada).length;
        const todayActivitiesEl = document.getElementById('today-activities-stat');
        if (todayActivitiesEl) todayActivitiesEl.textContent = todayActivities;
    }

    renderDashboardPreviews(notes, habits, events, activities) {
        // Helper to render distinct items
        const renderSection = (items, containerId, emptyMsg, renderItemFn) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = '';

            if (!items || items.length === 0) {
                container.innerHTML = `<div class="preview-item empty-state" style="justify-content:center; color: var(--text-light);">${emptyMsg}</div>`;
                return;
            }

            // Take top 3
            items.slice(0, 3).forEach(item => {
                const el = renderItemFn(item);
                container.appendChild(el);
            });
        };

        // Notes
        renderSection(notes, 'notes-carousel', 'Sin notas recientes', (note) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `
                <i class="fas fa-sticky-note" style="color: var(--accent-color)"></i>
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${note.nom}</span>
            `;
            div.onclick = () => window.location.href = 'notes.html';
            return div;
        });

        // Habits
        renderSection(habits, 'habits-carousel', 'Sin hábitos activos', (habit) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `
                <i class="fas fa-check-circle" style="color: ${habit.completado_hoy ? 'green' : 'var(--text-light)'}"></i>
                <span>${habit.nom}</span>
            `;
            div.onclick = () => window.location.href = 'habits.html';
            return div;
        });

        // Events
        // Filter upcoming - Ensure robust date comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today
        
        const upcomingEvents = (events || []).filter(e => {
            if (!e.fecha) return false;
            // Handle YYYY-MM-DD explicitly to prevent timezone shifts
            const [y, m, d] = e.fecha.split('-').map(Number);
            const eventDate = new Date(y, m - 1, d); // Month is 0-indexed
            return eventDate >= today;
        }).slice(0, 3);

        renderSection(upcomingEvents, 'events-carousel', 'Sin eventos próximos', (event) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            // Simple display date
            const [y, m, d] = event.fecha.split('-');
            const displayDate = `${d}/${m}`;
            
            div.innerHTML = `
                <i class="fas fa-calendar-day" style="color: var(--primary-color)"></i>
                <div style="display:flex; flex-direction:column; line-height:1.2; overflow:hidden;">
                    <span style="font-weight:bold;">${event.nom}</span>
                    <span style="font-size:0.75em; color:var(--text-light);">${displayDate}</span>
                </div>
            `;
            div.onclick = () => window.location.href = 'events.html';
            return div;
        });

        // Activities
        // Filter pending
        const pendingActivities = activities.filter(a => !a.completada).slice(0, 3);
        renderSection(pendingActivities, 'activities-carousel', 'Sin actividades pendientes', (activity) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `
                <i class="fas fa-tasks" style="color: ${activity.prioridad === 'high' ? 'red' : 'var(--accent-color)'}"></i>
                <span>${activity.titulo}</span>
            `;
            div.onclick = () => window.location.href = 'activities.html';
            return div;
        });
    }

    generateCalendar(events, activities) {
        const calendarBody = document.getElementById('calendar-body');
        const currentMonthEl = document.getElementById('current-month');
        if (!calendarBody || !currentMonthEl) return;
        
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const today = currentDate.getDate();

        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        currentMonthEl.textContent = `${monthNames[month]} ${year}`;
        calendarBody.innerHTML = '';
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarBody.appendChild(emptyDay);
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            if (day === today) {
                dayElement.classList.add('current');
            }
            
            const currentDateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            
            const hasEvent = events.some(e => e.fecha === currentDateStr);
            const hasActivity = activities.some(a => a.fecha === currentDateStr);
            
            if (hasEvent || hasActivity) {
                dayElement.classList.add('has-event');
                const indicator = document.createElement('div');
                indicator.className = 'day-indicator';
                if (hasEvent && hasActivity) {
                    indicator.style.background = 'linear-gradient(45deg, #ff9800 50%, #2196f3 50%)';
                } else if (hasEvent) {
                    indicator.style.background = '#ff9800';
                } else if (hasActivity) {
                    indicator.style.background = '#2196f3';
                }
                dayElement.appendChild(indicator);
            }
            
            calendarBody.appendChild(dayElement);
        }
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
});

// Prevent bfcache issues (Back button showing cached authenticated page)
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});
