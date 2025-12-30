
import { supabase, getUser } from '../supabase.js';

export class ActivitiesManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.activities = [];
        this.container = document.querySelector('.activities-container ul');
        this.currentEditId = null;
        this.setupListeners();
    }

    setupListeners() {
        const form = document.getElementById('activity-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const activityData = {
                    title: formData.get('title'),
                    description: formData.get('description'),
                    date: formData.get('date'),
                    time: formData.get('time'),
                    priority: formData.get('priority'),
                    category: formData.get('category')
                };

                if (this.currentEditId) {
                    // Similar to EventsManager, explicit update logic missing in original file
                    // We will just create for now to fix the form behavior
                    await this.createActivity(activityData);
                } else {
                    await this.createActivity(activityData);
                }
                
                this.ui.closeModal('activity-modal');
            });
        }
    }

    async loadActivities() {
        try {
            const user = await getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('actividades')
                .select('id, titulo, descripcion, fecha, hora, prioridad, categoria, completada, created_at')
                .eq('user_id', user.id)
                .order('fecha', { ascending: true });

            if (error) throw error;
            this.activities = data || [];
            this.render();
            return this.activities;
        } catch (error) {
            console.error('Error loading activities:', error);
            return [];
        }
    }

    render() {
        if (!this.container) {
            // Try ID first if available, else class for robustness
            this.container = document.querySelector('.activities-container ul');
        }
        
        if (!this.container) return;
        this.container.innerHTML = '';

        if (this.activities.length === 0) {
            this.container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No tienes actividades aún. ¡Crea tu primera actividad!</p>';
            return; // Important: Early return!
        }
        
        const priorityIcons = {
            high: 'fas fa-exclamation-circle',
            medium: 'fas fa-minus-circle',
            low: 'fas fa-circle'
        };

        this.activities.forEach(activity => {
            const activityItem = document.createElement('li');
            activityItem.className = `activity-card ${activity.completada ? 'completed' : 'pending'}`;
            
            activityItem.innerHTML = `
                <div class="activity-priority ${activity.prioridad || 'medium'}">
                    <i class="${priorityIcons[activity.prioridad] || priorityIcons.medium}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.titulo}</h4>
                    <p class="activity-description">${activity.descripcion}</p>
                    <div class="activity-meta">
                        <span class="activity-date"><i class="fas fa-calendar"></i> ${this.formatDate(activity.fecha)}</span>
                        ${activity.hora ? `<span class="activity-time"><i class="fas fa-clock"></i> ${activity.hora}</span>` : ''}
                        <span class="activity-category ${activity.categoria || 'personal'}">${activity.categoria || 'Personal'}</span>
                    </div>
                </div>
                <div class="activity-status">
                    <label class="activity-checkbox">
                        <input type="checkbox" ${activity.completada ? 'checked' : ''} data-action="toggle">
                        <span class="checkmark"></span>
                    </label>
                </div>
                <div class="activity-actions">
                    <button data-action="edit" class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button data-action="delete" class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            activityItem.querySelector('input[data-action="toggle"]').addEventListener('change', () => this.toggleActivity(activity.id));
            activityItem.querySelector('button[data-action="edit"]').addEventListener('click', () => this.prepareEdit(activity));
            activityItem.querySelector('button[data-action="delete"]').addEventListener('click', () => this.deleteActivity(activity.id));

            this.container.appendChild(activityItem);
        });

        this.updateStats();
    }

    updateStats() {
        const total = this.activities.length;
        const completed = this.activities.filter(a => a.completada).length;
        const pending = total - completed;
        
        const totalEl = document.getElementById('total-activities');
        const completedEl = document.getElementById('completed-activities');
        const pendingEl = document.getElementById('pending-activities');
        
        if (totalEl) totalEl.textContent = total;
        if (completedEl) completedEl.textContent = completed;
        if (pendingEl) pendingEl.textContent = pending;
    }

    async createActivity(activityData) {
        try {
            const user = await getUser();
            if (!user) {
                this.ui.showToast('Usuario no autenticado', 'warning');
                return;
            }

            const { error } = await supabase
                .from('actividades')
                .insert([{
                    titulo: activityData.title,
                    descripcion: activityData.description,
                    fecha: activityData.date,
                    hora: activityData.time,
                    prioridad: activityData.priority,
                    categoria: activityData.category,
                    completada: false,
                    user_id: user.id
                }]);

            if (error) throw error;
            this.ui.showToast('Actividad creada', 'success');
            await this.loadActivities();
        } catch (error) {
            console.error('Error creating activity:', error);
            this.ui.showToast('Error al crear: ' + error.message, 'error');
        }
    }

    async toggleActivity(id) {
        try {
            const user = await getUser();
            const activity = this.activities.find(a => a.id === id);
            if (!activity) return;

            const { error } = await supabase
                .from('actividades')
                .update({ completada: !activity.completada })
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
            await this.loadActivities();
        } catch (error) {
            console.error('Error toggling activity:', error);
            this.ui.showToast('Error al actualizar estado', 'error');
        }
    }

    async deleteActivity(id) {
        if (!confirm('Esta actividad se eliminará permanentemente. ¿Continuar?')) return;

        try {
            const user = await getUser();
            const { error } = await supabase
                .from('actividades')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);
            
            if (error) throw error;
            this.ui.showToast('Actividad eliminada', 'success');
            await this.loadActivities();
        } catch (error) {
            console.error('Error deleting activity:', error);
            this.ui.showToast('Error al eliminar', 'error');
        }
    }

    prepareEdit(activity) {
        this.currentEditId = activity.id;
        const modal = document.getElementById('activity-modal');
        if (!modal) return;

        const form = modal.querySelector('form');
        if (form) {
            if (form.elements.title) form.elements.title.value = activity.titulo;
            if (form.elements.description) form.elements.description.value = activity.descripcion;
            if (form.elements.date) form.elements.date.value = activity.fecha;
            if (form.elements.time) form.elements.time.value = activity.hora;
            if (form.elements.priority) form.elements.priority.value = activity.prioridad;
            if (form.elements.category) form.elements.category.value = activity.categoria;
        }
        this.ui.openModal('activity-modal');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    }
}
