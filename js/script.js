// js/script.js - Versión mejorada para móvil y autenticación social

// Variables globales
let container, registerBtn, loginBtn;
let isMobile = window.innerWidth <= 768;

// Función de inicialización segura
function initializeElements() {
    container = document.querySelector('.container');
    registerBtn = document.querySelector('.register-btn');
    loginBtn = document.querySelector('.login-btn');

    // Safety: si no hay container, salimos (evita errores)
    if (!container) return;

    // Funciones internas para cambiar entre formularios
    const showRegister = () => {
        container.classList.add('active');
        syncAria();
        if (isMobile) {
            scrollAndFocus('.form-box.register');
        }
    };

    const showLogin = () => {
        container.classList.remove('active');
        syncAria();
        if (isMobile) {
            scrollAndFocus('.form-box.login');
        }
    };

    // Event listeners principales para desktop
    if (registerBtn) registerBtn.addEventListener('click', (e) => { 
        e.preventDefault(); 
        showRegister(); 
    });
    
    if (loginBtn) loginBtn.addEventListener('click', (e) => { 
        e.preventDefault(); 
        showLogin(); 
    });

    // Event listeners para móvil
    document.addEventListener('click', (e) => {
        if (e.target.matches('.register-link') || e.target.closest('.register-link')) {
            e.preventDefault();
            showRegister();
        }
        
        if (e.target.matches('.login-link') || e.target.closest('.login-link')) {
            e.preventDefault();
            showLogin();
        }
    });

    // Forzamos el estado correcto en carga
    syncAria();

    // On resize: detectar cambios de móvil a desktop
    window.addEventListener('resize', () => {
        const wasMobile = isMobile;
        isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== isMobile) {
            // Si cambiamos de móvil a desktop o viceversa
            if (!isMobile) {
                // En desktop, limpiar estilos móviles
                document.querySelectorAll('.form-box').forEach(el => {
                    el.style.transform = '';
                });
            }
            syncAria();
        }
    });

    // Helper: scrollear y poner focus
    function scrollAndFocus(selector) {
        const el = document.querySelector(selector);
        if (!el) return;
        
        // Scrollear al elemento
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        setTimeout(() => {
            // Poner focus en el primer input
            const first = el.querySelector('input:not([type="hidden"]), textarea, select, button');
            if (first) first.focus({ preventScroll: true });
        }, 350);
    }

    // Helper: sincronizar aria-hidden y tabindex (accesibilidad)
    function syncAria() {
        const loginBox = document.querySelector('.form-box.login');
        const regBox = document.querySelector('.form-box.register');
        const activeIsRegister = container.classList.contains('active');

        if (loginBox) {
            loginBox.setAttribute('aria-hidden', activeIsRegister ? 'true' : 'false');
            loginBox.tabIndex = activeIsRegister ? -1 : 0;
        }
        
        if (regBox) {
            regBox.setAttribute('aria-hidden', activeIsRegister ? 'false' : 'true');
            regBox.tabIndex = activeIsRegister ? 0 : -1;
        }
    }

    // Event listeners para botones sociales
    document.addEventListener('click', (e) => {
        if (e.target.matches('.social-btn') || e.target.closest('.social-btn')) {
            e.preventDefault();
            const btn = e.target.closest('.social-btn');
            const provider = btn.dataset.provider;
            if (provider) {
                loginWith(provider, btn);
            }
        }
    });
}

// Login social con Supabase - Mejorado para redirección directa
async function loginWith(providerName, buttonElement = null) {
    try {
        showMessage('Iniciando sesión...', 'info');
        
        if (buttonElement) {
            buttonElement.classList.add('loading');
        }

        console.log('Intentando login con:', providerName);
        
        // Configurar opciones de redirección
        const redirectOptions = {
            redirectTo: window.location.origin + '/index.html'
        };

        let authResponse;
        
        switch (providerName) {
            case 'google':
                authResponse = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: redirectOptions
                });
                break;
                
            case 'github':
                authResponse = await supabase.auth.signInWithOAuth({
                    provider: 'github',
                    options: redirectOptions
                });
                break;
                
            default:
                throw new Error('Proveedor no soportado: ' + providerName);
        }

        if (authResponse.error) {
            throw authResponse.error;
        }

        // Si todo va bien, el usuario será redirigido automáticamente
        // No necesitamos hacer nada más aquí
        
    } catch (error) {
        console.error('Error en login social:', error);
        showMessage('Error al iniciar sesión: ' + error.message, 'error');
        
        if (buttonElement) {
            buttonElement.classList.remove('loading');
        }
    }
}

// Función para manejar el login tradicional
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const email = formData.get('Correo');
    const password = formData.get('pass');
    
    if (!email || !password) {
        showMessage('Por favor completa todos los campos', 'error');
        return;
    }
    
    try {
        showMessage('Iniciando sesión...', 'info');
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        if (data.user) {
            showMessage('¡Bienvenido!', 'success');
            // Redirigir después de un breve retraso para mostrar el mensaje
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        showMessage('Error: ' + error.message, 'error');
    }
}

// Función para manejar el registro
async function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const email = formData.get('Correo');
    const password = formData.get('pass');
    const confirmPassword = formData.get('conf_pass');
    const nombre = formData.get('nombre');
    const apellido = formData.get('apellido');
    const username = formData.get('username');
    const fechaNacimiento = formData.get('fn');
    const genero = formData.get('genero');
    
    // Validaciones
    if (!email || !password || !confirmPassword || !nombre || !apellido || !username || !fechaNacimiento || !genero) {
        showMessage('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    try {
        showMessage('Registrando usuario...', 'info');
        
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    nombre: nombre,
                    apellido: apellido,
                    username: username,
                    fecha_nacimiento: fechaNacimiento,
                    genero: genero
                }
            }
        });
        
        if (error) {
            throw error;
        }
        
        if (data.user) {
            showMessage('¡Registro exitoso! Por favor verifica tu correo electrónico.', 'success');
            // Limpiar el formulario
            form.reset();
            // Cambiar a login después de 2 segundos
            setTimeout(() => {
                container.classList.remove('active');
                syncAria();
            }, 2000);
        }
        
    } catch (error) {
        console.error('Error en registro:', error);
        showMessage('Error: ' + error.message, 'error');
    }
}

// Función para mostrar mensajes
function showMessage(text, type = 'info') {
    const messageEl = document.getElementById('message');
    if (!messageEl) return;
    
    messageEl.textContent = text;
    messageEl.className = `message ${type} show`;
    
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 3000);
}

// Función para verificar si el usuario ya está autenticado
async function checkAuthStatus() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Si ya está autenticado, redirigir al dashboard
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error('Error verificando autenticación:', error);
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    checkAuthStatus();
    
    // Agregar event listeners a los formularios
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Prevenir el envío de formularios con Enter en campos de contraseña
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.target.type === 'password') {
            const form = e.target.closest('form');
            if (form) {
                const submitBtn = form.querySelector('.btn[type="submit"]');
                if (submitBtn) {
                    e.preventDefault();
                    submitBtn.click();
                }
            }
        }
    });
});

// Manejar el estado de autenticación cuando cambia
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);
    
    if (event === 'SIGNED_IN') {
        showMessage('¡Bienvenido!', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }
    
    if (event === 'SIGNED_OUT') {
        // El usuario cerró sesión
        console.log('Usuario cerró sesión');
    }
    
    if (event === 'USER_UPDATED') {
        // El usuario fue actualizado
        console.log('Usuario actualizado');
    }
});