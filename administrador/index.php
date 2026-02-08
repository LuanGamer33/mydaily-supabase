<?php
session_start();

// Si el usuario ya inició sesión, lo mandamos a su panel correspondiente
if (isset($_SESSION['rol'])) {
    if ($_SESSION['rol'] == 'admin') {
        header("Location: admin.php");
        exit();
    } else {
        // Si tuvieras una página para usuarios normales, iría aquí
        echo "Bienvenido usuario. <a href='logout.php'>Cerrar sesión</a>";
        exit();
    }
} else {
    // Si no hay sesión, lo redirigimos al login automáticamente
    header("Location: login.php");
    exit();
}
?>