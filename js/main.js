document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    // Cargar perfil de usuario desde Supabase
    await loadUserProfile();
    
    // Cargar datos desde Supabase
    await loadAllData();
    
    // Configurar atajos de teclado
    setupKeyboardShortcuts();
});

// Variables globales para datos dinámicos
let notesData = [];
let habitsData = [];
let eventsData = [];
let activitiesData = [];
let currentEditId = null;
let currentEditType = null;
let userAvatarGlobal = 'user-circle';

// Configurar atajos de teclado
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        const isModalOpen = document.querySelector('.modal.show');
        const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
        
        if (isModalOpen || isTyping) return;
        
        if (e.ctrlKey) {
            switch(e.key.toLowerCase()) {
                case 'n':
                    e.preventDefault();
                    openNoteModal();
                    break;
                case 'h':
                    e.preventDefault();
                    window.location.href = 'habits.html';
                    break;
                case 'e':
                    e.preventDefault();
                    window.location.href = 'events.html';
                    break;
                case 'd':
                    e.preventDefault();
                    window.location.href = 'dashboard.html';
                    break;
            }
        }
    });
}

// Cargar todos los datos desde Supabase
async function loadAllData() {
    try {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.style.display = 'block';
        
        const [notes, habits, events, activities] = await Promise.all([
            listarNotas(),
            listarHabitos(), 
            listarEventos(),
            listarActividades()
        ]);
        
        notesData = notes;
        habitsData = habits;
        eventsData = events;
        activitiesData = activities;
        
        // Renderizar según la página actual
        if (window.location.pathname.includes('notes.html')) {
            renderNotes();
        } else if (window.location.pathname.includes('habits.html')) {
            renderHabits();
        } else if (window.location.pathname.includes('events.html')) {
            renderEvents();
        } else if (window.location.pathname.includes('activities.html')) {
            renderActivities();
        } else if (window.location.pathname.includes('dashboard.html')) {
            renderDashboardPreviews();
        }
        
        generateCalendar();
        updateDashboardStats();
        
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

// Renderizar previews del dashboard (solo los 3 más recientes)
function renderDashboardPreviews() {
    // Notas preview
    const previewCards = document.querySelectorAll('.preview-card .card-content');
    
    // Notas (primer card)
    if (previewCards[0] && notesData.length > 0) {
        previewCards[0].innerHTML = '';
        const recentNotes = notesData.slice(0, 3);
        recentNotes.forEach(note => {
            const item = document.createElement('div');
            item.className = 'preview-item';
            item.innerHTML = `
                ${note.favorita ? '<i class="fas fa-star" style="color: #ffd700; margin-right: 5px;"></i>' : ''}
                ${note.nom}
            `;
            item.onclick = () => window.location.href = 'notes.html';
            previewCards[0].appendChild(item);
        });
    } else if (previewCards[0]) {
        previewCards[0].innerHTML = '<div class="preview-item" style="color: var(--text-light);">No hay notas aún</div>';
    }
    
    // Hábitos (segundo card)
    if (previewCards[1] && habitsData.length > 0) {
        previewCards[1].innerHTML = '';
        const recentHabits = habitsData.slice(0, 3);
        recentHabits.forEach(habit => {
            const item = document.createElement('div');
            item.className = 'preview-item';
            item.innerHTML = `
                ${habit.completado_hoy ? '<i class="fas fa-check-circle" style="color: #4caf50; margin-right: 5px;"></i>' : '<i class="far fa-circle" style="margin-right: 5px;"></i>'}
                ${habit.nom}
                <small style="margin-left: auto; color: var(--text-light);">${habit.racha} días</small>
            `;
            item.onclick = () => window.location.href = 'habits.html';
            previewCards[1].appendChild(item);
        });
    } else if (previewCards[1]) {
        previewCards[1].innerHTML = '<div class="preview-item" style="color: var(--text-light);">No hay hábitos aún</div>';
    }
    
    // Actividades (tercer card)
    if (previewCards[2] && activitiesData.length > 0) {
        previewCards[2].innerHTML = '';
        const recentActivities = activitiesData.slice(0, 3);
        recentActivities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'preview-item';
            const priorityIcon = activity.prioridad === 'high' ? '🔴' : activity.prioridad === 'medium' ? '🟡' : '🟢';
            item.innerHTML = `
                ${priorityIcon} ${activity.titulo}
                ${activity.completada ? '<i class="fas fa-check" style="color: #4caf50; margin-left: auto;"></i>' : ''}
            `;
            item.onclick = () => window.location.href = 'activities.html';
            previewCards[2].appendChild(item);
        });
    } else if (previewCards[2]) {
        previewCards[2].innerHTML = '<div class="preview-item" style="color: var(--text-light);">No hay actividades aún</div>';
    }
    
    // Eventos (cuarto card)
    if (previewCards[3] && eventsData.length > 0) {
        previewCards[3].innerHTML = '';
        const recentEvents = eventsData.slice(0, 3);
        recentEvents.forEach(event => {
            const item = document.createElement('div');
            item.className = 'preview-item';
            const eventDate = new Date(event.fecha);
            const isUpcoming = eventDate >= new Date();
            item.innerHTML = `
                ${isUpcoming ? '📅' : '📋'} ${event.nom}
                <small style="margin-left: auto; color: var(--text-light);">${eventDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</small>
            `;
            item.onclick = () => window.location.href = 'events.html';
            previewCards[3].appendChild(item);
        });
    } else if (previewCards[3]) {
        previewCards[3].innerHTML = '<div class="preview-item" style="color: var(--text-light);">No hay eventos aún</div>';
    }
}

