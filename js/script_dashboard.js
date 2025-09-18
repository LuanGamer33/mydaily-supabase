const userInfo = document.getElementById('user-info');

firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = "../index.html";
        return;
    }

    const email = user.email;
    const nombre = user.displayName || email.split('@')[0];
    const firebase_uid = user.uid;

    document.getElementById("user-info").textContent = `Hola, ${nombre} (${email})`;

    const id_us = localStorage.getItem("id_us");

    if (id_us) {
        // Ya está sincronizado, solo cargar notas
        cargarNotas();
    } else {
        // Sincronizar con backend
        fetch("../php/sync_user.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, nombre, firebase_uid })
        })
        .then(res => res.json())
        .then(data => {
            if (data.id_us) {
                localStorage.setItem("id_us", data.id_us);
                cargarNotas();
            } else {
                console.error("Error al sincronizar usuario:", data.msg);
                alert("Error al sincronizar usuario con el servidor.");
            }
        })
        .catch(err => console.error("Error al sincronizar usuario:", err));
    }
});

function logout() {
    firebase.auth().signOut().then(() => {
        localStorage.removeItem("id_us");
        window.location.href = "../index.html";
    });
}

function guardarNota() {
    const id_us = localStorage.getItem("id_us");
    const nombre = document.getElementById("nota-nombre").value.trim();
    const contenido = document.getElementById("nota-contenido").value.trim();

    if (!id_us) {
        alert("Usuario no autenticado");
        return;
    }

    if (!nombre || !contenido) {
        alert("Por favor completa todos los campos");
        return;
    }

    const { data, error } = await supabase
        .from('notas')
        .insert([{ nom: titulo, cont: contenido, id_us: user.id }]);
    .then(res => res.json())
    .then(data => {
        document.getElementById("resultado").innerText =
            data.status === "ok"
                ? "Nota guardada con ID: " + data.id_nota
                : "Error: " + data.msg;

        if (data.status === "ok") {
            document.getElementById("nota-nombre").value = "";
            document.getElementById("nota-contenido").value = "";
            cargarNotas();
        }
    })
    .catch(err => console.error("Error al guardar nota:", err));
}

function cargarNotas() {
    const id_us = localStorage.getItem("id_us");

    if (!id_us) {
        console.warn("No se encontró id_us en localStorage");
        return;
    }

    fetch("../php/obtener_notas.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_us })
    })
    .then(res => res.json())
    .then(notas => {
        const lista = document.getElementById("lista-notas");
        lista.innerHTML = "";

        if (!Array.isArray(notas) || notas.length === 0) {
            lista.innerHTML = "<p>No tienes notas guardadas.</p>";
            return;
        }

        notas.forEach(nota => {
            const card = document.createElement("div");
            card.classList.add("nota-card");
            card.innerHTML = `
                <h3>${nota.nom}</h3>
                <p>${nota.cont}</p>
            `;
            lista.appendChild(card);
        });
    })
    .catch(err => console.error("Error al obtener notas:", err));
}