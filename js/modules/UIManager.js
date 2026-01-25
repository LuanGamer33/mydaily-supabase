
export class UIManager {
    constructor() {
        this.sidebar = document.querySelector('.sidebar');
        this.overlay = document.getElementById('overlay'); // Asumiendo que existe o se creará
        
        // Inicializar
        this.initSidebar();
        this.setupModalListeners();
    }

    // --- Barra lateral y Navegación ---
    initSidebar() {
        if (!this.sidebar) return;

        // Lógica del botón de alternancia
        // Buscamos si ya existe el botón en el DOM (globalmente)
        this.toggleBtn = document.querySelector('.sidebar-toggle');

        if (!this.toggleBtn) {
            // Si no existe, lo creamos y lo agregamos al sidebar (fallback)
            this.toggleBtn = this.createSidebarToggle();
            this.sidebar.insertBefore(this.toggleBtn, this.sidebar.firstChild);
        }
        
        // Agregar listener
        this.toggleBtn.addEventListener('click', (e) => {
            // Prevenir comportamiento default por si acaso está dentro de un form o es link
            e.preventDefault(); 
            this.toggleSidebar();
        });

        // Clic en logo móvil
        const logo = document.querySelector(".logo");
        if (logo) {
            logo.addEventListener("click", () => this.sidebar.classList.toggle("open"));
        }

        // Clic afuera para cerrar (móvil)
        document.addEventListener("click", (e) => {
            if (this.sidebar.classList.contains("open") &&
                !this.sidebar.contains(e.target) &&
                !logo.contains(e.target)) {
                this.sidebar.classList.remove("open");
            }
        });

        this.updateActiveMenu();
    }

    createSidebarToggle() {
        const btn = document.createElement('button');
        btn.className = 'sidebar-toggle';
        btn.innerHTML = '<i class="fas fa-bars"></i><span class="toggle-text">Contraer</span>';
        return btn;
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('collapsed');
        
        if (this.toggleBtn) {
            const text = this.toggleBtn.querySelector('.toggle-text');
            if (text) {
                if (this.sidebar.classList.contains('collapsed')) {
                    text.textContent = '';
                } else {
                    text.textContent = 'Menú';
                }
            }
        }
    }

    updateActiveMenu() {
        const path = window.location.pathname;
        const page = path.split("/").pop();
        // Normalizar para root o index
        const currentPage = (page === "" || page === "index.html") ? "dashboard.html" : page;

        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.classList.remove('active');
            const href = item.getAttribute('href');
            
            // Comparación simple, puede mejorarse si rutas son complejas
            if (href === currentPage) {
                item.classList.add('active');
            }
        });
    }

    // --- Modales ---
    setupModalListeners() {
        // Botones de cerrar en modales
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) this.closeModal(modal.id);
            });
        });

        // Cerrar al hacer clic afuera
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Legado/Hidratación: Manejar botones 'onclick' antiguos para abrir modales
        // Nota: Usamos el texto del onclick para identificar el propósito ya que no podemos seleccionar por 'onclick' de forma segura si CSP lo bloquea,
        // pero la selección simple de atributos funciona para hidratación antes de que el usuario haga clic.
        
        const modalMap = {
            'Note': 'note-modal',
            'Habit': 'habit-modal',
            'Event': 'event-modal',
            'Activity': 'activity-modal'
        };

        Object.keys(modalMap).forEach(key => {
            const selector = `[onclick*="open${key}Modal"]`;
            document.querySelectorAll(selector).forEach(el => {
                el.removeAttribute('onclick'); // Eliminar manejador antiguo
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openModal(modalMap[key]);
                });
            });
        });

        // Cierre general
        document.querySelectorAll('[onclick="closeModal()"], [onclick^="closeModal("]').forEach(el => {
             // Extraer ID si está presente como closeModal('id')
             const onClickText = el.getAttribute('onclick');
             let targetId = null;
             if (onClickText && onClickText.includes("'")) {
                 targetId = onClickText.split("'")[1];
             }
             
             el.removeAttribute('onclick');
             el.addEventListener('click', (e) => {
                 e.preventDefault();
                 if (targetId) {
                     this.closeModal(targetId);
                 } else {
                     // Intentar encontrar modal padre
                     const modal = el.closest('.modal');
                     if (modal) {
                         this.closeModal(modal.id);
                     }
                 }
             });
        });
        
        // También manejar botones 'Cancelar' dentro de formularios, mayormente solo cerrar
        document.querySelectorAll('button:not([type="submit"])').forEach(btn => {
            if (btn.textContent.trim() === 'Cancelar') {
                 // ¿Verificar si ya tiene un listener? Difícil de saber.
                 // Pero usualmente solo cierran el modal.
                 btn.addEventListener('click', (e) => {
                     const modal = btn.closest('.modal');
                     if (modal) {
                         e.preventDefault();
                         this.closeModal(modal.id);
                     }
                 });
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        } else {
            console.error(`Modal ${modalId} not found`);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
            
            // Resetear formularios dentro
            const forms = modal.querySelectorAll('form');
            forms.forEach(form => {
                form.reset();
                const imgPreview = form.querySelector('#image-preview, .image-preview');
                if (imgPreview) {
                    imgPreview.style.display = 'none';
                    imgPreview.src = '';
                }
            });
        }
    }

    // --- Notificaciones (Toast/Alertas) ---
    // Refactorizado de alerts.js / main.js
    // Refactorizado para usar el estilo original de alerts.js (.message)
    showToast(message, type = 'info') {
        let messageEl = document.getElementById('message');
        
        // Auto-create element if missing (fixes missing div in dashboard pages)
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'message';
            document.body.appendChild(messageEl);
        }

        // Limpiar timeout anterior si existe
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }

        // Resetear clases y contenido
        // Usamos 'custom-toast' que está definido en messages.css
        // En index.html se debe incluir messages.css o usar 'message' de styles.css
        // Para consistencia, estandarizamos a 'custom-toast' y aseguramos que messages.css se cargue.
        messageEl.className = 'custom-toast'; 
        
        // Icono según tipo (opcional, si el CSS lo soporta o si agregamos HTML)
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        
        messageEl.innerHTML = `${icons[type] || ''} <span>${message}</span>`;
        
        // Agregar tipo y mostrar
        messageEl.classList.add(type, 'show');

        // Configurar auto-ocultado
        const duration = type === 'error' ? 6000 : (type === 'success' ? 4000 : 3000);

        this.messageTimeout = setTimeout(() => {
            messageEl.classList.remove('show');
        }, duration);
    }
    
    // Alias para compatibilidad
    showAlert(message, type) {
        this.showToast(message, type);
    }

    async showConfirm(message, options = {}) {
        return new Promise((resolve) => {
            // Implementación simple de confirmación custom o usar window.confirm
            // Para mantener la estética, deberíamos usar un modal custom.
            // Por simplicidad en este paso, usaremos confirm nativo pero encapsulado
            // O idealmente reconstruir el modal de confirmación de alerts.js
            
            // TODO: Implementar modal visual real si alerts.js lo tenía
            const result = window.confirm(message); 
            resolve(result);
        });
    }
}
