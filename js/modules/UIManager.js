
export class UIManager {
    constructor() {
        this.sidebar = document.querySelector('.sidebar');
        this.overlay = document.getElementById('overlay'); // Asumiendo que existe o se creará
        
        // Inicializar
        this.initSidebar();
        this.setupModalListeners();
    }

    // --- Sidebar & Navigation ---
    initSidebar() {
        if (!this.sidebar) return;

        // Toggle button logic
        const toggleBtn = this.createSidebarToggle();
        if (toggleBtn) {
            this.sidebar.insertBefore(toggleBtn, this.sidebar.firstChild);
            toggleBtn.addEventListener('click', () => this.toggleSidebar());
        }

        // Mobile logo click
        const logo = document.querySelector(".logo");
        if (logo) {
            logo.addEventListener("click", () => this.sidebar.classList.toggle("open"));
        }

        // Click outside to close (mobile)
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
        // Solo mostrar si hay overflow o en ciertas condiciones (lógica simplificada del original)
        return btn;
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('collapsed');
        const toggleBtn = this.sidebar.querySelector('.sidebar-toggle');
        if (toggleBtn) {
            const text = toggleBtn.querySelector('.toggle-text');
            if (this.sidebar.classList.contains('collapsed')) {
                text.textContent = '';
            } else {
                text.textContent = 'Contraer';
            }
        }
    }

    updateActiveMenu() {
        const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.classList.remove('active');
            const href = item.getAttribute('href');
            if (href === currentPage) {
                item.classList.add('active');
            }
        });
    }

    // --- Modals ---
    setupModalListeners() {
        // Close buttons in modals
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) this.closeModal(modal.id);
            });
        });

        // Close on click outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
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
            
            // Reset forms inside
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

    // --- Notifications (Toast/Alerts) ---
    // Refactorizado de alerts.js / main.js
    showToast(message, type = 'info') {
        // Crear elemento toast si no existe estructura global
        // O usar librerías existentes. Aquí implementamos una simple.
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Icono según tipo
        const icon = document.createElement('i');
        icon.className = type === 'success' ? 'fas fa-check-circle' : 
                         type === 'error' ? 'fas fa-times-circle' : 'fas fa-info-circle';
        toast.prepend(icon);

        toastContainer.appendChild(toast);

        // Animación de entrada
        requestAnimationFrame(() => toast.classList.add('show'));

        // Auto eliminar
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // Alias para compatibilidad con código antiguo que use showAlert
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
