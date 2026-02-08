<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyDaily - Restablecer Contraseña</title>
    <link rel="icon" type="image/png" href="img/Carpincho de pie sobre un parche de hierba.png">
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/messages.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="https://cdn.boxicons.com/fonts/basic/boxicons.min.css" rel="stylesheet">
    <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
</head>

<body>
    <div class="contenedor">
        <div class="container active">
            <div class="form-box login" style="width: 100%; right: 0;">
                <form id="reset-password-form">
                    <h2>Nueva Contraseña</h2>
                    <p style="text-align: center; margin-bottom: 20px;">
                        Ingresa y confirma tu nueva contraseña.
                    </p>

                    <div class="input-box">
                        <input type="password" name="password" placeholder="Nueva Contraseña" required minlength="6" maxlength="128">
                        <i class="bx bxs-lock"></i>
                    </div>

                    <div class="input-box">
                        <input type="password" name="confirm_password" placeholder="Confirmar Contraseña" required minlength="6" maxlength="128">
                        <i class="bx bxs-lock"></i>
                    </div>

                    <button type="submit" class="btn">Actualizar Contraseña</button>
                </form>
            </div>
        </div>
    </div>

    <!-- Contenedor para mensajes -->
    <div id="message" class="custom-toast" role="alert" aria-live="polite"></div>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script type="module" src="js/reset-password.js"></script>
    <img src="img/unefa.png" alt="Logo Unefa" style="position: fixed; bottom: 10px; left: 10px; width: 200px; opacity: 0.9; z-index: 1000; pointer-events: none;">
</body>

</html>