// Actualizar estadísticas del dashboard
function updateDashboardStats() {
    const totalNotesEl = document.getElementById('total-notes-stat');
    const totalHabitsEl = document.getElementById('total-habits-stat');
    const totalEventsEl = document.getElementById('total-events-stat');
    const pendingActivitiesEl = document.getElementById('pending-activities-stat');
    
    if (totalNotesEl) totalNotesEl.textContent = notesData.length;
    if (totalHabitsEl) totalHabitsEl.textContent = habitsData.length;
    if (totalEventsEl) totalEventsEl.textContent = eventsData.filter(e => new Date(e.fecha) >= new Date()).length;
    if (pendingActivitiesEl) pendingActivitiesEl.textContent = activitiesData.filter(a => !a.completada).length;
}

// Función para cerrar sesión
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        notesData = [];
        habitsData = [];
        eventsData = [];
        activitiesData = [];
        localStorage.clear();
        
        window.location.href = 'index.html';
    } catch (error) {
        alert('Error al cerrar sesión: ' + error.message);
    }
}

// Generar calendario
function generateCalendar() {
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
        
        if (day === today && month === new Date().getMonth() && year === new Date().getFullYear()) {
            dayElement.classList.add('current');
        }
        
        const currentDateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        
        const hasEvent = eventsData.some(e => e.fecha === currentDateStr);
        const hasActivity = activitiesData.some(a => a.fecha === currentDateStr);
        
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

// Funciones para modales
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        currentEditId = null;
        currentEditType = null;
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    const forms = modal?.querySelectorAll('form');
    forms?.forEach(form => form.reset());
}

function openNoteModal() { openModal('note-modal'); }
function openEventModal() { openModal('event-modal'); }
function openActivityModal() { openModal('activity-modal'); }
function openHabitModal() { openModal('habit-modal'); }

// Funciones de utilidad
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
}

// ========== FUNCIONES PARA NOTAS ==========
function renderNotes() {
    const notesContainer = document.querySelector('.notes-container');
    if (!notesContainer) return;
    
    notesContainer.innerHTML = '';
    
    if (notesData.length === 0) {
        notesContainer.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No tienes notas aún. ¡Crea tu primera nota!</p>';
        return;
    }
    
    notesData.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = `note-card ${note.favorita ? 'favorite' : ''}`;
        
        const moodEmojis = {
            sun: '☀️',
            cloud: '☁️',  
            rain: '🌧️',
            storm: '⛈️'
        };
        
        noteCard.innerHTML = `
            <div class="note-header">
                <h4>${note.nom}</h4>
                <div class="note-actions">
                    <button class="favorite-btn ${note.favorita ? 'active' : ''}" onclick="toggleNoteFavorite(${note.id_notas})">
                        <i class="fas fa-star"></i>
                    </button>
                    <button onclick="editNote(${note.id_notas})" class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteNote(${note.id_notas})" class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="note-content">
                <p>${note.cont}</p>
                ${note.imagen ? `<img src="${note.imagen}" alt="Note Image" class="note-image" style="max-width: 100%; border-radius: 8px; margin-top: 10px;">` : ''}
            </div>
            <div class="note-footer">
                <span class="note-date"><i class="fas fa-calendar"></i> ${formatDate(note.created_at || new Date())}</span>
                <span class="note-words"><i class="fas fa-file-word"></i> ${note.cont.split(' ').length} palabras</span>
                <span class="note-mood">${moodEmojis[note.estado_animo] || moodEmojis.sun}</span>
            </div>
        `;
        notesContainer.appendChild(noteCard);
    });
}

