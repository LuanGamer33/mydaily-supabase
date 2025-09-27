// js/script.js - Versión corregida para móvil y funcionalidad completa

// Variables globales
let container, registerBtn, loginBtn;

// Función de inicialización segura
function initializeElements() {
    container = document.querySelector('.container');
    registerBtn = document.querySelector('.register-btn');
    loginBtn = document.querySelector('.login-btn');
    
    // Verificar que los elementos existen antes de agregar listeners
    if (registerBtn && container) {
        registerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            container.classList.add('active');
        });
    }
    
    if (loginBtn && container) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            container.classList.remove('active');
        });
    }
}

// Login social con Supabase - Mejorado para móvil
async function loginWith(providerName) {
    try {
        console.log('Intentando login con:', providerName);
        
        // Mostrar loading en el botón
        const socialBtns = document.querySelectorAll('.social-icons a');
        socialBtns.forEach(btn => {
            btn.style.pointerEvents = 'none';
            btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i>';
        });
        
        const redirectUrl = window.location.origin + (window.location.pathname.includes('index.html') ? '/dashboard.html' : '/dashboard.html');
        
        let authResult;
        if (providerName === 'google') {
            authResult = await supabase.auth.signInWithOAuth({ 
                provider: 'google',
                options: { 
                    redirectTo: redirectUrl,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            });
        } else if (providerName === 'github') {
            authResult = await supabase.auth.signInWithOAuth({ 
                provider: 'github',
                options: { 
                    redirectTo: redirectUrl
                }
            });
        }
        
        if (authResult?.error) {
            throw authResult.error;
        }
        
        // En móvil, el OAuth redirige automáticamente
        console.log('OAuth iniciado correctamente');
        
    } catch (error) {
        console.error('Error en login social:', error);
        alert('Error al iniciar sesión con ' + providerName + ': ' + error.message);
        
        // Restaurar botones
        const socialBtns = document.querySelectorAll('.social-icons a');
        socialBtns.forEach((btn, index) => {
            btn.style.pointerEvents = 'auto';
            if (index === 0) btn.innerHTML = '<i class="bx bxl-google"></i>';
            if (index === 1) btn.innerHTML = '<i class="bx bxl-github"></i>';
        });
    }
}

// Función mejorada de validación
function validateForm(formData, isRegistration = false) {
    const email = formData.get('Correo')?.trim();
    const password = formData.get('pass')?.trim();
    
    if (!email || !password) {
        throw new Error('Por favor completa todos los campos obligatorios');
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Por favor ingresa un email válido');
    }
    
    // Validar contraseña
    if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
    
    if (isRegistration) {
        const confirmPassword = formData.get('conf_pass')?.trim();
        const nombre = formData.get('nombre')?.trim();
        const apellido = formData.get('apellido')?.trim();
        const fechaNacimiento = formData.get('fn');
        const sexo = formData.get('sexo');
        const username = formData.get('username')?.trim();
        
        if (!confirmPassword || !nombre || !apellido || !fechaNacimiento || !sexo || !username) {
            throw new Error('Por favor completa todos los campos del registro');
        }
        
        if (password !== confirmPassword) {
            throw new Error('Las contraseñas no coinciden');
        }
        
        if (username.length < 3) {
            throw new Error('El nombre de usuario debe tener al menos 3 caracteres');
        }
    }
    
    return { email, password };
}

// Función para mostrar loading en botones
function setButtonLoading(button, isLoading, originalText) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = `<i class="bx bx-loader-alt bx-spin"></i> ${originalText === 'Ingresar' ? 'Ingresando...' : 'Registrando...'}`;
        button.style.opacity = '0.7';
    } else {
        button.disabled = false;
        button.innerHTML = originalText;
        button.style.opacity = '1';
    }
}

