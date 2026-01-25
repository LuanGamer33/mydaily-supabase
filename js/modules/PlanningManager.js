
import { supabase } from '../supabase.js';

export class PlanningManager {
    constructor() {
        this.currentDate = new Date().toISOString().split('T')[0];
        this.timeout = null;
    }

    async loadPlanning(user, date = null) {
        if (!user) return;
        if (date) this.currentDate = date;

        const dateDisplay = document.getElementById('planning-date-display');
        if (dateDisplay) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateDisplay.textContent = new Date(this.currentDate).toLocaleDateString('es-ES', options);
        }
        
        const dateInput = document.getElementById('planning-date-input');
        if(dateInput) dateInput.value = this.currentDate;

        try {
            const { data, error } = await supabase
                .from('planificacion_diaria')
                .select('*')
                .eq('user_id', user.id)
                .eq('fecha', this.currentDate)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 es "No se encontraron filas"

            this.fillForm(data || {});

        } catch (error) {
            console.error('Error loading planning:', error);
            this.fillForm({});
        }
    }

    fillForm(data) {
        const morning = document.getElementById('plan-morning');
        const afternoon = document.getElementById('plan-afternoon');
        const night = document.getElementById('plan-night');
        const notes = document.getElementById('plan-notes');

        if (morning) morning.value = data.texto_manana || '';
        if (afternoon) afternoon.value = data.texto_tarde || '';
        if (night) night.value = data.texto_noche || '';
        if (notes) notes.value = data.notas || '';
    }

    async savePlanning(user) {
        if (!user) return;

        const morning = document.getElementById('plan-morning')?.value;
        const afternoon = document.getElementById('plan-afternoon')?.value;
        const night = document.getElementById('plan-night')?.value;
        const notes = document.getElementById('plan-notes')?.value;

        const planningData = {
            user_id: user.id,
            fecha: this.currentDate,
            texto_manana: morning,
            texto_tarde: afternoon,
            texto_noche: night,
            notas: notes
        };

        try {
            // Upsert: Insertar o Actualizar basado en clave única (user_id, fecha)
            const { error } = await supabase
                .from('planificacion_diaria')
                .upsert(planningData, { onConflict: 'user_id, fecha' });

            if (error) throw error;
            
            this.showSaveIndicator();

        } catch (error) {
            console.error('Error saving planning:', error);
        }
    }
    
    showSaveIndicator() {
        const indicator = document.getElementById('save-indicator');
        if(indicator) {
            indicator.style.opacity = '1';
            indicator.textContent = 'Guardado';
            setTimeout(() => {
                indicator.style.opacity = '0';
            }, 2000);
        }
    }

    setupListeners(user) {
        const inputs = document.querySelectorAll('.planning-input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(this.timeout);
                this.timeout = setTimeout(() => this.savePlanning(user), 1000); // Guardado con rebote
            });
        });
        
        const dateInput = document.getElementById('planning-date-input');
        if(dateInput) {
            dateInput.addEventListener('change', (e) => {
                this.loadPlanning(user, e.target.value);
            });
        }
    }
}
