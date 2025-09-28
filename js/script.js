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
}

// Login social con Supabase - Mejorado para redirección directa
async function loginWith(providerName, buttonElement = null) {
    try {
        showMessage('Conectando con ' + (providerName === 'google' ? 'Google' : 'GitHub') + '...', 'info');
        
        if (buttonElement) {
            buttonElement.classList.add('loading');
            buttonElement.disabled = true;
        }

        console.log('Intentando login con:', providerName);
        
        // Configurar opciones de redirección
        const redirectOptions = {
            redirectTo: window.location.origin + '/dashboard.html'
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
        showMessage('Error al conectar con ' + (providerName === 'google' ? 'Google' : 'GitHub') + ': ' + error.message, 'error');
        
        if (buttonElement) {
            buttonElement.classList.remove('loading');
            buttonElement.disabled = false;
        }
    }
}

// Función para manejar el login tradicional
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('.btn[type="submit"]');
    const formData = new FormData(form);
    const email = formData.get('Correo')?.trim();
    const password = formData.get('pass');
    
    // Limpiar mensajes anteriores
    hideMessage();
    
    // Validaciones básicas
    if (!email || !password) {
        showMessage('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('Por favor ingresa un correo electrónico válido', 'error');
        return;
    }
    
    try {
        // Mostrar estado de carga
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Iniciando sesión...';
        }
        
        showMessage('Verificando credenciales...', 'info');
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            // Mensajes de error más amigables
            let errorMessage = 'Error al iniciar sesión';
            
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Correo o contraseña incorrectos';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Por favor verifica tu correo electrónico antes de iniciar sesión';
            } else if (error.message.includes('Too many requests')) {
                errorMessage = 'Demasiados intentos. Espera unos minutos antes de intentar nuevamente';
            } else if (error.message.includes('network')) {
                errorMessage = 'Error de conexión. Verifica tu internet';
            }
            
            throw new Error(errorMessage);
        }
        
        if (data.user) {
            showMessage('¡Bienvenido de vuelta!', 'success');
            
            // Limpiar el formulario
            form.reset();
            
            // Redirigir después de un breve retraso
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        showMessage(error.message, 'error');
    } finally {
        // Restaurar estado del botón
        if (submitBtn) {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Ingresar';
        }
    }
}

// Función para manejar el registro
async function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('.btn[type="submit"]');
    const formData = new FormData(form);
    
    const email = formData.get('Correo')?.trim();
    const password = formData.get('pass');
    const confirmPassword = formData.get('conf_pass');
    const nombre = formData.get('nombre')?.trim();
    const apellido = formData.get('apellido')?.trim();
    const username = formData.get('username')?.trim();
    const fechaNacimiento = formData.get('fn');
    const genero = formData.get('genero');
    
    // Limpiar mensajes anteriores
    hideMessage();
    
    // Validaciones completas
    const validationError = validateRegistrationData({
        email, password, confirmPassword, nombre, apellido, username, fechaNacimiento, genero
    });
    
    if (validationError) {
        showMessage(validationError, 'error');
        return;
    }
    
    try {
        // Mostrar estado de carga
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Registrando...';
        }
        
        showMessage('Creando tu cuenta...', 'info');
        
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: `${nombre} ${apellido}`,
                    username: username,
                    fecha_nacimiento: fechaNacimiento,
                    genero: genero,
                    nombre: nombre,
                    apellido: apellido
                }
            }
        });
        
        if (error) {
            // Mensajes de error más amigables
            let errorMessage = 'Error al registrarse';
            
            if (error.message.includes('already registered')) {
                errorMessage = 'Este correo ya está registrado. Intenta iniciar sesión';
            } else if (error.message.includes('Password should be at least')) {
                errorMessage = 'La contraseña debe tener al menos 6 caracteres';
            } else if (error.message.includes('Invalid email')) {
                errorMessage = 'Por favor ingresa un correo electrónico válido';
            } else if (error.message.includes('signup is disabled')) {
                errorMessage = 'El registro está temporalmente deshabilitado';
            }
            
            throw new Error(errorMessage);
        }
        
        if (data.user) {
            if (data.user.email_confirmed_at) {
                // El usuario está confirmado, puede iniciar sesión inmediatamente
                showMessage('¡Cuenta creada exitosamente! Bienvenido a MyDaily', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            } else {
                // El usuario necesita confirmar su email
                showMessage('¡Registro exitoso! Te hemos enviado un correo de verificación. Por favor revisa tu bandeja de entrada y spam.', 'success');
                
                // Limpiar el formulario y cambiar a login
                form.reset();
                setTimeout(() => {
                    container.classList.remove('active');
                    syncAria();
                    showMessage('Ya puedes iniciar sesión después de verificar tu correo', 'info');
                }, 3000);
            }
        }
        
    } catch (error) {
        console.error('Error en registro:', error);
        showMessage(error.message, 'error');
    } finally {
        // Restaurar estado del botón
        if (submitBtn) {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrarse';
        }
    }
}

