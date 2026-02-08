<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyDaily - Planificación Diaria</title>
    <!-- Bootstrap 5.3.3 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <link rel="stylesheet" href="css/dashboard.css">
    <link rel="stylesheet" href="css/styles2.css">
    <link rel="stylesheet" href="css/messages.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="img/Carpincho de pie sobre un parche de hierba.png" rel="icon">
    <script>
        (function() {
            const theme = localStorage.getItem("theme");
            if (theme) {
                document.documentElement.setAttribute("data-theme", theme);
            }
        })();
    </script>
</head>

<body>
    <header class="header">
        <div class="header-content">
            <div class="logo-section">
                <img src="img/logo_capybara.gif" class="logo">
                <h1>MyDaily</h1>
            </div>
        </div>

        <img src="img/unefa.png" alt="Logo Unefa"
            style="
                    position: fixed; 
                    top: 20px;
                    right: 10px; 
                    width: 130px; 
                    opacity: 0.9; 
                    z-index: 1000; 
                    pointer-events: none;
                    ">
    </header>

    <!-- Container Principal -->
    <div class="main-container">
        <!-- Sidebar Izquierdo -->
        <?php include_once 'includes/sidebar.php'; ?>

        <!-- Contenido Principal -->
        <main class="main-content">
            <div class="section active glass-container">
                <div class="section-header-main">
                    <h2>Planificación Diaria</h2>
                    <p class="section-subtitle">Tu enfoque para el día de hoy</p>
                </div>

                <div class="planning-container">

                    <div class="planning-controls mb-4 d-flex justify-content-between align-items-center">
                        <div class="date-selector d-flex align-items-center gap-2">
                            <input type="date" id="planning-date-input" class="form-control" style="width: auto;">
                            <h4 id="planning-date-display" class="m-0 text-muted"></h4>
                        </div>
                        <span id="save-indicator" class="badge bg-success" style="opacity: 0; transition: opacity 0.5s;">Guardado</span>
                    </div>

                    <div class="planning-grid">
                        <div class="planning-card">
                            <div class="card-header-plan morning">
                                <i class="fas fa-sun text-warning"></i> Mañana
                            </div>
                            <textarea id="plan-morning" class="planning-input" placeholder="¿Qué harás esta mañana?"></textarea>
                        </div>

                        <div class="planning-card">
                            <div class="card-header-plan afternoon">
                                <i class="fas fa-cloud-sun text-warning"></i> Tarde
                            </div>
                            <textarea id="plan-afternoon" class="planning-input" placeholder="¿Qué harás esta tarde?"></textarea>
                        </div>

                        <div class="planning-card">
                            <div class="card-header-plan night">
                                <i class="fas fa-moon text-primary"></i> Noche
                            </div>
                            <textarea id="plan-night" class="planning-input" placeholder="¿Qué harás esta noche?"></textarea>
                        </div>

                        <div class="planning-card full-width">
                            <div class="card-header-plan notes">
                                <i class="fas fa-sticky-note text-secondary"></i> Notas del Día
                            </div>
                            <textarea id="plan-notes" class="planning-input" placeholder="Notas adicionales, reflexiones..."></textarea>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script type="module" src="js/app.js"></script>
</body>

</html>