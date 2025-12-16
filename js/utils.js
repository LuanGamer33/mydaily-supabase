
export const motivationalQuotes = [
    "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
    "La constancia es la clave del éxito.",
    "Cada día es una nueva oportunidad para mejorar.",
    "No cuentes los días, haz que los días cuenten.",
    "El progreso, no la perfección, es lo que importa.",
    "Pequeños pasos cada día conducen a grandes cambios.",
    "Tu único límite eres tú mismo.",
    "Hoy es el día perfecto para comenzar.",
    "La disciplina es el puente entre metas y logros.",
    "Cada momento es una oportunidad para ser mejor.",
    "El mejor momento para plantar un árbol fue hace 20 años. El segundo mejor momento es ahora.",
    "No esperes a que sea fácil, espera a ser más fuerte.",
    "La motivación te pone en marcha, el hábito te mantiene en movimiento.",
    "Haz de cada día tu obra maestra.",
    "El cambio comienza con una decisión.",
    "La vida es corta, haz que cuente.",
    "Enfócate en el progreso, no en la perfección.",
    "Tus hábitos de hoy crean tu futuro de mañana.",
    "Sé la energía que quieres atraer.",
    "Un día a la vez, un paso a la vez."
];

export function getDailyMotivation(userId = 'default') {
    const today = new Date().toDateString();
    
    // Clave única para almacenar en memoria (simulada) o localStorage si quisiéramos persistencia entre recargas
    // Para simplificar y mantener la lógica original:
    const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const userSeed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = (seed + userSeed) % motivationalQuotes.length;
    
    return {
        text: motivationalQuotes[index],
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
}

export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
}