async function saveNote(noteData) {
    try {
        if (currentEditId) {
            await actualizarNota(currentEditId, noteData);
        } else {
            await insertarNota(
                noteData.title, 
                noteData.content,
                noteData.image || '',
                noteData.mood || 'sun',
                noteData.favorite || false
            );
        }
        
        await loadAllData();
        
        if (window.location.pathname.includes('dashboard.html')) {
            renderDashboardPreviews();
        }
    } catch (error) {
        console.error('Error guardando nota:', error);
        alert('Error al guardar la nota: ' + error.message);
    }
}

async function deleteNote(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
        try {
            const success = await eliminarNota(id);
            if (success) {
                await loadAllData();
            }
        } catch (error) {
            console.error('Error eliminando nota:', error);
        }
    }
}

async function toggleNoteFavorite(id) {
    const note = notesData.find(n => n.id_notas === id);
    if (note) {
        try {
            await actualizarNota(id, { favorita: !note.favorita });
            await loadAllData();
        } catch (error) {
            console.error('Error actualizando favorito:', error);
        }
    }
}

// ========== FUNCIONES PARA HÁBITOS ==========
function renderHabits() {
    const habitsContainer = document.getElementById('habits-list');
    if (!habitsContainer) return;
    
    habitsContainer.innerHTML = '';
    
    if (habitsData.length === 0) {
        habitsContainer.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No tienes hábitos aún. ¡Crea tu primer hábito!</p>';
        return;
    }
    
    habitsData.forEach(habit => {
        const habitCard = document.createElement('div');
        habitCard.className = `item-card habit-card ${habit.completado_hoy ? 'completed' : ''}`;
        const progressPercent = Math.round((habit.progreso_semanal / 7) * 100);
        
        habitCard.innerHTML = `
            <div class="habit-header">
                <h4>${habit.nom}</h4>
                <div class="habit-streak">
                    <i class="fas fa-fire"></i>
                    <span>${habit.racha} días</span>
                </div>
            </div>
            <p class="habit-description">${habit.descr}</p>
            <div class="habit-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <small>${habit.progreso_semanal}/7 días esta semana</small>
            </div>
            <div class="habit-status">
                <label class="habit-checkbox">
                    <input type="checkbox" ${habit.completado_hoy ? 'checked' : ''} onchange="toggleHabit(${habit.id_hab})">
                    <span class="checkmark"></span>
                    Completado hoy
                </label>
            </div>
            <div class="item-actions">
                <button onclick="editHabit(${habit.id_hab})" class="edit-btn"><i class="fas fa-edit"></i></button>
                <button onclick="deleteHabit(${habit.id_hab})" class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;
        habitsContainer.appendChild(habitCard);
    });
    updateHabitStats();
}

async function saveHabit(habitData) {
    try {
        if (currentEditId) {
            await actualizarHabito(currentEditId, habitData);
        } else {
            await insertarHabito(habitData.name, '08:00', 'medium', habitData.description);
        }
        
        await loadAllData();
        
        if (window.location.pathname.includes('dashboard.html')) {
            renderDashboardPreviews();
        }
    } catch (error) {
        console.error('Error guardando hábito:', error);
        alert('Error al guardar el hábito: ' + error.message);
    }
}

async function toggleHabit(id) {
    try {
        const success = await toggleHabitoCompletado(id);
        if (success) {
            await loadAllData();
        }
    } catch (error) {
        console.error('Error toggling hábito:', error);
    }
}

function updateHabitStats() {
    const total = habitsData.length;
    const completed = habitsData.filter(h => h.completado_hoy).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const totalEl = document.getElementById('total-habits');
    const completedEl = document.getElementById('completed-today');
    const rateEl = document.getElementById('completion-rate');
    
    if (totalEl) totalEl.textContent = total;
    if (completedEl) completedEl.textContent = completed;
    if (rateEl) rateEl.textContent = rate + '%';
}

async function deleteHabit(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este hábito?')) {
        try {
            const { error } = await supabase
                .from('habitos')
                .delete()
                .eq('id_hab', id);
            
            if (error) throw error;
            await loadAllData();
        } catch (error) {
            console.error('Error eliminando hábito:', error);
            alert('Error al eliminar el hábito: ' + error.message);
        }
    }
}

// ========== FUNCIONES PARA EVENTOS ==========
function renderEvents() {
    const eventsContainer = document.querySelector('.events-timeline');
    if (!eventsContainer) return;
    
    eventsContainer.innerHTML = '';
    
    if (eventsData.length === 0) {
        eventsContainer.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No tienes eventos aún. ¡Crea tu primer evento!</p>';
        return;
    }
    
    eventsData.forEach(event => {
        const eventItem = document.createElement('div');
        const eventDate = new Date(event.fecha);
        const today = new Date();
        const isPast = eventDate < today;
        
        eventItem.className = `event-item ${isPast ? 'past' : 'upcoming'}`;
        
        eventItem.innerHTML = `
            <div class="event-date">
                <div class="date-day">${eventDate.getDate()}</div>
                <div class="date-month">${eventDate.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}</div>
                <div class="date-year">${eventDate.getFullYear()}</div>
            </div>
            <div class="event-content">
                <h4>${event.nom}</h4>
                <p class="event-description">${event.descr}</p>
                <div class="event-meta">
                    ${event.agenda && event.agenda[0] ? `<span class="event-time"><i class="fas fa-clock"></i> ${event.agenda[0].hora_i} - ${event.agenda[0].hora_f}</span>` : ''}
                    ${event.lugar ? `<span class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.lugar}</span>` : ''}
                    <span class="event-category personal">Evento</span>
                </div>
                <div class="event-actions">
                    <button onclick="editEvent(${event.id_cal})" class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteEvent(${event.id_cal})" class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        eventsContainer.appendChild(eventItem);
    });
}

