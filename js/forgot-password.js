import { AuthManager } from './modules/AuthManager.js';
import { UIManager } from './modules/UIManager.js';

const ui = new UIManager();
const auth = new AuthManager(ui);

document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const btn = e.target.querySelector('button');
    
    try {
        btn.disabled = true;
        btn.textContent = 'Enviando...';
        
        await auth.sendPasswordReset(email);
        
        // Feedback visual y limpieza
        e.target.reset();
        
    } catch (error) {
        console.error(error);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Enviar Enlace';
    }
});
