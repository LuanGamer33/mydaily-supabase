<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MyDaily - Entrar o registrarse</title>
  <link
    rel="icon"
    type="image/png"
    href="img/Carpincho de pie sobre un parche de hierba.png" />
  <link rel="stylesheet" href="css/styles.css" />
  <link rel="stylesheet" href="css/messages.css" />
  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
    rel="stylesheet" />
  <link
    href="https://cdn.boxicons.com/fonts/basic/boxicons.min.css"
    rel="stylesheet" />
  <link
    href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css"
    rel="stylesheet" />
</head>

<body>
  <div class="contenedor">
    <div class="container">
      <!-- Formulario de Inicio de Sesión -->
      <div class="form-box login">
        <form id="login-form">
          <h2>Iniciar Sesión</h2>
          <div class="input-box">
            <input
              type="email"
              name="Correo"
              placeholder="Correo electrónico"
              maxlength="255"
              title="Ingrese el correo electrónico"
              required />
            <i class="bx bx-envelope"></i>
          </div>
          <div class="input-box">
            <input
              type="password"
              name="pass"
              placeholder="Contraseña"
              minlength="8"
              maxlength="128"
              title="Ingrese su contraseña de acceso"
              required />
            <i class="bx bxs-lock"></i>
          </div>
          <div class="forgot-link">
            <a href="forgot-password.php">¿Olvidaste tu contraseña?</a>
          </div>
          <button type="submit" class="btn">Ingresar</button>
          <p>o ingresar con redes sociales</p>
          <div class="social-icons">
            <a href="#" class="social-login-google"><i class="bx bxl-google"></i></a>
            <a href="#" class="social-login-github"><i class="bx bxl-github"></i></a>
          </div>
          <div class="mobile-register-link">
            <p>
              ¿No tienes una cuenta?
              <a href="#" class="register-link">Regístrate aquí</a>
            </p>
          </div>
        </form>
      </div>

      <!-- Formulario de Registro -->
      <div class="form-box register">
        <form id="register-form">
          <h2>Registrarse</h2>
          <div class="reg">
            <div class="inb">
              <input
                type="text"
                name="nombre"
                placeholder="Nombre"
                minlength="1"
                maxlength="64"
                title="Ingrese su nombre (minimo 2 letras)"
                required />
            </div>
            <div class="inb">
              <input
                type="text"
                name="apellido"
                placeholder="Apellido"
                minlength="2"
                maxlength="100"
                title="Ingrese su apellido (minimo 2 letras)"
                required />
            </div>
          </div>
          <div class="reg">
            <div class="inb">
              <input type="date" name="fn" required title="Ingrese su fecha de nacimiento" max="" />
            </div>
            <div class="inb">
              <select name="genero" title="Ingrese su genero" required>
                <option value="" disabled selected>Género</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Prefiero no decir">Prefiero no decir</option>
              </select>
            </div>
          </div>
          <div class="complete">
            <input
              type="email"
              name="Correo"
              placeholder="Correo electrónico"
              maxlength="255"
              title="Ingrese su correo electronico"
              required />
          </div>
          <div class="complete">
            <input
              type="text"
              name="username"
              placeholder="Nombre de Usuario"
              required
              title="Ingrese un nombre de usuario (minimo 3 caraacteres)"
              minlength="3"
              maxlength="66" />
          </div>
          <div class="reg">
            <div class="inb">
              <input
                type="password"
                name="pass"
                placeholder="Contraseña"
                minlength="8"
                maxlength="128"
                title="Ingrese una contraseña para acceder (minimo 8 caracteres)"
                required />
            </div>
            <div class="inb">
              <input
                type="password"
                name="conf_pass"
                placeholder="Confirmar"
                minlength="8"
                maxlength="128"
                title="Repita la contraseña para acceder (minimo 8 caracteres)"
                required />
            </div>
          </div>

          <button type="submit" class="btn">Registrarse</button>
          <p>o ingresar con redes sociales</p>
          <div class="social-icons">
            <a href="#" class="social-login-google"><i class="bx bxl-google"></i></a>
            <a href="#" class="social-login-github"><i class="bx bxl-github"></i></a>
          </div>
          <div class="mobile-login-link">
            <p>
              ¿Ya tienes una cuenta?
              <a href="#" class="login-link">Inicia sesión aquí</a>
            </p>
          </div>
        </form>
      </div>

      <!-- Panel de Alternancia (Toggle) para Login/Registro -->
      <div class="toggle-box">
        <div class="toggle-panel toggle-left">
          <h1>Gestor de tareas</h1>
          <img
            src="img/libro.png"
            alt="Imagen decorativa de un libro abierto"
            class="libro" />
          <br />
          <h2 class="h2">
            Bienvenido a MyDaily, tu gestor de tareas personal
          </h2>

          <p>¿No tienes una cuenta?</p>
          <button class="btn register-btn">Registrarse</button>
        </div>

        <div class="toggle-panel toggle-right">
          <h2>¡Volver al Inicio!</h2>
          <img
            src="img/libro.png"
            alt="Imagen decorativa de un libro abierto"
            class="libro" />
          <br />
          <p>¿Ya tienes una cuenta?</p>
          <button class="btn login-btn">Regresar</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Contenedor para mensajes -->
  <div id="message" class="message" role="alert" aria-live="polite"></div>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script type="module" src="js/app.js"></script>
  <img src="img/unefa.png" alt="Logo Unefa" style="position: fixed; bottom: 10px; left: 10px; width: 200px; opacity: 0.9; z-index: 1000; pointer-events: none;">
</body>

</html>