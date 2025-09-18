const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
});

function loginWith(providerName) {
let provider;

if (providerName === 'google') {
    provider = new firebase.auth.GoogleAuthProvider();
} else if (providerName === 'github') {
    provider = new firebase.auth.GithubAuthProvider();
} else {
    return;
}

firebase.auth().signInWithPopup(provider)
    .then((result) => {
        const user = result.user;
        const email = user.email;
        const nombre = user.displayName || email.split('@')[0];
        const firebase_uid = user.uid;

        // Enviar datos al backend para sincronizar
        return fetch("../php/sync_user.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, nombre, firebase_uid })
        });
    })
    .then(res => res.json())
    .then(data => {
        if (data.id_us) {
            localStorage.setItem("id_us", data.id_us);
            window.location.href = "../dashboard.html";
        } else {
            console.error("Error al sincronizar usuario:", data.msg);
            alert("Error al sincronizar usuario con el servidor.");
        }
    })
    .catch((error) => {
        console.error("Error al iniciar sesión:", error);
        alert("Error al iniciar sesión con " + providerName);
    });
}

firebase.auth().onAuthStateChanged((user) => {
if (user) {
    console.log("Usuario autenticado:", user.email);
} else {
    console.log("No hay usuario autenticado");
}
});