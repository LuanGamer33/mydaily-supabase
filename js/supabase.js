const SUPABASE_URL = 'https://rhnmqipfrzmxjuybzhqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobm1xaXBmcnpteGp1eWJ6aHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjAyNjAsImV4cCI6MjA3MzczNjI2MH0.xTIpvfQmqTuDte5BVE1DHEEcntyV1G6IScMatq_YHAE';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Función para cerrar sesión
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Redirigir al login
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión: ' + error.message);
    }
}

// ========== FUNCIONES PARA NOTAS ==========
async function insertarNota(titulo, contenido, imagen = '', estadoAnimo = 'sun', favorita = false) {
    const user = await getUser();
    if (!user) return alert('Usuario no autenticado');

    const { error } = await supabase
        .from('notas')
        .insert([{ 
            nom: titulo, 
            cont: contenido, 
            user_id: user.id,
            imagen: imagen,
            estado_animo: estadoAnimo,
            favorita: favorita
        }]);

    if (error) return alert('Error al guardar nota: ' + error.message);
    return true;
}

async function listarNotas() {
    const user = await getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('notas')
        .select('id_notas, nom, cont, imagen, estado_animo, favorita, created_at')
        .eq('user_id', user.id)
        .order('id_notas', { ascending: false });

    if (error) {
        console.error('Error cargando notas:', error);
        return [];
    }

    return data || [];
}

async function actualizarNota(id, datos) {
    const user = await getUser();
    if (!user) return alert('Usuario no autenticado');

    const { error } = await supabase
        .from('notas')
        .update(datos)
        .eq('id_notas', id)
        .eq('user_id', user.id);

    if (error) return alert('Error al actualizar nota: ' + error.message);
    return true;
}

async function eliminarNota(id) {
    const user = await getUser();
    if (!user) return false;

    const { error } = await supabase
        .from('notas')
        .delete()
        .eq('id_notas', id)
        .eq('user_id', user.id);

    if (error) {
        alert('Error al eliminar nota: ' + error.message);
        return false;
    }
    return true;
}

// ========== FUNCIONES PARA HÁBITOS ==========
async function insertarHabito(nombre, hora, prioridad, descripcion) {
    const user = await getUser();
    if (!user) return alert('Usuario no autenticado');

    // Convertir prioridad de string a integer según tu esquema
    const prioridadNum = prioridad === 'high' ? 3 : prioridad === 'medium' ? 2 : 1;

    const { error } = await supabase
        .from('habitos')
        .insert([{
            nom: nombre,
            hora: hora,
            prior: prioridadNum,
            descr: descripcion,
            user_id: user.id,
            racha: 0,
            progreso_semanal: 0,
            completado_hoy: false
        }]);

    if (error) return alert('Error al guardar hábito: ' + error.message);
    return true;
}

async function listarHabitos() {
    const user = await getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('habitos')
        .select('id_hab, nom, hora, prior, descr, racha, progreso_semanal, completado_hoy, created_at')
        .eq('user_id', user.id)
        .order('id_hab', { ascending: false });

    if (error) {
        console.error('Error cargando hábitos:', error);
        return [];
    }

    return data || [];
}

async function actualizarHabito(id, datos) {
    const user = await getUser();
    if (!user) return alert('Usuario no autenticado');

    const { error } = await supabase
        .from('habitos')
        .update(datos)
        .eq('id_hab', id)
        .eq('user_id', user.id);

    if (error) return alert('Error al actualizar hábito: ' + error.message);
    return true;
}

async function toggleHabitoCompletado(id) {
    const user = await getUser();
    if (!user) return false;

    // Primero obtener el estado actual
    const { data: habit, error: fetchError } = await supabase
        .from('habitos')
        .select('completado_hoy, racha, progreso_semanal')
        .eq('id_hab', id)
        .eq('user_id', user.id)
        .single();

    if (fetchError) {
        console.error('Error obteniendo hábito:', fetchError);
        return false;
    }

    const nuevoEstado = !habit.completado_hoy;
    let nuevaRacha = habit.racha;
    let nuevoProgreso = habit.progreso_semanal;

    if (nuevoEstado) {
        nuevaRacha = habit.racha + 1;
        nuevoProgreso = Math.min(habit.progreso_semanal + 1, 7);
    } else {
        nuevaRacha = Math.max(habit.racha - 1, 0);
        nuevoProgreso = Math.max(habit.progreso_semanal - 1, 0);
    }

    const { error } = await supabase
        .from('habitos')
        .update({
            completado_hoy: nuevoEstado,
            racha: nuevaRacha,
            progreso_semanal: nuevoProgreso
        })
        .eq('id_hab', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error actualizando hábito:', error);
        return false;
    }
    
    return true;
}