// Función para validar datos de registro
function validateRegistrationData(data) {
    const { email, password, confirmPassword, nombre, apellido, username, fechaNacimiento, genero } = data;
    
    // Validar campos requeridos
    if (!email || !password || !confirmPassword || !nombre || !apellido || !username || !fechaNacimiento || !genero) {
        return 'Por favor completa todos los campos';
    }
    
    // Validar email
    if (!isValidEmail(email)) {
        return 'Por favor ingresa un correo electrónico válido';
    }
    
    // Validar contraseñas
    if (password !== confirmPassword) {
        return 'Las contraseñas no coinciden';
    }
    
    if (password.length < 6) {
        return 'La contraseña debe tener al menos 6 caracteres';
    }
    
    // Validar nombres
    if (nombre.length < 2) {
        return 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (apellido.length < 2) {
        return 'El apellido debe tener al menos 2 caracteres';
    }
    
    if (username.length < 3) {
        return 'El nombre de usuario debe tener al menos 3 caracteres';
    }
    
    // Validar fecha de nacimiento
    const birthDate = new Date(fechaNacimiento);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 12) {
        return 'Debes tener al menos 12 años para registrarte';
    }
    
    if (age > 120) {
        return 'Por favor ingresa una fecha de nacimiento válida';
    }
    
    return null; // No hay errores
}

// Función para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función para mostrar mensajes mejorada
function showMessage(text, type = 'info') {
    const messageEl = document.getElementById('message');
    if (!messageEl) return;
    
    // Limpiar clases anteriores
    messageEl.className = 'message';
    
    // Agregar nueva clase y contenido
    messageEl.textContent = text;
    messageEl.classList.add(type, 'show');
    
    // Auto-ocultar después de un tiempo (excepto para errores que requieren acción del usuario)
    if (type !== 'error') {
        setTimeout(() => {
            hideMessage();
        }, type === 'success' ? 4000 : 3000);
    } else {
        // Los errores se ocultan después de más tiempo
        setTimeout(() => {
            hideMessage();
        }, 6000);
    }
}

// Función para ocultar mensajes
function hideMessage() {
    const messageEl = document.getElementById('message');
    if (messageEl) {
        messageEl.classList.remove('show');
    }
}

// Función para verificar si el usuario ya está autenticado
async function checkAuthStatus() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Si ya está autenticado, redirigir al dashboard
            console.log('Usuario ya autenticado, redirigiendo...');
            showMessage('Ya tienes una sesión activa', 'info');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        // No mostrar error al usuario, es normal que no esté autenticado
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    checkAuthStatus();
    configureDateLimits();
    
    // Agregar event listeners a los formularios
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Event listeners para botones sociales
    document.addEventListener('click', (e) => {
        if (e.target.matches('a[onclick*="loginWith"]') || e.target.closest('a[onclick*="loginWith"]')) {
            e.preventDefault();
            const link = e.target.closest('a[onclick*="loginWith"]') || e.target;
            const provider = link.querySelector('i').classList.contains('bxl-google') ? 'google' : 'github';
            loginWith(provider, link);
        }
    });
    
    // Manejar Enter en campos de contraseña
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && (e.target.type === 'password' || e.target.type === 'email')) {
            const form = e.target.closest('form');
            if (form) {
                const submitBtn = form.querySelector('.btn[type="submit"]');
                if (submitBtn && !submitBtn.disabled) {
                    e.preventDefault();
                    submitBtn.click();
                }
            }
        }
    });
    
    // Limpiar mensajes cuando el usuario empiece a escribir
    document.addEventListener('input', function(e) {
        if (e.target.matches('input, textarea')) {
            const messageEl = document.getElementById('message');
            if (messageEl && messageEl.classList.contains('error')) {
                hideMessage();
            }
        }
    });
});

// Manejar el estado de autenticación cuando cambia
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);
    
    if (event === 'SIGNED_IN') {
        showMessage('¡Sesión iniciada correctamente!', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }
    
    if (event === 'SIGNED_OUT') {
        console.log('Usuario cerró sesión');
    }
    
    if (event === 'USER_UPDATED') {
        console.log('Usuario actualizado');
    }
    
    if (event === 'TOKEN_REFRESHED') {
        console.log('Token renovado');
    }
});

// Helper para sincronizar aria (necesario para las funciones internas)
function syncAria() {
    if (!container) return;
    
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

// Función para configurar límites de fecha de nacimiento
function configureDateLimits() {
    const dateInput = document.querySelector('input[name="fn"]');
    if (dateInput) {
        const today = new Date();
        const maxDate = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());
        const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
        
        dateInput.max = maxDate.toISOString().split('T')[0];
        dateInput.min = minDate.toISOString().split('T')[0];
    }
}