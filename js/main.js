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
});

// Variables globales para datos dinámicos
let notesData = [];
let habitsData = [];
let eventsData = [];
let activitiesData = [];
let currentEditId = null;
let currentEditType = null;

// Cargar todos los datos desde Supabase
async function loadAllData() {
    try {
        notesData = await listarNotas();
        habitsData = await listarHabitos();
        eventsData = await listarEventos();
        activitiesData = await listarActividades();
        
        // Renderizar según la página actual
        if (window.location.pathname.includes('notes.html')) {
            renderNotes();
        } else if (window.location.pathname.includes('habits.html')) {
            renderHabits();
        } else if (window.location.pathname.includes('events.html')) {
            renderEvents();
        } else if (window.location.pathname.includes('activities.html')) {
            renderActivities();
        }
        
        generateCalendar();
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// Función para cerrar sesión
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Limpiar datos locales
        notesData = [];
        habitsData = [];
        eventsData = [];
        activitiesData = [];
        localStorage.clear();
        
        // Redirigir al login
        window.location.href = 'index.html';
    } catch (error) {
        alert('Error al cerrar sesión: ' + error.message);
    }
}

// Generar calendario con fecha actual mejorado
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
    
    // Primer día del mes (0 = domingo, 1 = lunes, etc.)
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Días vacíos al inicio
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarBody.appendChild(emptyDay);
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        // Marcar día actual
        if (day === today && month === new Date().getMonth() && year === new Date().getFullYear()) {
            dayElement.classList.add('current');
        }
        
        // Verificar eventos y actividades para este día
        const currentDateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        
        const hasEvent = eventsData.some(e => e.fecha === currentDateStr);
        const hasActivity = activitiesData.some(a => a.fecha === currentDateStr);
        
        if (hasEvent || hasActivity) {
            dayElement.classList.add('has-event');
            
            // Agregar indicador visual
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

// Funciones para modales - mejoradas para centrado
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        currentEditId = null;
        currentEditType = null;
        
        // Centrar modal en viewport
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Evitar scroll del body
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        
        // Restaurar scroll del body
        document.body.style.overflow = 'auto';
    }
    
    // Limpiar formularios
    const forms = modal?.querySelectorAll('form');
    forms?.forEach(form => form.reset());
    
    // Limpiar preview de imagen
    const imagePreview = modal?.querySelector('#image-preview');
    if (imagePreview) {
        imagePreview.style.display = 'none';
        imagePreview.src = '';
    }
}

// Funciones específicas para cada tipo
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

function getNextId(array) {
    return array.length > 0 ? Math.max(...array.map(item => item.id || item.id_notas || item.id_hab || item.id_cal)) + 1 : 1;
}

// Función para manejar carga de imagen
function handleImageUpload(input, previewId) {
    const file = input.files[0];
    const preview = document.getElementById(previewId);
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
        preview.src = '';
    }
}

// ========== FUNCIONES PARA NOTAS ==========
function renderNotes() {
    const notesContainer = document.querySelector('.notes-container');
    if (!notesContainer) return;
    
    notesContainer.innerHTML = '';
    
    if (notesData.length === 0) {
        notesContainer.innerHTML = '<p style="text-align: center; color: var(--text-light);">No tienes notas aún. ¡Crea tu primera nota!</p>';
        return;
    }
    
    notesData.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.innerHTML = `
            <div class="note-header">
                <h4>${note.nom || note.title}</h4>
                <div class="note-actions">
                    <button onclick="editNote(${note.id_notas || note.id})" class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteNote(${note.id_notas || note.id})" class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="note-content">
                <p>${note.cont || note.content}</p>
            </div>
            <div class="note-footer">
                <span class="note-date"><i class="fas fa-calendar"></i> ${new Date().toLocaleDateString('es-ES')}</span>
                <span class="note-words"><i class="fas fa-file-word"></i> ${(note.cont || note.content).split(' ').length} palabras</span>
            </div>
        `;
        notesContainer.appendChild(noteCard);
    });
}

async function saveNote(noteData) {
    try {
        if (currentEditId) {
            // Editar nota existente - implementar cuando sea necesario
            console.log('Editar nota no implementado aún');
        } else {
            // Crear nueva nota
            await insertarNota(noteData.title, noteData.content);
            await loadAllData();
            renderNotes();
        }
    } catch (error) {
        console.error('Error guardando nota:', error);
        alert('Error al guardar la nota: ' + error.message);
    }
}

function editNote(id) {
    const note = notesData.find(n => (n.id_notas || n.id) === id);
    if (!note) return;
    
    currentEditId = id;
    const modal = document.getElementById('note-modal');
    const form = modal.querySelector('form');
    
    form.title.value = note.nom || note.title;
    form.content.value = note.cont || note.content;
    
    modal.querySelector('.modal-header h3').textContent = 'Editar Nota';
    openModal('note-modal');
}

