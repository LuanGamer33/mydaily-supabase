
import { supabase, getUser } from '../supabase.js';

export class HabitsManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.habits = [];
        this.container = document.getElementById('habits-list');
        this.currentEditId = null;
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
        if (!this.container) return;
        this.container.innerHTML = '';
        
        if (this.habits.length === 0) {
            this.container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No tienes hábitos aún. ¡Crea tu primer hábito!</p>';
        } else {
            this.habits.forEach(habit => {
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
                            <input type="checkbox" ${habit.completado_hoy ? 'checked' : ''} data-action="toggle">
                            <span class="checkmark"></span>
                            Completado hoy
                        </label>
                    </div>
                    <div class="item-actions">
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