// Inicialización principal
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, inicializando...');
    
    // Inicializar elementos
    initializeElements();
    
    try {
        // Verificar sesión existente
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('Error verificando sesión:', sessionError);
        }
        
        if (session && session.user) {
            console.log('Usuario ya logueado, redirigiendo...');
            window.location.href = 'dashboard.html';
            return;
        }
    } catch (error) {
        console.error('Error verificando sesión:', error);
    }

    // Configurar formulario de login
    const loginForm = document.querySelector('.form-box.login form');
    if (loginForm) {
        console.log('Configurando formulario de login...');
        
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Formulario de login enviado');
            
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                const formData = new FormData(loginForm);
                const { email, password } = validateForm(formData, false);
                
                setButtonLoading(submitBtn, true, originalText);
                
                console.log('Intentando login con email:', email);
                
                const { data, error } = await supabase.auth.signInWithPassword({ 
                    email: email,
                    password: password
                });
                
                if (error) {
                    console.error('Error de Supabase:', error);
                    
                    let errorMessage = 'Error al iniciar sesión: ';
                    if (error.message.includes('Invalid login credentials')) {
                        errorMessage += 'Credenciales incorrectas. Verifica tu email y contraseña.';
                    } else if (error.message.includes('Email not confirmed')) {
                        errorMessage += 'Debes confirmar tu email antes de iniciar sesión.';
                    } else if (error.message.includes('Too many requests')) {
                        errorMessage += 'Demasiados intentos. Espera unos minutos antes de intentar de nuevo.';
                    } else {
                        errorMessage += error.message;
                    }
                    
                    throw new Error(errorMessage);
                }
                
                console.log('Login exitoso:', data);
                
                // Limpiar formulario
                loginForm.reset();
                
                // Redirigir después de un breve delay para que el usuario vea el éxito
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 500);
                
            } catch (error) {
                console.error('Error en login:', error);
                alert(error.message);
                setButtonLoading(submitBtn, false, originalText);
            }
        });
    } else {
        console.error('No se encontró el formulario de login');
    }

    // Configurar formulario de registro
    const regForm = document.querySelector('.form-box.register form');
    if (regForm) {
        console.log('Configurando formulario de registro...');
        
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Formulario de registro enviado');
            
            const submitBtn = regForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                const formData = new FormData(regForm);
                const { email, password } = validateForm(formData, true);
                
                const nombre = formData.get('nombre').trim();
                const apellido = formData.get('apellido').trim();
                const fechaNacimiento = formData.get('fn');
                const sexo = formData.get('sexo');
                const username = formData.get('username').trim();
                
                setButtonLoading(submitBtn, true, originalText);
                
                console.log('Intentando registro con email:', email);
                
                const { data, error } = await supabase.auth.signUp({ 
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: `${nombre} ${apellido}`,
                            username: username,
                            fecha_nacimiento: fechaNacimiento,
                            sexo: sexo,
                            nombre: nombre,
                            apellido: apellido
                        }
                    }
                });
                
                if (error) {
                    console.error('Error de Supabase en registro:', error);
                    
                    let errorMessage = 'Error al registrar la cuenta: ';
                    if (error.message.includes('User already registered')) {
                        errorMessage += 'Este email ya está registrado. Intenta iniciar sesión.';
                    } else if (error.message.includes('Password should be at least')) {
                        errorMessage += 'La contraseña debe tener al menos 6 caracteres.';
                    } else if (error.message.includes('Invalid email')) {
                        errorMessage += 'El formato del email no es válido.';
                    } else {
                        errorMessage += error.message;
                    }
                    
                    throw new Error(errorMessage);
                }
                
                console.log('Registro exitoso:', data);
                
                // Limpiar formulario
                regForm.reset();
                
                // Cambiar a la vista de login
                if (container) {
                    container.classList.remove('active');
                }
                
                // Mostrar mensaje según el estado
                if (data.user && !data.user.email_confirmed_at) {
                    alert('¡Cuenta creada exitosamente!\n\nPor favor revisa tu correo electrónico y haz clic en el enlace de confirmación antes de iniciar sesión.');
                } else {
                    alert('¡Cuenta creada exitosamente! Ya puedes iniciar sesión.');
                }
                
                setButtonLoading(submitBtn, false, originalText);
                
            } catch (error) {
                console.error('Error en registro:', error);
                alert(error.message);
                setButtonLoading(submitBtn, false, originalText);
            }
        });
    } else {
        console.error('No se encontró el formulario de registro');
    }

    // Manejar cambios en el estado de autenticación
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN' && session) {
            console.log('Usuario logueado, redirigiendo a dashboard');
            // Pequeño delay para asegurar que todo esté procesado
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
        
        if (event === 'SIGNED_OUT') {
            console.log('Usuario deslogueado');
        }
    });
    
    // Agregar event listeners para botones sociales
    const socialLinks = document.querySelectorAll('.social-icons a');
    socialLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const provider = link.querySelector('i').classList.contains('bxl-google') ? 'google' : 'github';
            loginWith(provider);
        });
    });
    
    console.log('Inicialización completada');
});

// Función para debug - remover en producción
window.debugAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session:', session);
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user);
};