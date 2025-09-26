document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    // Cargar perfil de usuario desde Supabase
    loadUserProfile();
});

// Datos globales para almacenar información
let notesData = [
    { id: 1, title: "Mi primera nota", content: "Esta es mi primera nota en MyDaily. Aquí puedo escribir todas mis ideas importantes y pensamientos del día.", date: "2025-08-15", favorite: false, image: "", mood: "sun"},
    { id: 2, title: "Ideas importantes", content: "Recordar implementar las nuevas funciones en el proyecto. También investigar sobre las últimas tendencias en diseño UX.", date: "2025-08-16", favorite: true, image: "", mood: "cloud"},
    { id: 3, title: "Lista de compras", content: "Leche, Pan integral, Frutas variadas, Verduras frescas, Pollo", date: "2025-08-17", favorite: false, image: "", mood: "rain"},
    { id: 4, title: "Reflexiones del día", content: "Hoy fue un día productivo. Logré completar la mayoría de mis tareas y me siento satisfecho con el progreso.", date: "2025-08-18", favorite: false, image: "", mood: "sun"},
    { id: 5, title: "Libros por leer", content: "Atomic Habits - James Clear, The Psychology of Money - Morgan Housel, Deep Work - Cal Newport", date: "2025-08-19", favorite: false, image: "", mood: "cloud"},
    { id: 6, title: "Metas del mes", content: "Objetivos para agosto: Terminar el curso online, hacer ejercicio 5 veces por semana, leer 2 libros completos.", date: "2025-08-20", favorite: false, image: "", mood: "sun"}
];

let habitsData = [
    { id: 1, name: "Ejercicio matutino", description: "30 minutos de ejercicio al levantarme", streak: 5, weekProgress: 5, completed: false },
    { id: 2, name: "Leer 30 minutos", description: "Lectura diaria para el crecimiento personal", streak: 12, weekProgress: 7, completed: true },
    { id: 3, name: "Meditar", description: "10 minutos de meditación para la paz mental", streak: 3, weekProgress: 3, completed: false }
];

let eventsData = [
    { id: 1, title: "Conferencia Tech", description: "Conferencia sobre las últimas tendencias en tecnología", date: "2025-09-18", time: "09:00", location: "Centro de Convenciones", category: "tech" },
    { id: 2, title: "Concierto de Música Clásica", description: "Una velada especial con la orquesta sinfónica", date: "2025-09-22", time: "20:00", location: "Teatro Nacional", category: "music" },
    { id: 3, title: "Viaje Familiar", description: "Fin de semana de relajación en la playa", date: "2025-09-30", time: "", location: "Playa del Carmen", category: "personal" },
    { id: 4, title: "Cumpleaños de Ana", description: "Celebración del cumpleaños de mi hermana", date: "2025-08-10", time: "18:00", location: "Casa de Ana", category: "personal" }
];

let activitiesData = [
    { id: 1, title: "Reunión de trabajo", description: "Presentación del nuevo proyecto con el equipo", date: "2025-09-15", time: "10:00", priority: "high", category: "trabajo", completed: false },
    { id: 2, title: "Comprar regalo para María", description: "Buscar un regalo especial para el cumpleaños", date: "2025-09-18", time: "16:00", priority: "medium", category: "personal", completed: true },
    { id: 3, title: "Cita con el dentista", description: "Revisión dental semestral y limpieza", date: "2025-09-20", time: "14:30", priority: "medium", category: "salud", completed: false },
    { id: 4, title: "Renovar licencia de conducir", description: "Tramitar la renovación antes del vencimiento", date: "2025-09-22", time: "09:00", priority: "low", category: "administrativa", completed: true },
    { id: 5, title: "Preparar presentación", description: "Finalizar la presentación para el cliente del viernes", date: "2025-09-25", time: "", priority: "high", category: "trabajo", completed: false },
    { id: 6, title: "Organizar viaje familiar", description: "Planificar alojamiento y actividades para el fin de semana", date: "2025-09-30", time: "18:00", priority: "low", category: "personal", completed: false }
];

