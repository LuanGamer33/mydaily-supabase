// ========== SISTEMA DE ALERTAS Y CONFIRMACIONES PERSONALIZADAS ==========

// Función para mostrar alerta personalizada (reemplaza alert())
function showAlert(message, type = 'info') {
    return new Promise((resolve) => {
        // Crear overlay
        const overlay = document.createElement('div');
        overlay.className = 'custom-alert-overlay';
        
        // Crear modal
        const alertBox = document.createElement('div');
        alertBox.className = `custom-alert-box ${type}`;
        
        // Determinar icono según tipo
        let icon = '';
        switch(type) {
            case 'success':
                icon = '<i class="fas fa-check-circle"></i>';
                break;
            case 'error':
                icon = '<i class="fas fa-exclamation-circle"></i>';
                break;
            case 'warning':
                icon = '<i class="fas fa-exclamation-triangle"></i>';
                break;
            default:
                icon = '<i class="fas fa-info-circle"></i>';
        }
        
        alertBox.innerHTML = `
            <div class="custom-alert-icon">${icon}</div>
            <div class="custom-alert-message">${message}</div>
            <div class="custom-alert-buttons">
                <button class="custom-alert-btn custom-alert-btn-primary">Aceptar</button>
            </div>
        `;
        
        overlay.appendChild(alertBox);
        document.body.appendChild(overlay);
        
        // Animación de entrada
        setTimeout(() => {
            overlay.classList.add('show');
            alertBox.classList.add('show');
        }, 10);
        
        // Manejar click en botón
        const acceptBtn = alertBox.querySelector('.custom-alert-btn-primary');
        acceptBtn.addEventListener('click', () => {
            closeAlert(overlay, alertBox, resolve);
        });
        
        // Cerrar con ESC
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeAlert(overlay, alertBox, resolve);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    });
}

// Función para mostrar confirmación personalizada (reemplaza confirm())
function showConfirm(message, options = {}) {
    return new Promise((resolve) => {
        const {
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            type = 'warning',
            title = '¿Estás seguro?'
        } = options;
        
        // Crear overlay
        const overlay = document.createElement('div');
        overlay.className = 'custom-alert-overlay';
        
        // Crear modal
        const alertBox = document.createElement('div');
        alertBox.className = `custom-alert-box ${type}`;
        
        // Determinar icono según tipo
        let icon = '';
        switch(type) {
            case 'danger':
                icon = '<i class="fas fa-trash-alt"></i>';
                break;
            case 'warning':
                icon = '<i class="fas fa-exclamation-triangle"></i>';
                break;
            default:
                icon = '<i class="fas fa-question-circle"></i>';
        }
        
        alertBox.innerHTML = `
            <div class="custom-alert-icon">${icon}</div>
            <div class="custom-alert-title">${title}</div>
            <div class="custom-alert-message">${message}</div>
            <div class="custom-alert-buttons">
                <button class="custom-alert-btn custom-alert-btn-secondary">${cancelText}</button>
                <button class="custom-alert-btn custom-alert-btn-primary">${confirmText}</button>
            </div>
        `;
        
        overlay.appendChild(alertBox);
        document.body.appendChild(overlay);
        
        // Animación de entrada
        setTimeout(() => {
            overlay.classList.add('show');
            alertBox.classList.add('show');
        }, 10);
        
        // Manejar clicks
        const cancelBtn = alertBox.querySelector('.custom-alert-btn-secondary');
        const confirmBtn = alertBox.querySelector('.custom-alert-btn-primary');
        
        cancelBtn.addEventListener('click', () => {
            closeAlert(overlay, alertBox, () => resolve(false));
        });
        
        confirmBtn.addEventListener('click', () => {
            closeAlert(overlay, alertBox, () => resolve(true));
        });
        
        // Cerrar con ESC = cancelar
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeAlert(overlay, alertBox, () => resolve(false));
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        // Click en overlay = cancelar
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeAlert(overlay, alertBox, () => resolve(false));
            }
        });
    });
}

// Función auxiliar para cerrar alertas
function closeAlert(overlay, alertBox, callback) {
    alertBox.classList.remove('show');
    overlay.classList.remove('show');
    
    setTimeout(() => {
        overlay.remove();
        if (callback) callback(true);
    }, 300);
}

// Función para mostrar notificación toast (no bloquea la UI)
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-times-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
