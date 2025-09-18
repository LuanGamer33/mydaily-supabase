// js/supabase.js
const SUPABASE_URL = 'https://rhnmqipfrzmxjuybzhqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobm1xaXBmcnpteGp1eWJ6aHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjAyNjAsImV4cCI6MjA3MzczNjI2MH0.xTIpvfQmqTuDte5BVE1DHEEcntyV1G6IScMatq_YHAE'; // la clave del paso 1

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

async function insertarNota(titulo, contenido) {
    const user = await getUser();
    if (!user) return alert('Usuario no autenticado');

    const { error } = await supabase
    .from('notas')
    .insert([{ nom: titulo, cont: contenido, user_id: user.id }]);

    if (error) return alert('Error al guardar nota: ' + error.message);
    alert('Nota guardada');
}

async function listarNotas() {
    const user = await getUser();
    if (!user) return [];

    const { data, error } = await supabase
    .from('notas')
    .select('id_notas, nom, cont')
    .eq('user_id', user.id)
    .order('id_notas', { ascending: false });

    if (error) {
        console.error(error);
        return [];
    }

    return data;
}

async function insertarLista(nombre, contenido, prioridad, idCategoria, idRecurrencia) {
    const user = await getUser();
    if (!user) return alert('Usuario no autenticado');

    const { error } = await supabase
    .from('listas')
    .insert([{
        nom: nombre,
        cont: contenido,
        prior: prioridad,
        id_cat: idCategoria,
        id_rec: idRecurrencia,
        user_id: user.id
    }]);

    if (error) return alert('Error al guardar lista: ' + error.message);
    alert('Lista guardada');
}

async function listarListas() {
    const user = await getUser();
    if (!user) return [];

    const { data, error } = await supabase
    .from('listas')
    .select('id_list, nom, cont, complt, prior, id_cat, id_rec')
    .eq('user_id', user.id)
    .order('id_list', { ascending: false });

    if (error) {
        console.error(error);
        return [];
    }

    return data;
}

async function listarCategorias() {
    const { data, error } = await supabase
    .from('categoria')
    .select('id_cat, nombre')
    .order('nombre');

    if (error) {
        console.error(error);
        return [];
    }

    return data;
}

async function insertarHabito(nombre, hora, prioridad, descripcion) {
    const user = await getUser();
    if (!user) return alert('Usuario no autenticado');

    const { error } = await supabase
        .from('habitos')
        .insert([{
            nom: nombre,
            hora: hora,
            prior: prioridad,
            descr: descripcion,
            user_id: user.id
        }]);

    if (error) return alert('Error al guardar hábito: ' + error.message);
    alert('Hábito guardado');
}

async function listarHabitos() {
    const user = await getUser();
    if (!user) return [];

    const { data, error } = await supabase
    .from('habitos')
    .select('id_hab, nom, hora, prior, descr')
    .eq('user_id', user.id)
    .order('id_hab', { ascending: false });

    if (error) {
        console.error(error);
        return [];
    }

    return data;
}

async function insertarEvento(nombre, descripcion, fecha, lugar, prioridad, idCategoria, idRecurrencia, horaInicio, horaFin) {
    const user = await getUser();
    if (!user) return alert('Usuario no autenticado');

  // 1. Insertar en calendario
    const { data: calData, error: calError } = await supabase
        .from('calendario')
        .insert([{
        nom: nombre,
        descr: descripcion,
        fecha: fecha,
        lugar: lugar,
        prior: prioridad,
        id_cat: idCategoria,
        id_recur: idRecurrencia,
        user_id: user.id
        }])
    .select('id_cal')
    .single();

    if (calError) return alert('Error al guardar evento: ' + calError.message);

  // 2. Insertar en agenda
    const { error: agError } = await supabase
        .from('agenda')
        .insert([{
        hora_i: horaInicio,
        hora_f: horaFin,
        id_cal: calData.id_cal
        }]);

    if (agError) return alert('Error al guardar agenda: ' + agError.message);
    alert('Evento y agenda guardados');
}

async function listarEventos() {
    const user = await getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('calendario')
        .select(`
            id_cal,
            nom,
            descr,
            fecha,
            lugar,
            prior,
            id_cat,
            id_recur,
            agenda (id_ag, hora_i, hora_f)
        `)
    .eq('user_id', user.id)
    .order('fecha', { ascending: true });

    if (error) {
        console.error(error);
        return [];
    }

    return data;
}

