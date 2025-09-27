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
    alert('Nota guardada exitosamente');
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
        console.error('Error cargando notas:', error);
        return [];
    }

    return data || [];
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
    alert('Lista guardada exitosamente');
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
        console.error('Error cargando listas:', error);
        return [];
    }

    return data || [];
}

async function listarCategorias() {
    const { data, error } = await supabase
        .from('categoria')
        .select('id_cat, nombre')
        .order('nombre');

    if (error) {
        console.error('Error cargando categorías:', error);
        return [];
    }

    return data || [];
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
    alert('Hábito guardado exitosamente');
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
        console.error('Error cargando hábitos:', error);
        return [];
    }

    return data || [];
}

async function insertarEvento(nombre, descripcion, fecha, lugar, prioridad, idCategoria, idRecurrencia, horaInicio, horaFin) {
    const user = await getUser();
    if (!user) return alert('Usuario no autenticado');

    try {
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

        if (calError) throw calError;

        // 2. Insertar en agenda
        const { error: agError } = await supabase
            .from('agenda')
            .insert([{
                hora_i: horaInicio,
                hora_f: horaFin,
                id_cal: calData.id_cal
            }]);

        if (agError) throw agError;
        alert('Evento guardado exitosamente');
        return true;
    } catch (error) {
        alert('Error al guardar evento: ' + error.message);
        return false;
    }
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
        console.error('Error cargando eventos:', error);
        return [];
    }

    return data || [];
}

async function insertarActividad(titulo, descripcion, fecha, hora, prioridad, categoria) {
    const user = await getUser();
    if (!user) return alert('Usuario no autenticado');
    
    try {
        const { error } = await supabase
            .from('actividades')
            .insert([{
                titulo: titulo,
                descripcion: descripcion,
                fecha: fecha,
                hora: hora,
                prioridad: prioridad,
                categoria: categoria,
                completada: false,
                user_id: user.id
            }]);
        
        if (error) throw error;
        alert('Actividad guardada exitosamente');
        return true;
    } catch (error) {
        alert('Error al guardar actividad: ' + error.message);
        return false;
    }
}

async function listarActividades() {
    const user = await getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('actividades')
        .select('id, titulo, descripcion, fecha, hora, prioridad, categoria, completada')
        .eq('user_id', user.id)
        .order('fecha', { ascending: true });

    if (error) {
        console.error('Error cargando actividades:', error);
        return [];
    }

    return data || [];
}