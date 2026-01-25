
export class CalendarManager {
    constructor(uiManager, eventsManager, activitiesManager) {
        this.ui = uiManager;
        this.eventsManager = eventsManager;
        this.activitiesManager = activitiesManager;
        
        this.currentDate = new Date(); // Cursor de vista de mes
        this.selectedDate = new Date(); // Cursor de día seleccionado
        
        this.calendarBody = document.getElementById('calendar-body');
        this.currentMonthEl = document.getElementById('current-month');
        this.dateTitleEl = document.getElementById('selected-date-title');
        this.agendaListEl = document.getElementById('agenda-list');
        
        this.events = [];
        this.activities = [];
    }

    async init(user) {
        this.currentUser = user;
        this.setupListeners();
        await this.loadData();
    }

    async loadData() {
        if (!this.currentUser) return;
        
        // Refrescar datos
        // Sabemos que los gestores pueden tener datos, pero aseguremos una carga fresca
        // O podemos confiar en lo que tienen si tienen estado
        // Por ahora, volvamos a buscar para estar seguros y simplificar
        [this.events, this.activities] = await Promise.all([
            this.eventsManager.loadEvents(this.currentUser),
            this.activitiesManager.loadActivities(this.currentUser)
        ]);

        this.renderCalendar();
        this.selectDate(this.selectedDate); // Open info for today/selected
    }

    setupListeners() {
        // Navegación
        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.changeMonth(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.changeMonth(1));

        // Botón de Agregar Evento
        const addBtn = document.getElementById('add-event-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openAddEventModal());
        }

        // Envío de Formulario
        const form = document.getElementById('Calendar-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleCreateEvent(new FormData(form));
            });
        }
    }

    changeMonth(offset) {
        this.currentDate.setMonth(this.currentDate.getMonth() + offset);
        this.renderCalendar();
    }

    renderCalendar() {
        if (!this.calendarBody || !this.currentMonthEl) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        this.currentMonthEl.textContent = `${monthNames[month]} ${year}`;
        this.calendarBody.innerHTML = '';

        const firstDayStr = new Date(year, month, 1).getDay(); // 0 es Domingo
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Ajustar para columna comenzando en Domingo (0) que coincide con JS getDay estándar
        
        // Espacios vacíos
        for (let i = 0; i < firstDayStr; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            this.calendarBody.appendChild(empty);
        }

        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.textContent = day;

            // Cadena de fecha para comparación YYYY-MM-DD
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            
            // Verificar eventos/actividades
            const dayEvents = this.events.filter(e => e.fecha === dateStr);
            const dayActivities = this.activities.filter(a => a.fecha === dateStr && !a.completada);

            if (dayEvents.length > 0 || dayActivities.length > 0) {
                dayEl.classList.add('has-event');
                const indicator = document.createElement('div');
                indicator.className = 'day-indicator';
                
                // Código de colores
                if (dayEvents.length > 0 && dayActivities.length > 0) {
                    indicator.style.background = 'linear-gradient(45deg, #ff9800 50%, #2196f3 50%)';
                } else if (dayEvents.length > 0) {
                    indicator.style.background = '#ff9800';
                } else {
                    indicator.style.background = '#2196f3';
                }
                dayEl.appendChild(indicator);
            }

            // Resaltar Hoy
            if (isCurrentMonth && day === today.getDate()) {
                 dayEl.classList.add('current');
            }

            // Resaltar Seleccionado
            if (this.selectedDate && 
                this.selectedDate.getFullYear() === year && 
                this.selectedDate.getMonth() === month && 
                this.selectedDate.getDate() === day) {
                dayEl.classList.add('selected');
            }

            dayEl.addEventListener('click', () => {
                this.selectedDate = new Date(year, month, day);
                this.renderCalendar(); // Renderizar de nuevo para actualizar estilo de selección
                this.selectDate(this.selectedDate);
            });

            this.calendarBody.appendChild(dayEl);
        }
    }

    selectDate(date) {
        // Actualizar Título
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        if (this.dateTitleEl) {
            this.dateTitleEl.textContent = date.toLocaleDateString('es-ES', options);
            // Capitalizar primera letra
            this.dateTitleEl.textContent = this.dateTitleEl.textContent.charAt(0).toUpperCase() + this.dateTitleEl.textContent.slice(1);
        }

        // Filtrar elementos
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD simple
        // Mejor construcción de cadena local para evitar problemas de zona horaria
        const y = date.getFullYear();
        const m = (date.getMonth()+1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        const localDateStr = `${y}-${m}-${d}`;

        const dayEvents = this.events.filter(e => e.fecha === localDateStr);
        // const dayActivities = this.activities.filter(a => a.fecha === localDateStr);

        this.renderDayList(dayEvents);
    }

    renderDayList(events) {
        if (!this.agendaListEl) return;
        this.agendaListEl.innerHTML = '';

        if (events.length === 0) {
            this.agendaListEl.innerHTML = '<li class="empty-state">No hay eventos para este día</li>';
            return;
        }

        events.forEach(event => {
            const li = document.createElement('li');
            li.className = 'agenda-item';
            li.innerHTML = `
                <div class="agenda-time">
                    ${event.agenda && event.agenda[0] ? event.agenda[0].hora_i : '--:--'}
                </div>
                <div class="agenda-details">
                    <h4>${event.nom}</h4>
                    <p>${event.descr || ''}</p>
                </div>
            `;
            this.agendaListEl.appendChild(li);
        });
    }

    openAddEventModal() {
        const modal = document.getElementById('calendar-modal');
        const form = document.getElementById('Calendar-form');
        
        if (form && this.selectedDate) {
            // Establecer entrada de fecha a la fecha seleccionada
             const y = this.selectedDate.getFullYear();
            const m = (this.selectedDate.getMonth()+1).toString().padStart(2, '0');
            const d = this.selectedDate.getDate().toString().padStart(2, '0');
            
            form.elements.date.value = `${y}-${m}-${d}`;
            form.elements.time.value = '12:00'; // Por defecto
        }

        if (modal) {
             modal.classList.add('active'); // O usar ui.openModal si es consistente
             // Asumiendo alternancia de clase simple basada en estilo de código existente o método ui
             // La aplicación usualmente usa ui.openModal pero podemos hacerlo manualmente o usar this.ui
             this.ui.openModal('calendar-modal');
        }
    }

    async handleCreateEvent(formData) {
        const eventData = {
            title: formData.get('title'),
            description: formData.get('description'),
            date: formData.get('date'),
            time: formData.get('time'),
            location: formData.get('location'),
            priority: 'medium'
        };

        // Reutilizar lógica de EventsManager
        // Sabemos que EventsManager.createEvent maneja inserciones de supabase
        await this.eventsManager.createEvent(eventData);
        
        // Refrescar nuestra vista
        this.ui.closeModal('calendar-modal');
        await this.loadData(); // Volver a buscar todo para sincronizar
    }
}