let currentEditId = null;
let currentEditType = null;

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
        
        const hasEvent = eventsData.some(e => e.date === currentDateStr);
        const hasActivity = activitiesData.some(a => a.date === currentDateStr);
        
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
    return array.length > 0 ? Math.max(...array.map(item => item.id)) + 1 : 1;
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
    
    notesData.forEach(note => {
        const moodIcons = {
            sun: '<i class="fas fa-sun" style="color: #ffb74d;"></i>',
            cloud: '<i class="fas fa-cloud" style="color: #90a4ae;"></i>',
            rain: '<i class="fas fa-cloud-rain" style="color: #64b5f6;"></i>',
            storm: '<i class="fas fa-bolt" style="color: #9575cd;"></i>'
        };
        
        const noteCard = document.createElement('div');
        noteCard.className = `note-card ${note.favorite ? 'favorite' : ''}`;
        noteCard.innerHTML = `
            <div class="note-header">
                <h4>${note.title}</h4>
                <div class="note-actions">
                    <button class="favorite-btn ${note.favorite ? 'active' : ''}" onclick="toggleNoteFavorite(${note.id})">
                        <i class="fas fa-star"></i>
                    </button>
                    <button onclick="editNote(${note.id})" class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteNote(${note.id})" class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="note-content">
                <p>${note.content}</p>
                ${note.image ? `<img src="${note.image}" alt="Note Image" class="note-image" style="max-width: 100%; border-radius: 8px; margin-top: 10px;">` : ''}
            </div>
            <div class="note-footer">
                <span class="note-date"><i class="fas fa-calendar"></i> ${formatDate(note.date)}</span>
                <span class="note-words"><i class="fas fa-file-word"></i> ${note.content.split(' ').length} palabras</span>
                <span class="note-mood">${moodIcons[note.mood] || moodIcons.sun}</span>
            </div>
        `;
        notesContainer.appendChild(noteCard);
    });
}

function saveNote(noteData) {
    if (currentEditId) {
        // Editar nota existente
        const index = notesData.findIndex(note => note.id === currentEditId);
        if (index !== -1) {
            notesData[index] = { ...notesData[index], ...noteData };
        }
    } else {
        // Crear nueva nota
        const newNote = {
            id: getNextId(notesData),
            ...noteData,
            date: new Date().toISOString().split('T')[0]
        };
        notesData.push(newNote);
    }
    renderNotes();
}

function editNote(id) {
    const note = notesData.find(n => n.id === id);
    if (!note) return;
    
    currentEditId = id;
    const modal = document.getElementById('note-modal');
    const form = modal.querySelector('form');
    
    form.title.value = note.title;
    form.content.value = note.content;
    form.favorite.checked = note.favorite;
    form.mood.value = note.mood;
    
    // Mostrar imagen si existe
    if (note.image) {
        const preview = document.getElementById('image-preview');
        if (preview) {
            preview.src = note.image;
            preview.style.display = 'block';
        }
    }
    
    modal.querySelector('.modal-header h3').textContent = 'Editar Nota';
    openModal('note-modal');
}

function deleteNote(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
        notesData = notesData.filter(note => note.id !== id);
        renderNotes();
    }
}

function toggleNoteFavorite(id) {
    const note = notesData.find(n => n.id === id);
    if (note) {
        note.favorite = !note.favorite;
        renderNotes();
    }
}