async function deleteNote(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
        try {
            const { error } = await supabase
                .from('notas')
                .delete()
                .eq('id_notas', id);
            
            if (error) throw error;
            
            await loadAllData();
            renderNotes();
        } catch (error) {
            console.error('Error eliminando nota:', error);
            alert('Error al eliminar la nota: ' + error.message);
        }
    }
}

// ========== FUNCIONES PARA HÁBITOS ==========
function renderHabits() {
    const habitsContainer = document.getElementById('habits-list');
    if (!habitsContainer) return;
    
    habitsContainer.innerHTML = '';
    
    if (habitsData.length === 0) {
        habitsContainer.innerHTML = '<p style="text-align: center; color: var(--text-light);">No tienes hábitos aún. ¡Crea tu primer hábito!</p>';
        return;
    }
    
    habitsData.forEach(habit => {
        const habitCard = document.createElement('div');
        habitCard.className = 'item-card habit-card';
        
        habitCard.innerHTML = `
            <div class="habit-header">
                <h4>${habit.nom || habit.name}</h4>
                <div class="habit-streak">
                    <i class="fas fa-fire"></i>
                    <span>0 días</span>
                </div>
            </div>
            <p class="habit-description">${habit.descr || habit.description}</p>
            <div class="habit-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <small>0/7 días esta semana</small>
            </div>
            <div class="habit-status">
                <label class="habit-checkbox">
                    <input type="checkbox" onchange="toggleHabit(${habit.id_hab || habit.id})">
                    <span class="checkmark"></span>
                    Completado hoy
                </label>
            </div>
            <div class="item-actions">
                <button onclick="editHabit(${habit.id_hab || habit.id})" class="edit-btn"><i class="fas fa-edit"></i></button>
                <button onclick="deleteHabit(${habit.id_hab || habit.id})" class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;
        habitsContainer.appendChild(habitCard);
    });
    updateHabitStats();
}

async function saveHabit(habitData) {
    try {
        if (currentEditId) {
            // Editar hábito existente - implementar cuando sea necesario
            console.log('Editar hábito no implementado aún');
        } else {
            // Crear nuevo hábito
            await insertarHabito(habitData.name, '08:00', 'medium', habitData.description);
            await loadAllData();
            renderHabits();
        }
    } catch (error) {
        console.error('Error guardando hábito:', error);
        alert('Error al guardar el hábito: ' + error.message);
    }
}

function toggleHabit(id) {
    // Implementar toggle de hábito
    console.log('Toggle hábito:', id);
}

function updateHabitStats() {
    const total = habitsData.length;
    const completed = 0; // Implementar lógica de completados
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const totalEl = document.getElementById('total-habits');
    const completedEl = document.getElementById('completed-today');
    const rateEl = document.getElementById('completion-rate');
    
    if (totalEl) totalEl.textContent = total;
    if (completedEl) completedEl.textContent = completed;
    if (rateEl) rateEl.textContent = rate + '%';
}

function editHabit(id) {
    const habit = habitsData.find(h => (h.id_hab || h.id) === id);
    if (!habit) return;
    
    currentEditId = id;
    const modal = document.getElementById('habit-modal');
    const form = modal.querySelector('form');
    
    form.name.value = habit.nom || habit.name;
    form.description.value = habit.descr || habit.description;
    form.frequency.value = 'daily';
    
    modal.querySelector('.modal-header h3').textContent = 'Editar Hábito';
    openModal('habit-modal');
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
            renderHabits();
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
        eventsContainer.innerHTML = '<p style="text-align: center; color: var(--text-light);">No tienes eventos aún. ¡Crea tu primer evento!</p>';
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
            // Editar evento existente - implementar cuando sea necesario
            console.log('Editar evento no implementado aún');
        } else {
            // Crear nuevo evento
            await insertarEvento(
                eventData.title,
                eventData.description,
                eventData.date,
                eventData.location || '',
                'medium',
                1, // id_categoria por defecto
                1, // id_recurrencia por defecto
                eventData.time || '09:00',
                eventData.time ? eventData.time : '10:00'
            );
            await loadAllData();
            renderEvents();
        }
    } catch (error) {
        console.error('Error guardando evento:', error);
        alert('Error al guardar el evento: ' + error.message);
    }
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

async function deleteEvent(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
        try {
            // Primero eliminar de agenda
            const { error: agendaError } = await supabase
                .from('agenda')
                .delete()
                .eq('id_cal', id);
            
            if (agendaError) throw agendaError;
            
            // Luego eliminar de calendario
            const { error: calError } = await supabase
                .from('calendario')
                .delete()
                .eq('id_cal', id);
            
            if (calError) throw calError;
            
            await loadAllData();
            renderEvents();
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
        activitiesContainer.innerHTML = '<p style="text-align: center; color: var(--text-light);">No tienes actividades aún. ¡Crea tu primera actividad!</p>';
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
            // Editar actividad existente - implementar cuando sea necesario
            console.log('Editar actividad no implementado aún');
        } else {
            // Crear nueva actividad
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
                renderActivities();
            }
        }
    } catch (error) {
        console.error('Error guardando actividad:', error);
        alert('Error al guardar la actividad: ' + error.message);
    }
}

function toggleActivity(id) {
    // Implementar toggle de actividad
    console.log('Toggle actividad:', id);
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

async function deleteActivity(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
        try {
            const { error } = await supabase
                .from('actividades')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            await loadAllData();
            renderActivities();
        } catch (error) {
            console.error('Error eliminando actividad:', error);
            alert('Error al eliminar la actividad: ' + error.message);
        }
    }
}

// ========== FUNCIONES DE CONFIGURACIÓN - MEJORADAS ==========
async function loadUserProfile() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Mostrar nombre de usuario del auth
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

        // Cargar configuraciones guardadas
        const savedTheme = localStorage.getItem('mydaily-theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            const themeOptions = document.querySelectorAll('.theme-option');
            themeOptions.forEach(o => {
                o.classList.toggle('active', o.getAttribute('data-theme') === savedTheme);
            });
        }
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}

async function saveProfile() {
    try {
        const user = await getUser();
        const username = document.getElementById('username').value;
        
        // Actualizar nombre en auth.users
        const { error } = await supabase.auth.updateUser({
            data: { full_name: username }
        });
        
        if (error) throw error;
        
        // Actualizar displays
        const usernameDisplays = document.querySelectorAll('.username');
        usernameDisplays.forEach(display => {
            if (display) display.textContent = username;
        });
        
        alert('Perfil guardado exitosamente');
        await loadUserProfile();
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
                const user = await getUser();
                
                // Eliminar todos los datos del usuario
                await Promise.all([
                    supabase.from('notas').delete().eq('user_id', user.id),
                    supabase.from('habitos').delete().eq('user_id', user.id),
                    supabase.from('actividades').delete().eq('user_id', user.id),
                    supabase.from('agenda').delete().in('id_cal', 
                        eventsData.map(e => e.id_cal)
                    ),
                    supabase.from('calendario').delete().eq('user_id', user.id)
                ]);
                
                // Limpiar datos locales
                notesData = [];
                habitsData = [];
                eventsData = [];
                activitiesData = [];
                localStorage.clear();
                
                alert('Todos los datos han sido eliminados. Cerrando sesión...');
                await logout();
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

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Cargar perfil de usuario
    loadUserProfile();
    
    generateCalendar();
    
    // Renderizar contenido según la página actual
    if (window.location.pathname.includes('notes.html')) {
        renderNotes();
    } else if (window.location.pathname.includes('habits.html')) {
        renderHabits();
    } else if (window.location.pathname.includes('events.html')) {
        renderEvents();
    } else if (window.location.pathname.includes('activities.html')) {
        renderActivities();
    }
    
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
    // Formulario de notas - mejorado con imagen y estado de ánimo
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
    // Filtro de eventos
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

    // Filtro de actividades
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

    // Búsqueda de notas
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

    // Filtro de notas
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

// ========== SELECTORES DE AVATAR Y TEMA ==========
function setupAvatarAndThemeSelectors() {
    // Selección de avatares
    const avatarOptions = document.querySelectorAll('.avatar-option');
    avatarOptions.forEach(option => {
        option.addEventListener('click', function () {
            // quitar clase activa a todos
            avatarOptions.forEach(o => o.classList.remove('active'));
            // activar el clicado
            this.classList.add('active');
            
            // Actualizar avatar en sidebar
            const selectedAvatar = this.getAttribute('data-avatar');
            const userAvatars = document.querySelectorAll('.user-avatar i');
            userAvatars.forEach(avatar => {
                if (avatar) avatar.className = `fas fa-${selectedAvatar}`;
            });
        });
    });

    // Selección de temas
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.addEventListener('click', function () {
            // quitar clase activa a todos
            themeOptions.forEach(o => o.classList.remove('active'));
            // activar el clicado
            this.classList.add('active');
            const selectedTheme = this.getAttribute('data-theme');

            // aplicar el tema al documento
            document.documentElement.setAttribute('data-theme', selectedTheme);

            // guardar preferencia en localStorage
            localStorage.setItem('mydaily-theme', selectedTheme);
        });
    });

    // Restaurar tema guardado al cargar
    const savedTheme = localStorage.getItem('mydaily-theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeOptions.forEach(o => {
            o.classList.toggle('active', o.getAttribute('data-theme') === savedTheme);
        });
    }
}