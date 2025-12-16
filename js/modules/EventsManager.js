
import { supabase, getUser } from '../supabase.js';

export class EventsManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.events = [];
        this.container = document.querySelector('.events-timeline ul');
        this.currentEditId = null;
    }

    async loadEvents() {
        try {
            const user = await getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('calendario')
                .select(`
                    id_cal,
                    nom,
                    descr,
                    fecha,
                    lugar,
                    prior,
                    id_cat,
                    id_recur,
                    created_at,
                    agenda (id_ag, hora_i, hora_f)
                `)
                .eq('user_id', user.id)
                .order('fecha', { ascending: true });

            if (error) throw error;
            this.events = data || [];
            this.render();
            return this.events;
        } catch (error) {
            console.error('Error loading events:', error);
            return [];
        }
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';

        if (this.events.length === 0) {
            this.container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No tienes eventos aún. ¡Crea tu primer evento!</p>';
            return;
        }

        this.events.forEach(event => {
            const eventItem = document.createElement('li');
            eventItem.className = `event-item ${new Date(event.fecha) < new Date() ? 'past' : 'upcoming'}`;
            
            const eventDate = new Date(event.fecha);
            
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
                        <button data-action="edit" class="edit-btn"><i class="fas fa-edit"></i></button>
                        <button data-action="delete" class="delete-btn"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            
            eventItem.querySelector('button[data-action="edit"]').addEventListener('click', () => this.prepareEdit(event));
            eventItem.querySelector('button[data-action="delete"]').addEventListener('click', () => this.deleteEvent(event.id_cal));

            this.container.appendChild(eventItem);
        });
    }

    async createEvent(eventData) {
        try {
            const user = await getUser();
            if (!user) {
                this.ui.showToast('Usuario no autenticado', 'warning');
                return;
            }

            const prioridadNum = eventData.priority === 'high' ? 3 : eventData.priority === 'medium' ? 2 : 1;

            // 1. Insert into calendar
            const { data: calData, error: calError } = await supabase
                .from('calendario')
                .insert([{
                    nom: eventData.title,
                    descr: eventData.description,
                    fecha: eventData.date,
                    lugar: eventData.location || '',
                    prior: prioridadNum,
                    id_cat: 1, // Default category
                    id_recur: 1, // Default recurrence
                    user_id: user.id
                }])
                .select('id_cal')
                .single();

            if (calError) throw calError;

            // 2. Insert into agenda if time provided
            if (eventData.time) {
                const startTime = eventData.time;
                const endTime = this.addHour(startTime); // Helper to add 1h
                const { error: agError } = await supabase
                    .from('agenda')
                    .insert([{
                        hora_i: startTime,
                        hora_f: endTime,
                        id_cal: calData.id_cal
                    }]);

                if (agError) throw agError;
            }

            this.ui.showToast('Evento creado', 'success');
            await this.loadEvents();
        } catch (error) {
            console.error('Error creating event:', error);
            this.ui.showToast('Error al crear evento: ' + error.message, 'error');
        }
    }

    async deleteEvent(id) {
        if (!confirm('Este evento se eliminará permanentemente. ¿Continuar?')) return;

        try {
            // Agenda should cascade delete usually, but manual delete is safer if constraints aren't set up
            await supabase.from('agenda').delete().eq('id_cal', id);
            const { error } = await supabase.from('calendario').delete().eq('id_cal', id);

            if (error) throw error;
            this.ui.showToast('Evento eliminado correctament', 'success');
            await this.loadEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            this.ui.showToast('No se pudo eliminar el evento', 'error');
        }
    }

    prepareEdit(event) {
        this.currentEditId = event.id_cal;
        const modal = document.getElementById('event-modal');
        if (!modal) return;
        
        const form = modal.querySelector('form');
        if (form) {
            if (form.elements.title) form.elements.title.value = event.nom;
            if (form.elements.description) form.elements.description.value = event.descr;
            if (form.elements.date) form.elements.date.value = event.fecha;
            if (form.elements.location) form.elements.location.value = event.lugar;
            if (event.agenda && event.agenda[0] && form.elements.time) {
                form.elements.time.value = event.agenda[0].hora_i;
            }
        }
        
        // This is a placeholder as edit logic was not fully implemented in original
        this.ui.openModal('event-modal');
    }

    addHour(timeString) {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours) + 1, parseInt(minutes));
        return date.toTimeString().slice(0, 5);
    }
}