// ========== FUNCIONES PARA HÁBITOS ==========
function renderHabits() {
    const habitsContainer = document.getElementById('habits-list');
    if (!habitsContainer) return;
    
    habitsContainer.innerHTML = '';
    
    habitsData.forEach(habit => {
        const habitCard = document.createElement('div');
        habitCard.className = `item-card habit-card ${habit.completed ? 'completed' : ''}`;
        const progressPercent = Math.round((habit.weekProgress / 7) * 100);
        
        habitCard.innerHTML = `
            <div class="habit-header">
                <h4>${habit.name}</h4>
                <div class="habit-streak">
                    <i class="fas fa-fire"></i>
                    <span>${habit.streak} días</span>
                </div>
            </div>
            <p class="habit-description">${habit.description}</p>
            <div class="habit-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <small>${habit.weekProgress}/7 días esta semana</small>
            </div>
            <div class="habit-status">
                <label class="habit-checkbox">
                    <input type="checkbox" ${habit.completed ? 'checked' : ''} onchange="toggleHabit(${habit.id})">
                    <span class="checkmark"></span>
                    Completado hoy
                </label>
            </div>
            <div class="item-actions">
                <button onclick="editHabit(${habit.id})" class="edit-btn"><i class="fas fa-edit"></i></button>
                <button onclick="deleteHabit(${habit.id})" class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;
        habitsContainer.appendChild(habitCard);
    });
    updateHabitStats();
}

function saveHabit(habitData) {
    if (currentEditId) {
        // Editar hábito existente
        const index = habitsData.findIndex(habit => habit.id === currentEditId);
        if (index !== -1) {
            habitsData[index] = { ...habitsData[index], ...habitData };
        }
    } else {
        // Crear nuevo hábito
        const newHabit = {
            id: getNextId(habitsData),
            ...habitData,
            streak: 0,
            weekProgress: 0,
            completed: false
        };
        habitsData.push(newHabit);
    }
    renderHabits();
}

function toggleHabit(id) {
    const habit = habitsData.find(h => h.id === id);
    if (habit) {
        habit.completed = !habit.completed;
        if (habit.completed) {
            habit.streak++;
            habit.weekProgress = Math.min(habit.weekProgress + 1, 7);
        } else {
            habit.streak = Math.max(habit.streak - 1, 0);
            habit.weekProgress = Math.max(habit.weekProgress - 1, 0);
        }
        renderHabits();
    }
}

function updateHabitStats() {
    const total = habitsData.length;
    const completed = habitsData.filter(h => h.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const totalEl = document.getElementById('total-habits');
    const completedEl = document.getElementById('completed-today');
    const rateEl = document.getElementById('completion-rate');
    
    if (totalEl) totalEl.textContent = total;
    if (completedEl) completedEl.textContent = completed;
    if (rateEl) rateEl.textContent = rate + '%';
}

function editHabit(id) {
    const habit = habitsData.find(h => h.id === id);
    if (!habit) return;
    
    currentEditId = id;
    const modal = document.getElementById('habit-modal');
    const form = modal.querySelector('form');
    
    form.name.value = habit.name;
    form.description.value = habit.description;
    form.frequency.value = 'daily';
    
    modal.querySelector('.modal-header h3').textContent = 'Editar Hábito';
    openModal('habit-modal');
}

function deleteHabit(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este hábito?')) {
        habitsData = habitsData.filter(habit => habit.id !== id);
        renderHabits();
    }
}

// ========== FUNCIONES PARA EVENTOS ==========
function renderEvents() {
    const eventsContainer = document.querySelector('.events-timeline');
    if (!eventsContainer) return;
    
    eventsContainer.innerHTML = '';
    
    // Ordenar eventos por fecha
    const sortedEvents = [...eventsData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedEvents.forEach(event => {
        const eventItem = document.createElement('div');
        const eventDate = new Date(event.date);
        const today = new Date();
        const isPast = eventDate < today;
        
        eventItem.className = `event-item ${isPast ? 'past' : 'upcoming'}`;
        
        const categoryColors = {
            tech: '#2196F3',
            music: '#9C27B0',
            personal: '#4CAF50',
            trabajo: '#FF9800',
            sport: '#F44336',
            educacion: '#607D8B'
        };
        
        eventItem.innerHTML = `
            <div class="event-date">
                <div class="date-day">${eventDate.getDate()}</div>
                <div class="date-month">${eventDate.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}</div>
                <div class="date-year">${eventDate.getFullYear()}</div>
            </div>
            <div class="event-content">
                <h4>${event.title}</h4>
                <p class="event-description">${event.description}</p>
                <div class="event-meta">
                    ${event.time ? `<span class="event-time"><i class="fas fa-clock"></i> ${event.time}</span>` : ''}
                    ${event.location ? `<span class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</span>` : ''}
                    <span class="event-category ${event.category}" style="background: ${categoryColors[event.category] || '#666'}">${event.category}</span>
                </div>
                <div class="event-actions">
                    <button onclick="editEvent(${event.id})" class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteEvent(${event.id})" class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        eventsContainer.appendChild(eventItem);
    });
}

