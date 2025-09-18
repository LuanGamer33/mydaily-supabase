// js/script.js
const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener('click', () => container.classList.add('active'));
loginBtn.addEventListener('click', () => container.classList.remove('active'));

// Login social con Supabase
async function loginWith(providerName) {
  if (providerName === 'google') {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
    options: {
    redirectTo: window.location.origin + '/dashboard.html'
  }
  } else if (providerName === 'github') {
    await supabase.auth.signInWithOAuth({ provider: 'github' });
    options: {
    redirectTo: window.location.origin + '/dashboard.html'
  }
  }
  // La redirección la gestiona Supabase → volverá a index.html
}

// Formulario clásico (email/pass) – DOM que ya tienes
document.addEventListener('DOMContentLoaded', () => {
  // Login
  const loginForm = document.querySelector('.form-box.login form');
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.Correo.value.trim();
    const pass = loginForm.pass.value.trim();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) return alert('Error: ' + error.message);
    window.location.href = '../dashboard.html';
  });

  // Registro
  const regForm = document.querySelector('.form-box.register form');
  regForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = regForm.Correo.value.trim();
    const pass = regForm.pass.value.trim();
    const nombre = regForm.nombre.value.trim();
    if (pass !== regForm.conf_pass.value.trim()) return alert('Las contraseñas no coinciden');
    const { data, error } = await supabase.auth.signUp({ email, password: pass });
    if (error) return alert('Error: ' + error.message);
    // Opcional: actualizar perfil con nombre
    await supabase.auth.updateUser({ data: { full_name: nombre } });
    alert('Usuario creado – revisa tu correo');
    container.classList.remove('active');
  });

});
