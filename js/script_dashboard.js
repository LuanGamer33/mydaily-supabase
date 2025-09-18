// js/script_dashboard.js
const userInfo = document.getElementById('user-info');

// Proteger dashboard
supabase.auth.onAuthStateChange((event, session) => {
if (!session) window.location.href = '../index.html';
    else userInfo.textContent = `Hola, ${session.user.user_metadata.full_name || session.user.email}`;
});

// Cerrar sesión
function logout() {
supabase.auth.signOut().then(() => {
    localStorage.removeItem('id_us');
    window.location.href = '../index.html';
});
}

// Guardar nota
async function guardarNota() {
    const titulo = document.getElementById('nota-nombre').value.trim();
    const contenido = document.getElementById('nota-contenido').value.trim();
    if (!titulo || !contenido) return alert('Completa todos los campos');

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
    .from('notas')
    .insert([{ nom: titulo, cont: contenido, user_id: user.id }]);
    if (error) return alert('Error al guardar: ' + error.message);

    document.getElementById('resultado').innerText = 'Nota guardada';
    document.getElementById('nota-nombre').value = '';
    document.getElementById('nota-contenido').value = '';
    cargarNotas();
}

// Cargar notas
async function cargarNotas() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
    .from('notas')
    .select('id, nom, cont')
    .order('created_at', { ascending: false });
    if (error) return console.error(error);

    const lista = document.getElementById('lista-notas');
    lista.innerHTML = '';
    if (!data.length) lista.innerHTML = '<p>No tienes notas guardadas.</p>';
    data.forEach(nota => {
    const card = document.createElement('div');
    card.className = 'nota-card';
    card.innerHTML = `<h3>${nota.nom}</h3><p>${nota.cont}</p>`;
    lista.appendChild(card);
    });
}

// Al entrar
cargarNotas();