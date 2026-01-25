import { AuthManager } from './modules/AuthManager.js';
import { UIManager } from './modules/UIManager.js';

const ui = new UIManager();
const auth = new AuthManager(ui);

// Al iniciar, verificar si tenemos sesión (Supabase auto-loguea con magic link)
// o si hay un hash de recuperación en la URL.
// Si no, redirigir al login.
auth.init().then(async () => {
     // Pequeño delay para asegurar que la sesión se cargue si viene del magic link
     setTimeout(() => {
         if (!auth.isAuthenticated()) {
             // Intento de verificar hash manualmente si init no lo pescó (edge cases)
             const hash = window.location.hash;
             if (!hash || (!hash.includes('type=recovery') && !hash.includes('access_token'))) {
                 console.warn("No recovery session found, redirecting...");
                 // window.location.href = 'index.html'; // Comentado para evitar loops en dev si algo falla, pero debería estar activo.
             }
         }
     }, 1000);
});

document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = e.target.password.value;
    const confirm = e.target.confirm_password.value;
    const btn = e.target.querySelector('button');

    if (password !== confirm) {
        ui.showToast('Las contraseñas no coinciden', 'error');
        return;
    }
    
    try {
        btn.disabled = true;
        btn.textContent = 'Actualizando...';
        
        await auth.updateUserPassword(password);
        
        // Redirección manejada en AuthManager o aquí tras éxito
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error(error);
        btn.disabled = false;
        btn.textContent = 'Actualizar Contraseña';
    }
});
