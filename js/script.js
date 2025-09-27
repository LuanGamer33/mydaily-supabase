// js/script.js
const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn?.addEventListener('click', () => container.classList.add('active'));
loginBtn?.addEventListener('click', () => container.classList.remove('active'));

// Login social con Supabase
async function loginWith(providerName) {
    try {
        if (providerName === 'google') {
            const { error } = await supabase.auth.signInWithOAuth({ 
                provider: 'google', 
                options: { 
                    redirectTo: window.location.origin + '/dashboard.html'
                } 
            });
            if (error) throw error;
        } else if (providerName === 'github') {
            const { error } = await supabase.auth.signInWithOAuth({ 
                provider: 'github', 
                options: { 
                    redirectTo: window.location.origin + '/dashboard.html'
                } 
            });
            if (error) throw error;
        }
    } catch (error) {
        console.error('Error en login social:', error);
        alert('Error al iniciar sesión: ' + error.message);
    }
}

// Verificar si ya hay una sesión activa al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            window.location.href = 'dashboard.html';
            return;
        }
    } catch (error) {
        console.error('Error verificando sesión:', error);
    }

    // Login
    const loginForm = document.querySelector('.form-box.login form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = loginForm.Correo.value.trim();
            const password = loginForm.pass.value.trim();
            
            if (!email || !password) {
                alert('Por favor completa todos los campos');
                return;
            }
            
            if (!validateEmail(email)) {
                alert('Por favor ingresa un email válido');
                return;
            }
            
            try {
                // Mostrar loading
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Iniciando sesión...';
                submitBtn.disabled = true;
                
                const { data, error } = await supabase.auth.signInWithPassword({ 
                    email, 
                    password 
                });
                
                if (error) {
                    // Restaurar botón
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    
                    if (error.message.includes('Invalid login credentials')) {
                        throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
                    } else if (error.message.includes('Email not confirmed')) {
                        throw new Error('Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
                    } else {
                        throw error;
                    }
                }
                
                // Login exitoso
                console.log('Login exitoso:', data);
                window.location.href = 'dashboard.html';
                
            } catch (error) {
                console.error('Error en login:', error);
                alert('Error: ' + error.message);
                
                // Restaurar botón en caso de error
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                submitBtn.textContent = 'Ingresar';
                submitBtn.disabled = false;
            }
        });
    }

    // Registro
    const regForm = document.querySelector('.form-box.register form');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = regForm.Correo.value.trim();
            const password = regForm.pass.value.trim();
            const confirmPassword = regForm.conf_pass.value.trim();
            const nombre = regForm.nombre.value.trim();
            const apellido = regForm.apellido.value.trim();
            const fechaNacimiento = regForm.fn.value;
            const sexo = regForm.sexo.value;
            const username = regForm.username.value.trim();
            
            // Validaciones
            if (!email || !password || !confirmPassword || !nombre || !apellido || !fechaNacimiento || !sexo || !username) {
                alert('Por favor completa todos los campos');
                return;
            }
            
            if (!validateEmail(email)) {
                alert('Por favor ingresa un email válido');
                return;
            }
            
            if (password !== confirmPassword) {
                alert('Las contraseñas no coinciden');
                return;
            }
            
            if (password.length < 6) {
                alert('La contraseña debe tener al menos 6 caracteres');
                return;
            }
            
            try {
                // Mostrar loading
                const submitBtn = regForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Registrando...';
                submitBtn.disabled = true;
                
                const { data, error } = await supabase.auth.signUp({ 
                    email, 
                    password,
                    options: {
                        data: {
                            full_name: `${nombre} ${apellido}`,
                            username: username,
                            fecha_nacimiento: fechaNacimiento,
                            sexo: sexo
                        }
                    }
                });
                
                if (error) {
                    // Restaurar botón
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    throw error;
                }
                
                // Registro exitoso
                console.log('Registro exitoso:', data);
                
                if (data.user && !data.user.email_confirmed_at) {
                    alert('Usuario creado exitosamente. Por favor revisa tu correo para confirmar tu cuenta antes de iniciar sesión.');
                } else {
                    alert('Usuario creado exitosamente. Puedes iniciar sesión ahora.');
                }
                
                // Limpiar formulario y cambiar a login
                container.classList.remove('active');
                regForm.reset();
                
                // Restaurar botón
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                
            } catch (error) {
                console.error('Error en registro:', error);
                let errorMessage = 'Error al crear la cuenta: ';
                
                if (error.message.includes('User already registered')) {
                    errorMessage += 'Este email ya está registrado.';
                } else if (error.message.includes('Password should be at least 6 characters')) {
                    errorMessage += 'La contraseña debe tener al menos 6 caracteres.';
                } else {
                    errorMessage += error.message;
                }
                
                alert(errorMessage);
                
                // Restaurar botón
                const submitBtn = regForm.querySelector('button[type="submit"]');
                submitBtn.textContent = 'Registrarse';
                submitBtn.disabled = false;
            }
        });
    }

    // Manejar redirección después del login social
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        if (event === 'SIGNED_IN' && session && window.location.pathname.includes('index.html')) {
            window.location.href = 'dashboard.html';
        }
    });
});

// Función para validar email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Función para validar contraseña
function validatePassword(password) {
    // Al menos 6 caracteres
    return password.length >= 6;
}