function saveEvent(eventData) {
    if (currentEditId) {
        // Editar evento existente
        const index = eventsData.findIndex(event => event.id === currentEditId);
        if (index !== -1) {
            eventsData[index] = { ...eventsData[index], ...eventData };
        }
    } else {
        // Crear nuevo evento
        const newEvent = {
            id: getNextId(eventsData),
            ...eventData
        };
        eventsData.push(newEvent);
    }
    renderEvents();
    generateCalendar(); // Regenerar calendario para mostrar nuevos eventos
}

function editEvent(id) {
    const event = eventsData.find(e => e.id === id);
    if (!event) return;
    
    currentEditId = id;
    const modal = document.getElementById('event-modal');
    const form = modal.querySelector('form');
    
    form.title.value = event.title;
    form.description.value = event.description;
    form.date.value = event.date;
    form.time.value = event.time;
    form.location.value = event.location;
    form.category.value = event.category;
    
    modal.querySelector('.modal-header h3').textContent = 'Editar Evento';
    openModal('event-modal');
}

function deleteEvent(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
        eventsData = eventsData.filter(event => event.id !== id);
        renderEvents();
        generateCalendar(); // Regenerar calendario
    }
}

// ========== FUNCIONES PARA ACTIVIDADES ==========
function renderActivities() {
    const activitiesContainer = document.querySelector('.activities-container');
    if (!activitiesContainer) return;
    
    activitiesContainer.innerHTML = '';
    
    activitiesData.forEach(activity => {
        const activityCard = document.createElement('div');
        activityCard.className = `activity-card ${activity.completed ? 'completed' : 'pending'}`;
        
        const priorityIcons = {
            high: 'fas fa-exclamation-circle',
            medium: 'fas fa-minus-circle',
            low: 'fas fa-circle'
        };
        
        const categoryColors = {
            personal: '#4CAF50',
            trabajo: '#2196F3',
            salud: '#f44336',
            administrativa: '#ff9800',
            educacion: '#9C27B0'
        };
        
        activityCard.innerHTML = `
            <div class="activity-priority ${activity.priority}">
                <i class="${priorityIcons[activity.priority]}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.title}</h4>
                <p class="activity-description">${activity.description}</p>
                <div class="activity-meta">
                    <span class="activity-date"><i class="fas fa-calendar"></i> ${formatDate(activity.date)}</span>
                    ${activity.time ? `<span class="activity-time"><i class="fas fa-clock"></i> ${activity.time}</span>` : ''}
                    <span class="activity-category ${activity.category}" style="background: ${categoryColors[activity.category] || '#666'}">${activity.category}</span>
                </div>
            </div>
            <div class="activity-status">
                <label class="activity-checkbox">
                    <input type="checkbox" ${activity.completed ? 'checked' : ''} onchange="toggleActivity(${activity.id})">
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

function saveActivity(activityData) {
    if (currentEditId) {
        // Editar actividad existente
        const index = activitiesData.findIndex(activity => activity.id === currentEditId);
        if (index !== -1) {
            activitiesData[index] = { ...activitiesData[index], ...activityData };
        }
    } else {
        // Crear nueva actividad
        const newActivity = {
            id: getNextId(activitiesData),
            ...activityData,
            completed: false
        };
        activitiesData.push(newActivity);
    }
    renderActivities();
    generateCalendar(); // Regenerar calendario para mostrar nuevas actividades
}

function toggleActivity(id) {
    const activity = activitiesData.find(a => a.id === id);
    if (activity) {
        activity.completed = !activity.completed;
        renderActivities();
    }
}

function updateActivityStats() {
    const total = activitiesData.length;
    const completed = activitiesData.filter(a => a.completed).length;
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
    
    form.title.value = activity.title;
    form.description.value = activity.description;
    form.date.value = activity.date;
    form.time.value = activity.time;
    form.priority.value = activity.priority;
    form.category.value = activity.category;
    
    modal.querySelector('.modal-header h3').textContent = 'Editar Actividad';
    openModal('activity-modal');
}

function deleteActivity(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
        activitiesData = activitiesData.filter(activity => activity.id !== id);
        renderActivities();
        generateCalendar(); // Regenerar calendario
    }
}

// ========== FUNCIONES DE CONFIGURACIÓN - MEJORADAS ==========
function loadUserProfile() {
    const savedProfile = JSON.parse(localStorage.getItem('mydaily-profile') || '{}');
    
    // Cargar nombre de usuario guardado
    if (savedProfile.username) {
        const usernameInputs = document.querySelectorAll('#username');
        const usernameDisplays = document.querySelectorAll('.username');
        
        usernameInputs.forEach(input => {
            if (input) input.value = savedProfile.username;
        });
        
        usernameDisplays.forEach(display => {
            if (display) display.textContent = savedProfile.username;
        });
    }
    
    // Cargar avatar guardado
    if (savedProfile.avatar) {
        const userAvatars = document.querySelectorAll('.user-avatar i');
        const avatarOptions = document.querySelectorAll('.avatar-option');
        
        userAvatars.forEach(icon => {
            if (icon) icon.className = `fas fa-${savedProfile.avatar}`;
        });
        
        avatarOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.avatar === savedProfile.avatar);
        });
    }
}

async function saveProfile() {
    const user = await getUser();
    const username = document.getElementById('username').value;
    const avatar = document.querySelector('.avatar-option.active')?.dataset.avatar;
    
    // Guardar en Supabase en lugar de localStorage
    const { error } = await supabase
        .from('configuraciones_usuario')
        .upsert([{
            user_id: user.id,
            avatar: avatar
        }]);
    
    if (error) return alert('Error: ' + error.message);
    
    // Actualizar nombre en auth.users
    await supabase.auth.updateUser({
        data: { full_name: username }
    });
    
    alert('Perfil guardado exitosamente');
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

function deleteAccount() {
    if (confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
        if (confirm('Confirma nuevamente: ¿Eliminar cuenta permanentemente?')) {
            // Limpiar todos los datos
            notesData = [];
            habitsData = [];
            eventsData = [];
            activitiesData = [];
            localStorage.removeItem('mydaily-profile');
            localStorage.removeItem('mydaily-theme');
            
            alert('Cuenta eliminada. Todos los datos han sido borrados.');
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
                alert('Sesión cerrada. En una aplicación real, se redirigiría a la página de login.');
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
            const imageInput = formData.get('image');
            
            const noteData = {
                title: formData.get('title'),
                content: formData.get('content'),
                favorite: formData.get('favorite') === 'on',
                mood: formData.get('mood') || 'sun',
                image: ''
            };
            
            // Manejar imagen si se seleccionó
            if (imageInput && imageInput.size > 0) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    noteData.image = event.target.result;
                    saveNote(noteData);
                };
                reader.readAsDataURL(imageInput);
            } else {
                // Si estamos editando, mantener la imagen existente
                if (currentEditId) {
                    const existingNote = notesData.find(n => n.id === currentEditId);
                    if (existingNote) {
                        noteData.image = existingNote.image;
                    }
                }
                saveNote(noteData);
            }
            
            closeModal('note-modal');
        });
        
        // Event listener para preview de imagen
        const imageInput = noteForm.querySelector('input[type="file"]');
        if (imageInput) {
            imageInput.addEventListener('change', function() {
                handleImageUpload(this, 'image-preview');
            });
        }
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