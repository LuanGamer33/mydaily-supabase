
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
            // Optimización: usar usuario pasado si existe, sino buscarlo
            const currentUser = user || await getUser();
            if (!currentUser) return [];

            const { data, error } = await supabase
                .from('habitos')
                .select('id_hab, nom, hora, prior, descr, racha, progreso_semanal, completado_hoy, created_at, frecuencia_config') // Incluir nuevo campo
                .eq('user_id', currentUser.id)
                .order('id_hab', { ascending: false });

            if (error) throw error;
            this.habits = data || [];
            this.render();
            return this.habits;
        } catch (error) {
            console.error('Error loading habits:', error);
            // this.ui.showToast('Error cargando hábitos', 'error'); // Opcional: evitar spam al cargar
            return [];
        }
    }

    async render() {
        if (!this.container) {
            this.container = document.getElementById('habits-list');
        }
        
        if (!this.container) {
             // Si no encuentro el container, puede que estemos en otra página. 
             // Loguear solo si estamos en habits.html
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
                // Cambiado a li para coincidir con actividades si se usa ul, o div. Actividades usa li. ¿el contenedor es ul?
                // Revisando constructor de HabitsManager: container es getElementById('habits-list'). habits.html usa div id="habits-list" class="items-grid". Actividades usa ul.
                // Si hábitos usa div grid, probablemente debería cambiar a ul lista o estilar el div como lista.
                // Usemos div pero con clase "activity-card" que probablemente tiene estilo flex row.
                
                const habitCard = document.createElement('div'); // Define habitCard here
                habitCard.className = `activity-card habit-card ${habit.completado_hoy ? 'completed' : 'pending'}`;
                const progressPercent = Math.round((habit.progreso_semanal / 7) * 100);
                
                // Imitar diseño de Actividad
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

            // Mapeo de valores por defecto
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
                    frecuencia_config: habitData.frequency_config // Guardar configuración
                }])
                .select(); // IMPORTANTE: Select para devolver datos insertados y verificar

            if (error) {
                console.error("Supabase create error:", error);
                throw error;
            }
            
            if (!data || data.length === 0) {
                 console.warn("No data returned from insert. RLS policy might be blocking select.");
                 // Aunque RLS bloquee select, si no hubo error, se insertó.
            }

            this.ui.showToast('Hábito creado', 'success');
            await this.loadHabits(user); // Pasar usuario explícitamente para evitar recarga
        } catch (error) {
            console.error('Error creating habit:', error);
            // Mensaje amigable si falla por columna faltante
            if (error.message && error.message.includes('frecuencia_config')) {
                 this.ui.showToast('Error: Base de datos desactualizada. Ejecuta la migración SQL.', 'error');
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
                    // Agregar otros campos si son editables
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
            
            // Actualización optimista o recarga
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