async function saveEvent(eventData) {
    try {
        if (currentEditId) {
            console.log('Editar evento no implementado aún');
        } else {
            await insertarEvento(
                eventData.title,
                eventData.description,
                eventData.date,
                eventData.location || '',
                'medium',
                1,
                1,
                eventData.time || '09:00',
                eventData.time ? addHour(eventData.time) : '10:00'
            );
        }
        
        await loadAllData();
        
        if (window.location.pathname.includes('dashboard.html')) {
            renderDashboardPreviews();
        }
    } catch (error) {
        console.error('Error guardando evento:', error);
        alert('Error al guardar el evento: ' + error.message);
    }
}

function addHour(timeString) {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours) + 1, parseInt(minutes));
    return date.toTimeString().slice(0, 5);
}

async function deleteEvent(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
        try {
            await supabase.from('agenda').delete().eq('id_cal', id);
            await supabase.from('calendario').delete().eq('id_cal', id);
            await loadAllData();
        } catch (error) {
            console.error('Error eliminando evento:', error);
            alert('Error al eliminar el evento: ' + error.message);
        }
    }
}

// ========== FUNCIONES PARA ACTIVIDADES ==========
function renderActivities() {
    const activitiesContainer = document.querySelector('.activities-container');
    if (!activitiesContainer) return;
    
    activitiesContainer.innerHTML = '';
    
    if (activitiesData.length === 0) {
        activitiesContainer.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No tienes actividades aún. ¡Crea tu primera actividad!</p>';
        return;
    }
    
    activitiesData.forEach(activity => {
        const activityCard = document.createElement('div');
        activityCard.className = `activity-card ${activity.completada ? 'completed' : 'pending'}`;
        
        const priorityIcons = {
            high: 'fas fa-exclamation-circle',
            medium: 'fas fa-minus-circle',
            low: 'fas fa-circle'
        };
        
        activityCard.innerHTML = `
            <div class="activity-priority ${activity.prioridad || 'medium'}">
                <i class="${priorityIcons[activity.prioridad] || priorityIcons.medium}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.titulo}</h4>
                <p class="activity-description">${activity.descripcion}</p>
                <div class="activity-meta">
                    <span class="activity-date"><i class="fas fa-calendar"></i> ${formatDate(activity.fecha)}</span>
                    ${activity.hora ? `<span class="activity-time"><i class="fas fa-clock"></i> ${activity.hora}</span>` : ''}
                    <span class="activity-category ${activity.categoria || 'personal'}">${activity.categoria || 'Personal'}</span>
                </div>
            </div>
            <div class="activity-status">
                <label class="activity-checkbox">
                    <input type="checkbox" ${activity.completada ? 'checked' : ''} onchange="toggleActivity(${activity.id})">
                    <span class="checkmark"></span>
                </label>
            </div>
            <div class="activity-actions">
                <button onclick="editActivity(${activity.id})" class="edit-btn"><i class="fas fa-edit"></i></button>
                <button onclick="deleteActivity(${activity.id})" class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;
        activitiesContainer.appendChild(activityCard);
    });
    updateActivityStats();
}

async function saveActivity(activityData) {
    try {
        if (currentEditId) {
            console.log('Editar actividad no implementado aún');
        } else {
            const success = await insertarActividad(
                activityData.title,
                activityData.description,
                activityData.date,
                activityData.time,
                activityData.priority,
                activityData.category
            );
            
            if (success) {
                await loadAllData();
                
                if (window.location.pathname.includes('dashboard.html')) {
                    renderDashboardPreviews();
                }
            }
        }
    } catch (error) {
        console.error('Error guardando actividad:', error);
        alert('Error al guardar la actividad: ' + error.message);
    }
}

async function toggleActivity(id) {
    try {
        const success = await toggleActividadCompletada(id);
        if (success) {
            await loadAllData();
        }
    } catch (error) {
        console.error('Error toggling actividad:', error);
    }
}

function updateActivityStats() {
    const total = activitiesData.length;
    const completed = activitiesData.filter(a => a.completada).length;
    const pending = total - completed;
    
    const totalEl = document.getElementById('total-activities');
    const completedEl = document.getElementById('completed-activities');
    const pendingEl = document.getElementById('pending-activities');
    
    if (totalEl) totalEl.textContent = total;
    if (completedEl) completedEl.textContent = completed;
    if (pendingEl) pendingEl.textContent = pending;
}

async function deleteActivity(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
        try {
            const { error } = await supabase
                .from('actividades')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            await loadAllData();
        } catch (error) {
            console.error('Error eliminando actividad:', error);
            alert('Error al eliminar la actividad: ' + error.message);
        }
    }
}

// ========== FUNCIONES DE CONFIGURACIÓN ==========
async function loadUserProfile() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Mostrar información del usuario
        const usernameDisplays = document.querySelectorAll('.username');
        const usernameInputs = document.querySelectorAll('#username');
        const emailInputs = document.querySelectorAll('#email');
        
        const displayName = user.user_metadata?.full_name || user.email.split('@')[0];
        
        usernameDisplays.forEach(display => {
            if (display) display.textContent = displayName;
        });
        
        usernameInputs.forEach(input => {
            if (input) input.value = displayName;
        });
        
        emailInputs.forEach(input => {
            if (input) input.value = user.email;
        });

        // Cargar configuraciones del usuario desde la BD
        const config = await obtenerConfiguracionUsuario();
        if (config) {
            userAvatarGlobal = config.avatar || 'user-circle';
            updateAvatarDisplay(userAvatarGlobal);
            
            // Aplicar tema
            if (config.tema) {
                document.documentElement.setAttribute('data-theme', config.tema);
                const themeOptions = document.querySelectorAll('.theme-option');
                themeOptions.forEach(o => {
                    o.classList.toggle('active', o.getAttribute('data-theme') === config.tema);
                });
            }
        } else {
            // Cargar desde localStorage como fallback
            const savedAvatar = localStorage.getItem('mydaily-avatar');
            const savedTheme = localStorage.getItem('mydaily-theme');
            
            if (savedAvatar) {
                userAvatarGlobal = savedAvatar;
                updateAvatarDisplay(savedAvatar);
            }
            
            if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme);
                const themeOptions = document.querySelectorAll('.theme-option');
                themeOptions.forEach(o => {
                    o.classList.toggle('active', o.getAttribute('data-theme') === savedTheme);
                });
            }
        }
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}

function updateAvatarDisplay(avatarType) {
    const userAvatars = document.querySelectorAll('.user-avatar i');
    userAvatars.forEach(avatar => {
        if (avatar) avatar.className = `fas fa-${avatarType}`;
    });
    
    const avatarOptions = document.querySelectorAll('.avatar-option');
    avatarOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.avatar === avatarType);
    });
}

async function saveProfile() {
    try {
        const user = await getUser();
        const username = document.getElementById('username').value;
        const selectedAvatar = document.querySelector('.avatar-option.active')?.dataset.avatar || 'user-circle';
        const selectedTheme = document.querySelector('.theme-option.active')?.dataset.theme || 'default';
        
        // Actualizar nombre en auth.users
        const { error: authError } = await supabase.auth.updateUser({
            data: { full_name: username }
        });
        
        if (authError) throw authError;
        
        // Guardar configuraciones en la BD
        const success = await guardarConfiguracionUsuario({
            avatar: selectedAvatar,
            tema: selectedTheme,
            // Otros campos de configuración...
        });
        
        if (success) {
            // Actualizar globals
            userAvatarGlobal = selectedAvatar;
            
            // Actualizar displays
            const usernameDisplays = document.querySelectorAll('.username');
            usernameDisplays.forEach(display => {
                if (display) display.textContent = username;
            });
            
            updateAvatarDisplay(selectedAvatar);
            document.documentElement.setAttribute('data-theme', selectedTheme);
            
            // También guardar en localStorage como backup
            localStorage.setItem('mydaily-avatar', selectedAvatar);
            localStorage.setItem('mydaily-theme', selectedTheme);
            
            alert('Perfil guardado exitosamente');
        }
    } catch (error) {
        console.error('Error guardando perfil:', error);
        alert('Error al guardar perfil: ' + error.message);
    }
}

function exportData() {
    const data = {
        notes: notesData,
        habits: habitsData,
        events: eventsData,
        activities: activitiesData,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mydaily-backup.json';
    link.click();
    
    URL.revokeObjectURL(url);
}

async function deleteAccount() {
    if (confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
        if (confirm('Confirma nuevamente: ¿Eliminar cuenta permanentemente?')) {
            try {
                const success = await eliminarTodosLosDatosUsuario();
                
                if (success) {
                    notesData = [];
                    habitsData = [];
                    eventsData = [];
                    activitiesData = [];
                    localStorage.clear();
                    
                    alert('Todos los datos han sido eliminados. Cerrando sesión...');
                    await logout();
                } else {
                    alert('Error al eliminar los datos de la cuenta');
                }
            } catch (error) {
                console.error('Error eliminando datos:', error);
                alert('Error al eliminar la cuenta: ' + error.message);
            }
        }
    }
}

function showHelp() {
    alert('Centro de ayuda: Aquí encontrarías tutoriales y guías de uso completas para MyDaily.');
}

function reportBug() {
    alert('Formulario de reporte de problemas. En una aplicación real, se abriría un sistema de tickets de soporte.');
}

function sendFeedback() {
    alert('Formulario de feedback. En una aplicación real, se abriría un formulario para enviar sugerencias de mejora.');
}

// Funciones adicionales necesarias
function editNote(id) {
    const note = notesData.find(n => n.id_notas === id);
    if (!note) return;
    
    currentEditId = id;
    const modal = document.getElementById('note-modal');
    const form = modal.querySelector('form');
    
    form.title.value = note.nom;
    form.content.value = note.cont;
    form.mood.value = note.estado_animo;
    form.favorite.checked = note.favorita;
    
    modal.querySelector('.modal-header h3').textContent = 'Editar Nota';
    openModal('note-modal');
}

function editHabit(id) {
    const habit = habitsData.find(h => h.id_hab === id);
    if (!habit) return;
    
    currentEditId = id;
    const modal = document.getElementById('habit-modal');
    const form = modal.querySelector('form');
    
    form.name.value = habit.nom;
    form.description.value = habit.descr;
    form.frequency.value = 'daily';
    
    modal.querySelector('.modal-header h3').textContent = 'Editar Hábito';
    openModal('habit-modal');
}

function editEvent(id) {
    const event = eventsData.find(e => e.id_cal === id);
    if (!event) return;
    
    currentEditId = id;
    const modal = document.getElementById('event-modal');
    const form = modal.querySelector('form');
    
    form.title.value = event.nom;
    form.description.value = event.descr;
    form.date.value = event.fecha;
    form.location.value = event.lugar;
    if (event.agenda && event.agenda[0]) {
        form.time.value = event.agenda[0].hora_i;
    }
    
    modal.querySelector('.modal-header h3').textContent = 'Editar Evento';
    openModal('event-modal');
}

function editActivity(id) {
    const activity = activitiesData.find(a => a.id === id);
    if (!activity) return;
    
    currentEditId = id;
    const modal = document.getElementById('activity-modal');
    const form = modal.querySelector('form');
    
    form.title.value = activity.titulo;
    form.description.value = activity.descripcion;
    form.date.value = activity.fecha;
    form.time.value = activity.hora;
    form.priority.value = activity.prioridad;
    form.category.value = activity.categoria;
    
    modal.querySelector('.modal-header h3').textContent = 'Editar Actividad';
    openModal('activity-modal');
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners para logout
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                logout();
            }
        });
    });
    
    // Cerrar modales al hacer clic fuera
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Escape key para cerrar modales
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
    
    // Event listeners para formularios
    setupFormHandlers();
    setupFilters();
    setupAvatarAndThemeSelectors();
});

function setupFormHandlers() {
    // Formulario de notas
    const noteForm = document.getElementById('note-form');
    if (noteForm) {
        noteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const noteData = {
                title: formData.get('title'),
                content: formData.get('content'),
                favorite: formData.get('favorite') === 'on',
                mood: formData.get('mood') || 'sun'
            };
            
            saveNote(noteData);
            closeModal('note-modal');
        });
    }
    
    // Formulario de hábitos
    const habitForm = document.getElementById('habit-form');
    if (habitForm) {
        habitForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const habitData = {
                name: formData.get('name'),
                description: formData.get('description'),
                frequency: formData.get('frequency')
            };
            saveHabit(habitData);
            closeModal('habit-modal');
        });
    }
    
    // Formulario de eventos
    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const eventData = {
                title: formData.get('title'),
                description: formData.get('description'),
                date: formData.get('date'),
                time: formData.get('time'),
                location: formData.get('location'),
                category: formData.get('category')
            };
            saveEvent(eventData);
            closeModal('event-modal');
        });
    }
    
    // Formulario de actividades
    const activityForm = document.getElementById('activity-form');
    if (activityForm) {
        activityForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const activityData = {
                title: formData.get('title'),
                description: formData.get('description'),
                date: formData.get('date'),
                time: formData.get('time'),
                priority: formData.get('priority'),
                category: formData.get('category')
            };
            saveActivity(activityData);
            closeModal('activity-modal');
        });
    }
}

function setupFilters() {
    // Filtros y búsquedas para cada sección
    const eventFilter = document.getElementById('event-filter');
    if (eventFilter) {
        eventFilter.addEventListener('change', function(e) {
            const filterValue = e.target.value;
            const events = document.querySelectorAll('.event-item');
            
            events.forEach(event => {
                event.style.display = 'flex';
                
                if (filterValue === 'upcoming' && event.classList.contains('past')) {
                    event.style.display = 'none';
                } else if (filterValue === 'past' && !event.classList.contains('past')) {
                    event.style.display = 'none';
                }
            });
        });
    }

    const activityFilter = document.getElementById('activity-filter');
    if (activityFilter) {
        activityFilter.addEventListener('change', function(e) {
            const filterValue = e.target.value;
            const activities = document.querySelectorAll('.activity-card');
            
            activities.forEach(activity => {
                activity.style.display = 'flex';
                
                if (filterValue === 'pending' && activity.classList.contains('completed')) {
                    activity.style.display = 'none';
                } else if (filterValue === 'completed' && !activity.classList.contains('completed')) {
                    activity.style.display = 'none';
                }
            });
        });
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const notes = document.querySelectorAll('.note-card');
            
            notes.forEach(note => {
                const title = note.querySelector('h4').textContent.toLowerCase();
                const content = note.querySelector('.note-content p').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || content.includes(searchTerm)) {
                    note.style.display = 'block';
                } else {
                    note.style.display = 'none';
                }
            });
        });
    }

    const notesFilter = document.getElementById('notes-filter');
    if (notesFilter) {
        notesFilter.addEventListener('change', function(e) {
            const filterValue = e.target.value;
            const notes = document.querySelectorAll('.note-card');
            
            notes.forEach(note => {
                note.style.display = 'block';
                
                if (filterValue === 'favorites' && !note.classList.contains('favorite')) {
                    note.style.display = 'none';
                }
            });
        });
    }
}

function setupAvatarAndThemeSelectors() {
    // Selección de avatares
    const avatarOptions = document.querySelectorAll('.avatar-option');
    avatarOptions.forEach(option => {
        option.addEventListener('click', function () {
            avatarOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Selección de temas
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.addEventListener('click', function () {
            themeOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            const selectedTheme = this.getAttribute('data-theme');

            document.documentElement.setAttribute('data-theme', selectedTheme);
        });
    });
}