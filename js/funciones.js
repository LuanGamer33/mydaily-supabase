// js/funciones.js
/* ----------  AUXILIAR  ---------- */
async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/* ----------  NOTAS  ---------- */
document.getElementById('form-notas')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nom = document.getElementById('nota-nombre').value.trim();
    const cont = document.getElementById('nota-contenido').value.trim();
    const user = await getUser();
    if (!user) return alert('Usuario no autenticado');
    const { error } = await supabase.from('notas').insert([{ nom, cont, user_id: user.id }]);
    if (error) return alert('Error: ' + error.message);
    e.target.reset();
    cargarNotas();
});

async function cargarNotas() {
    const user = await getUser();
    if (!user) return;
    const { data, error } = await supabase.from('notas').select('*').eq('user_id', user.id).order('id_notas', { ascending: false });
    const div = document.getElementById('lista-notas');
    div.innerHTML = '';
    if (error || !data.length) return div.innerHTML = '<p>No hay notas.</p>';
    data.forEach(n => div.innerHTML += `<div class="nota-card"><h3>${n.nom}</h3><p>${n.cont}</p></div>`);
}

/* ----------  LISTAS  ---------- */
document.getElementById('form-listas')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = await getUser();
    if (!user) return alert('Usuario no autenticado');
    const { error } = await supabase.from('listas').insert([{
        nom: document.getElementById('lista-nom').value.trim(),
        cont: document.getElementById('lista-cont').value.trim(),
        prior: document.getElementById('lista-prior').value,
        user_id: user.id
    }]);
    if (error) return alert('Error: ' + error.message);
    e.target.reset();
    cargarListas();
});

async function cargarListas() {
    const user = await getUser();
    if (!user) return;
    const { data, error } = await supabase.from('listas').select('*').eq('user_id', user.id).order('id_list', { ascending: false });
    const div = document.getElementById('lista-listas');
    div.innerHTML = '';
    if (error || !data.length) return div.innerHTML = '<p>No hay listas.</p>';
    data.forEach(l => div.innerHTML += `<div class="lista-card"><h3>${l.nom}</h3><p>${l.cont}</p><span>Prioridad: ${l.prior}</span></div>`);
}

/* ----------  HÁBITOS  ---------- */
document.getElementById('form-habitos')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = await getUser();
    if (!user) return alert('Usuario no autenticado');
    const { error } = await supabase.from('habitos').insert([{
        nom: document.getElementById('hab-nom').value.trim(),
        hora: document.getElementById('hab-hora').value,
        prior: document.getElementById('hab-prior').value,
        descr: document.getElementById('hab-descr').value.trim(),
        user_id: user.id
    }]);
    if (error) return alert('Error: ' + error.message);
    e.target.reset();
    cargarHabitos();
});

async function cargarHabitos() {
    const user = await getUser();
    if (!user) return;
    const { data, error } = await supabase.from('habitos').select('*').eq('user_id', user.id).order('id_hab', { ascending: false });
    const div = document.getElementById('lista-habitos');
    div.innerHTML = '';
    if (error || !data.length) return div.innerHTML = '<p>No hay hábitos.</p>';
    data.forEach(h => div.innerHTML += `<div class="habito-card"><h3>${h.nom}</h3><p>${h.descr}</p><span>Hora: ${h.hora} – Prioridad: ${h.prior}</span></div>`);
}

/* ----------  EVENTOS + AGENDA  ---------- */
document.getElementById('form-eventos')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = await getUser();
    if (!user) return alert('Usuario no autenticado');

    const { data: cal, error: calErr } = await supabase.from('calendario').insert([{
        nom: document.getElementById('evt-nom').value.trim(),
        descr: document.getElementById('evt-descr').value.trim(),
        fecha: document.getElementById('evt-fecha').value,
        lugar: document.getElementById('evt-lugar').value.trim(),
        prior: document.getElementById('evt-prior').value,
        user_id: user.id
    }]).select('id_cal').single();

    if (calErr) return alert('Error al guardar evento: ' + calErr.message);

    const { error: agErr } = await supabase.from('agenda').insert([{
        hora_i: document.getElementById('evt-hora-i').value,
        hora_f: document.getElementById('evt-hora-f').value,
        id_cal: cal.id_cal
    }]);

    if (agErr) return alert('Error al guardar agenda: ' + agErr.message);
    e.target.reset();
    cargarEventos();
});

async function cargarEventos() {
    const user = await getUser();
    if (!user) return;
    const { data, error } = await supabase
        .from('calendario')
        .select(`
            id_cal,
            nom,
            descr,
            fecha,
            lugar,
            prior,
            agenda ( id_ag, hora_i, hora_f )
        `)
        .eq('user_id', user.id)
        .order('fecha', { ascending: true });

    const div = document.getElementById('lista-eventos');
    div.innerHTML = '';
    if (error || !data.length) return div.innerHTML = '<p>No hay eventos.</p>';
    data.forEach(ev => {
        const ag = ev.agenda[0]; // 1-a-1
        div.innerHTML += `
        <div class="evento-card">
            <h3>${ev.nom}</h3>
            <p>${ev.descr}</p>
            <span>Fecha: ${ev.fecha} | ${ag.hora_i} - ${ag.hora_f}</span>
            <span>Lugar: ${ev.lugar} | Prioridad: ${ev.prior}</span>
        </div>`;
    });
}

/* ----------  AL CARGAR  ---------- */
window.addEventListener('DOMContentLoaded', () => {
    cargarNotas();
    cargarListas();
    cargarHabitos();
    cargarEventos();
});

let mesActual = new Date().getMonth();
let anoActual = new Date().getFullYear();

function generarCalendario(mes, ano) {
    const grid = document.getElementById('cal-grid');
    grid.innerHTML = '';

    const primerDia = new Date(ano, mes, 1).getDay();
    const diasEnMes = new Date(ano, mes + 1, 0).getDate();

  // Días vacíos al inicio
    for (let i = 0; i < primerDia; i++) {
        const vacio = document.createElement('div');
        grid.appendChild(vacio);
    }

  // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
    const div = document.createElement('div');
    div.classList.add('dia');
    div.textContent = dia;

    // Marcar hoy
    const hoy = new Date();
    if (
        dia === hoy.getDate() &&
        mes === hoy.getMonth() &&
        ano === hoy.getFullYear()
    ) {
        div.classList.add('hoy');
    }

        grid.appendChild(div);
    }

    // Actualizar título
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    document.getElementById('mes-actual').textContent = `${meses[mes]} ${ano}`;
}

function cambiarMes(direccion) {
    mesActual += direccion;
    if (mesActual > 11) {
        mesActual = 0;
        anoActual++;
    } else if (mesActual < 0) {
        mesActual = 11;
        anoActual--;
    }
    generarCalendario(mesActual, anoActual);
}

// Inicializar
window.addEventListener('DOMContentLoaded', () => {
    generarCalendario(mesActual, anoActual);
    cargarNotas();
    cargarListas();
    cargarHabitos();
    cargarEventos();
});