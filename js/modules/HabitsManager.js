
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
            // Manejo de frecuencia
            const freqSelect = form.querySelector('#habit-frequency');
            const daysDiv = form.querySelector('#frequency-days');
            const customDiv = form.querySelector('#frequency-custom');

            if (freqSelect) {
                // Función para actualizar visibilidad
                const updateVisibility = () => {
                    const val = freqSelect.value;
                    if (daysDiv) daysDiv.style.display = (val === 'weekly') ? 'block' : 'none';
                    if (customDiv) customDiv.style.display = (val === 'custom') ? 'block' : 'none';
                    
                    const monthlyDiv = form.querySelector('#frequency-monthly');
                    const yearlyDiv = form.querySelector('#frequency-yearly');
                    
                    if (monthlyDiv) monthlyDiv.style.display = (val === 'monthly') ? 'block' : 'none';
                    if (yearlyDiv) yearlyDiv.style.display = (val === 'yearly') ? 'block' : 'none';
                };

                // Listener y actualización inicial
                freqSelect.addEventListener('change', updateVisibility);
                updateVisibility(); // Correr al iniciar para asegurar estado correcto
            }

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                
                // Construir objeto de configuración de frecuencia
                const frequencyType = formData.get('frequency');
                const config = { type: frequencyType };
                
                if (frequencyType === 'weekly') {
                    // Obtener días seleccionados (checkboxes con mismo nombre 'days')
                    const selectedDays = [...form.querySelectorAll('input[name="days"]:checked')].map(cb => parseInt(cb.value));
                    config.days = selectedDays;
                } else if (frequencyType === 'monthly') {
                    config.day = parseInt(formData.get('month_day'));
                } else if (frequencyType === 'yearly') {
                    config.month = parseInt(formData.get('year_month'));
                    config.day = parseInt(formData.get('year_day'));
                } else if (frequencyType === 'custom') {
                    config.interval = parseInt(formData.get('custom_interval'));
                }

                const habitData = {
                    name: formData.get('name'),
                    description: formData.get('description'),
                    frequency: frequencyType,
                    frequency_config: config, // Nuevo campo
                    priority: 'medium'
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

    async loadHabits(user) {
        try {
            const currentUser = user || await getUser();
            if (!currentUser) return [];

            const { data, error } = await supabase
                .from('habitos')
                .select('id_hab, nom, hora, prior, descr, racha, progreso_semanal, completado_hoy, created_at, frecuencia_config, last_completed_date')
                .eq('user_id', currentUser.id)
                .order('id_hab', { ascending: false });

            if (error) throw error;
            
            // Procesar hábitos para verificar si el estado 'completado_hoy' es válido para la fecha actual
            const todayStr = new Date().toISOString().split('T')[0];
            
            this.habits = (data || []).map(habit => {
                // Si la última fecha completada no es hoy, visualmente reiniciamos.
                // En una app más compleja, podríamos actualizar la DB aquí, pero basta con mostrarlo bien.
                const isCompletedToday = habit.last_completed_date === todayStr;
                
                // Si en DB dice completado pero la fecha no coincide, forzamos false visualmente
                // Nota: Racha se mantiene, solo el checkbox se reinicia
                return {
                    ...habit,
                    completado_hoy: isCompletedToday
                };
            });
            
            this.render();
            return this.habits;
        } catch (error) {
            console.error('Error loading habits:', error);
            return [];
        }
    }

    async render() {
        if (!this.container) {
            this.container = document.getElementById('habits-list');
        }
        
        if (!this.container) {
             if (window.location.pathname.includes('habits.html')) {
                 console.error("Error: Container #habits-list not found in habits.html");
             }
             return;
        }

        this.container.innerHTML = '';
        
        if (this.habits.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-seedling"></i>
                    <p>No tienes hábitos activos. ¡Crea uno nuevo!</p>
                </div>
            `;
            return;
        }    
        this.habits.forEach(habit => {
                const habitCard = document.createElement('div');
                habitCard.className = `activity-card habit-card ${habit.completado_hoy ? 'completed' : 'pending'}`;
                
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

                habitCard.querySelector('input[data-action="toggle"]').addEventListener('change', () => this.toggleHabit(habit.id_hab));
                habitCard.querySelector('button[data-action="edit"]').addEventListener('click', () => this.prepareEdit(habit));
                habitCard.querySelector('button[data-action="delete"]').addEventListener('click', () => this.deleteHabit(habit.id_hab));

                this.container.appendChild(habitCard);
            });
        
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

            const prioridadNum = habitData.priority === 'high' ? 3 : habitData.priority === 'medium' ? 2 : 1;

            const { data, error } = await supabase
                .from('habitos')
                .insert([{
                    nom: habitData.name,
                    hora: habitData.time || '08:00',
                    prior: prioridadNum,
                    descr: habitData.description,
                    user_id: user.id,
                    racha: 0,
                    progreso_semanal: 0,
                    completado_hoy: false,
                    frecuencia_config: habitData.frequency_config,
                    last_completed_date: null // Inicializar fecha
                }])
                .select();

            if (error) {
                console.error("Supabase create error:", error);
                throw error;
            }

            this.ui.showToast('Hábito creado', 'success');
            await this.loadHabits(user);
        } catch (error) {
            console.error('Error creating habit:', error);
            if (error.message && error.message.includes('frecuencia_config')) {
                 this.ui.showToast('Error: BD desactualizada. Ejecuta la migración.', 'error');
            } else {
                 this.ui.showToast('Error al crear hábito: ' + error.message, 'error');
            }
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
                    frecuencia_config: habitData.frequency_config
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

            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            let nuevoEstado = !habit.completado_hoy;
            let nuevaRacha = habit.racha;
            let nuevoProgreso = habit.progreso_semanal;
            let newLastCompletedDate = habit.last_completed_date;

            if (nuevoEstado) {
                // Marcar como completado
                if (habit.last_completed_date === yesterdayStr) {
                    // Continuar racha
                    nuevaRacha++;
                } else if (habit.last_completed_date === todayStr) {
                    // Ya estaba completado hoy (click bug?), no sumar
                } else {
                    // Racha rota o nuevo inicio
                    nuevaRacha = 1;
                }
                newLastCompletedDate = todayStr;
                nuevoProgreso = Math.min(habit.progreso_semanal + 1, 7);
            } else {
                // Desmarcar
                if (habit.last_completed_date === todayStr) {
                     // Solo bajamos racha si fue completado hoy
                     nuevaRacha = Math.max(habit.racha - 1, 0);
                     // Restaurar fecha anterior es difícil sin historial, 
                     // pero si racha > 0, asumimos ayer.
                     newLastCompletedDate = (nuevaRacha > 0) ? yesterdayStr : null;
                }
                nuevoProgreso = Math.max(habit.progreso_semanal - 1, 0);
            }

            const { error } = await supabase
                .from('habitos')
                .update({
                    completado_hoy: nuevoEstado,
                    racha: nuevaRacha,
                    progreso_semanal: nuevoProgreso,
                    last_completed_date: newLastCompletedDate
                })
                .eq('id_hab', id)
                .eq('user_id', user.id);

            if (error) throw error;
            
            await this.loadHabits();
        } catch (error) {
            console.error('Error toggling habit:', error);
            this.ui.showToast('Error al actualizar estado', 'error');
        }
    }


    async deleteHabit(id) {
        // Aquí usamos window.confirm o UIManager.showConfirm si está implementado
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
