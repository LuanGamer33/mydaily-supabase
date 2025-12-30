
import { supabase, getUser } from '../supabase.js';

export class HabitsManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.habits = [];
        this.container = document.getElementById('habits-list');
        this.currentEditId = null;
        this.setupListeners();
    }

    setupListeners() {
        const form = document.getElementById('habit-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const habitData = {
                    name: formData.get('name'),
                    description: formData.get('description'),
                    frequency: formData.get('frequency'),
                    // Default values handled in createHabit if not here
                    priority: 'medium' // Default or add field to form
                };

                if (this.currentEditId) {
                    await this.updateHabit(this.currentEditId, habitData);
                } else {
                    await this.createHabit(habitData);
                }
                
                this.ui.closeModal('habit-modal');
            });
        }
    }

    async loadHabits() {
        try {
            const user = await getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('habitos')
                .select('id_hab, nom, hora, prior, descr, racha, progreso_semanal, completado_hoy, created_at')
                .eq('user_id', user.id)
                .order('id_hab', { ascending: false });

            if (error) throw error;
            this.habits = data || [];
            this.render();
            return this.habits;
        } catch (error) {
            console.error('Error loading habits:', error);
            // this.ui.showToast('Error cargando hábitos', 'error'); // Optional: avoid spamming on load
            return [];
        }
    }

    render() {
        if (!this.container) {
            this.container = document.getElementById('habits-list');
        }
    
        if (!this.container) return;
        this.container.innerHTML = '';
        
        if (this.habits.length === 0) {
            this.container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No tienes hábitos aún. ¡Crea tu primer hábito!</p>';
        } else {
            this.habits.forEach(habit => {
                const habitCard = document.createElement('li'); // Changed to li to match activities if using ul, or div. Activities uses li. container is ul?
                // Checking HabitsManager constructor: container is getElementById('habits-list'). habits.html uses div id="habits-list" class="items-grid". Activities uses ul.
                // If habits uses div grid, I should probably switch to ul list or style the div like a list.
                // Let's use div but with "activity-card" class which likely has flex row style.
                
                habitCard.className = `activity-card habit-card ${habit.completado_hoy ? 'completed' : 'pending'}`;
                const progressPercent = Math.round((habit.progreso_semanal / 7) * 100);
                
                // Mimic Activity Layout
                habitCard.innerHTML = `
                    <div class="activity-priority medium" style="background: var(--accent-color);">
                         <i class="fas fa-running" style="color: white;"></i>
                    </div>
                    <div class="activity-content">
                        <h4>${habit.nom}</h4>
                        <p class="activity-description">${habit.descr || 'Sin descripción'}</p>
                        <div class="activity-meta">
                            <span class="activity-date"><i class="fas fa-fire"></i> Racha: ${habit.racha} días</span>
                            <span class="activity-time"><i class="fas fa-chart-line"></i> Progreso: ${habit.progreso_semanal}/7</span>
                        </div>
                    </div>
                    <div class="activity-status">
                        <label class="activity-checkbox">
                            <input type="checkbox" ${habit.completado_hoy ? 'checked' : ''} data-action="toggle">
                            <span class="checkmark"></span>
                        </label>
                    </div>
                    <div class="activity-actions">
                        <button data-action="edit" class="edit-btn"><i class="fas fa-edit"></i></button>
                        <button data-action="delete" class="delete-btn"><i class="fas fa-trash"></i></button>
                    </div>
                `;

                // Listeners
                habitCard.querySelector('input[data-action="toggle"]').addEventListener('change', () => this.toggleHabit(habit.id_hab));
                habitCard.querySelector('button[data-action="edit"]').addEventListener('click', () => this.prepareEdit(habit));
                habitCard.querySelector('button[data-action="delete"]').addEventListener('click', () => this.deleteHabit(habit.id_hab));

                this.container.appendChild(habitCard);
            });
        }
        
        this.updateStats();
    }

    updateStats() {
        const total = this.habits.length;
        const completed = this.habits.filter(h => h.completado_hoy).length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        const totalEl = document.getElementById('total-habits');
        const completedEl = document.getElementById('completed-today');
        const rateEl = document.getElementById('completion-rate');
        
        if (totalEl) totalEl.textContent = total;
        if (completedEl) completedEl.textContent = completed;
        if (rateEl) rateEl.textContent = rate + '%';
    }

    async createHabit(habitData) {
        try {
            const user = await getUser();
            if (!user) {
                this.ui.showToast('Usuario no autenticado', 'warning');
                return;
            }

            // Default values mapping
            const prioridadNum = habitData.priority === 'high' ? 3 : habitData.priority === 'medium' ? 2 : 1;

            const { error } = await supabase
                .from('habitos')
                .insert([{
                    nom: habitData.name,
                    hora: habitData.time || '08:00',
                    prior: prioridadNum,
                    descr: habitData.description,
                    user_id: user.id,
                    racha: 0,
                    progreso_semanal: 0,
                    completado_hoy: false
                }]);

            if (error) throw error;
            this.ui.showToast('Hábito creado', 'success');
            await this.loadHabits();
        } catch (error) {
            console.error('Error creating habit:', error);
            this.ui.showToast('Error al crear hábito: ' + error.message, 'error');
        }
    }

    async updateHabit(id, habitData) {
        try {
            const user = await getUser();
            const { error } = await supabase
                .from('habitos')
                .update({
                    nom: habitData.name,
                    descr: habitData.description,
                    // Add other fields if editable
                })
                .eq('id_hab', id)
                .eq('user_id', user.id);

            if (error) throw error;
            this.ui.showToast('Hábito actualizado', 'success');
            this.currentEditId = null;
            await this.loadHabits();
        } catch (error) {
            console.error('Error updating habit:', error);
            this.ui.showToast('Error al actualizar hábito: ' + error.message, 'error');
        }
    }

    async toggleHabit(id) {
        try {
            const user = await getUser();
            const habit = this.habits.find(h => h.id_hab === id);
            if (!habit) return;

            const nuevoEstado = !habit.completado_hoy;
            let nuevaRacha = habit.racha;
            let nuevoProgreso = habit.progreso_semanal;

            if (nuevoEstado) {
                nuevaRacha = habit.racha + 1;
                nuevoProgreso = Math.min(habit.progreso_semanal + 1, 7);
            } else {
                nuevaRacha = Math.max(habit.racha - 1, 0);
                nuevoProgreso = Math.max(habit.progreso_semanal - 1, 0);
            }

            const { error } = await supabase
                .from('habitos')
                .update({
                    completado_hoy: nuevoEstado,
                    racha: nuevaRacha,
                    progreso_semanal: nuevoProgreso
                })
                .eq('id_hab', id)
                .eq('user_id', user.id);

            if (error) throw error;
            
            // Optimistic update or reload
            await this.loadHabits();
        } catch (error) {
            console.error('Error toggling habit:', error);
            this.ui.showToast('Error al actualizar estado', 'error');
        }
    }

    async deleteHabit(id) {
        // Here we use window.confirm or UIManager.showConfirm if implemented
        if (!confirm('Perderás todo el progreso y racha de este hábito. ¿Eliminar?')) return;

        try {
            const user = await getUser();
            const { error } = await supabase
                .from('habitos')
                .delete()
                .eq('id_hab', id)
                .eq('user_id', user.id);
            
            if (error) throw error;
            this.ui.showToast('Hábito eliminado correctamente', 'success');
            await this.loadHabits();
        } catch (error) {
            console.error('Error deleting habit:', error);
            this.ui.showToast('No se pudo eliminar el hábito', 'error');
        }
    }

    prepareEdit(habit) {
        this.currentEditId = habit.id_hab;
        const modal = document.getElementById('habit-modal');
        if (!modal) return;

        const form = modal.querySelector('form');
        if (form) {
            if (form.elements.name) form.elements.name.value = habit.nom;
            if (form.elements.description) form.elements.description.value = habit.descr;
            // if (form.elements.frequency) form.elements.frequency.value = 'daily';
        }
        this.ui.openModal('habit-modal');
    }
}