// ========== FUNCIONES PARA EVENTOS/CALENDARIO ==========
async function insertarEvento(nombre, descripcion, fecha, lugar, prioridad, idCategoria, idRecurrencia, horaInicio, horaFin) {
    const user = await getUser();
    if (!user) return alert('Usuario no autenticado');

    // Convertir prioridad de string a integer
    const prioridadNum = prioridad === 'high' ? 3 : prioridad === 'medium' ? 2 : 1;

    try {
        // 1. Insertar en calendario
        const { data: calData, error: calError } = await supabase
            .from('calendario')
            .insert([{
                nom: nombre,
                descr: descripcion,
                fecha: fecha,
                lugar: lugar || '',
                prior: prioridadNum,
                id_cat: idCategoria || 1,
                id_recur: idRecurrencia || 1,
                user_id: user.id
            }])
            .select('id_cal')
            .single();

        if (calError) throw calError;

        // 2. Insertar en agenda si se proporcionaron horas
        if (horaInicio && horaFin) {
            const { error: agError } = await supabase
                .from('agenda')
                .insert([{
                    hora_i: horaInicio,
                    hora_f: horaFin,
                    id_cal: calData.id_cal
                }]);

            if (agError) throw agError;
        }
        
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
            created_at,
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

// ========== FUNCIONES PARA ACTIVIDADES ==========
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
        .select('id, titulo, descripcion, fecha, hora, prioridad, categoria, completada, created_at')
        .eq('user_id', user.id)
        .order('fecha', { ascending: true });

    if (error) {
        console.error('Error cargando actividades:', error);
        return [];
    }

    return data || [];
}

async function toggleActividadCompletada(id) {
    const user = await getUser();
    if (!user) return false;

    // Primero obtener el estado actual
    const { data: activity, error: fetchError } = await supabase
        .from('actividades')
        .select('completada')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (fetchError) {
        console.error('Error obteniendo actividad:', fetchError);
        return false;
    }

    const nuevoEstado = !activity.completada;

    const { error } = await supabase
        .from('actividades')
        .update({ completada: nuevoEstado })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error actualizando actividad:', error);
        return false;
    }
    
    return true;
}

// ========== FUNCIONES PARA LISTAS ==========
async function insertarLista(nombre, contenido, prioridad, idCategoria, idRecurrencia) {
    const user = await getUser();
    if (!user) return alert('Usuario no autenticado');

    // Convertir prioridad de string a integer
    const prioridadNum = prioridad === 'high' ? 3 : prioridad === 'medium' ? 2 : 1;

    const { error } = await supabase
        .from('listas')
        .insert([{
            nom: nombre,
            cont: contenido,
            prior: prioridadNum,
            id_cat: idCategoria || 1,
            id_rec: idRecurrencia || 1,
            user_id: user.id
        }]);

    if (error) return alert('Error al guardar lista: ' + error.message);
    return true;
}

async function listarListas() {
    const user = await getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('listas')
        .select('id_list, nom, cont, complt, prior, id_cat, id_rec, created_at')
        .eq('user_id', user.id)
        .order('id_list', { ascending: false });

    if (error) {
        console.error('Error cargando listas:', error);
        return [];
    }

    return data || [];
}

// ========== FUNCIONES PARA CATEGORÍAS ==========
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

// ========== FUNCIONES PARA CONFIGURACIONES DE USUARIO ==========
async function obtenerConfiguracionUsuario() {
    const user = await getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('configuraciones_usuario')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') { // Ignorar error si no hay configuración
        console.error('Error cargando configuraciones:', error);
        return null;
    }

    return data;
}

async function guardarConfiguracionUsuario(configuracion) {
    const user = await getUser();
    if (!user) {
        alert('Usuario no autenticado');
        return false;
    }

    try {
        // Primero verificar si existe un registro para este usuario
        const { data: existing, error: fetchError } = await supabase
            .from('configuraciones_usuario')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            // PGRST116 = registro no encontrado, otros errores sí importan
            throw fetchError;
        }

        let result;
        if (existing) {
            // Si existe, actualizar
            result = await supabase
                .from('configuraciones_usuario')
                .update({
                    avatar: configuracion.avatar,
                    tema: configuracion.tema
                })
                .eq('user_id', user.id);
        } else {
            // Si no existe, insertar
            result = await supabase
                .from('configuraciones_usuario')
                .insert([{
                    user_id: user.id,
                    avatar: configuracion.avatar,
                    tema: configuracion.tema
                }]);
        }

        if (result.error) throw result.error;
        
        return true;
    } catch (error) {
        console.error('Error detallado:', error);
        alert('Error al guardar configuración: ' + error.message);
        return false;
    }
}

// ========== FUNCIONES DE UTILIDAD ==========
async function eliminarTodosLosDatosUsuario() {
    const user = await getUser();
    if (!user) return false;

    try {
        // Eliminar todos los datos del usuario en paralelo
        const promises = [
            supabase.from('notas').delete().eq('user_id', user.id),
            supabase.from('habitos').delete().eq('user_id', user.id),
            supabase.from('actividades').delete().eq('user_id', user.id),
            supabase.from('listas').delete().eq('user_id', user.id),
            supabase.from('configuraciones_usuario').delete().eq('user_id', user.id)
        ];

        // Para eventos, primero eliminar agenda, luego calendario
        const { data: eventos } = await supabase
            .from('calendario')
            .select('id_cal')
            .eq('user_id', user.id);

        if (eventos && eventos.length > 0) {
            const eventIds = eventos.map(e => e.id_cal);
            promises.push(
                supabase.from('agenda').delete().in('id_cal', eventIds),
                supabase.from('calendario').delete().eq('user_id', user.id)
            );
        }

        await Promise.all(promises);
        return true;
    } catch (error) {
        console.error('Error eliminando datos del usuario:', error);
        return false;
    }
}