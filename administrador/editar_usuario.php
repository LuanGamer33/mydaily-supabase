<?php
session_start();
require_once('conexion.php');

if (!isset($_SESSION['rol']) || $_SESSION['rol'] != 'admin') {
    header("Location: login.php");
    exit();
}

$id = isset($_GET['id']) ? $_GET['id'] : '';

// Obtener datos actuales
try {
    $stmt = $conexion->prepare("SELECT id, username as nombre_usuario FROM public.usuarios WHERE id = :id");
    $stmt->bindValue(':id', $id);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        header("Location: admin.php");
        exit();
    }
} catch (PDOException $e) {
    die("Error: " . $e->getMessage());
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nuevo_nombre = $_POST['nombre_usuario'];
    // $nuevo_rol = $_POST['rol']; // Rol deshabilitado

    try {
        $update = "UPDATE public.usuarios SET username = :username WHERE id = :id";
        $stmt_upd = $conexion->prepare($update);
        $stmt_upd->bindValue(':username', $nuevo_nombre);
        $stmt_upd->bindValue(':id', $id);

        if ($stmt_upd->execute()) {
            header("Location: admin.php?msg=actualizado");
            exit();
        }
    } catch (PDOException $e) {
        $error = "Error al actualizar: " . $e->getMessage();
    }
}
?>

<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>Editar Perfil - MyDaily</title>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;700&display=swap" rel="stylesheet">
    <style>
        /* Estilos específicos para centrar el cuadro blanco */
        body {
            margin: 0;
            padding: 0;
            background: url('img/fondo_login.jpg') no-repeat center center fixed;
            background-size: cover;
            font-family: 'Quicksand', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        .contenedor-editar {
            background: rgba(255, 255, 255, 0.9);
            /* Cuadro blanco con ligera transparencia */
            padding: 40px;
            border-radius: 30px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            width: 380px;
            text-align: center;
        }

        .contenedor-editar h2 {
            color: #5d4037;
            margin-bottom: 30px;
            font-size: 1.8rem;
        }

        .input-group {
            text-align: left;
            margin-bottom: 20px;
        }

        .input-group label {
            display: block;
            color: #8d6e63;
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 0.9rem;
        }

        .input-group input,
        .input-group select {
            width: 100%;
            padding: 12px;
            border: 1px solid #e0d5c8;
            border-radius: 12px;
            font-family: 'Quicksand', sans-serif;
            box-sizing: border-box;
            outline: none;
        }

        .btn-guardar {
            background-color: #8d6e63;
            color: white;
            border: none;
            padding: 14px;
            border-radius: 15px;
            width: 100%;
            font-weight: bold;
            cursor: pointer;
            transition: 0.3s;
            margin-top: 10px;
        }

        .btn-guardar:hover {
            background-color: #5d4037;
        }

        .btn-cancelar {
            display: block;
            margin-top: 15px;
            color: #a1887f;
            text-decoration: none;
            font-size: 0.9rem;
        }
    </style>
</head>

<body>

    <div class="contenedor-editar">
        <h2>Editar Perfil</h2>

        <?php if (isset($error)) echo "<p style='color:red;'>$error</p>"; ?>

        <form method="POST">
            <div class="input-group">
                <label>Nombre de Usuario</label>
                <input type="text" name="nombre_usuario" value="<?php echo htmlspecialchars($user['nombre_usuario']); ?>" required>
            </div>

            <!-- 
            <div class="input-group">
                <label>Rol del Sistema</label>
                <select name="rol" disabled>
                    <option value="usuario" selected>Usuario</option>
                </select>
                <small>Gestión de roles no disponible.</small>
            </div> 
            -->

            <button type="submit" class="btn-guardar">Guardar Cambios</button>
            <a href="admin.php" class="btn-cancelar">Cancelar</a>
        </form>
    </div>

</body>

</html>