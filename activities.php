<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyDaily - Actividades</title>
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
            <!-- Contenido de Actividades -->
            <div class="section active">
                <div class="section-header-main">
                    <h2>Mis Actividades</h2>
                    <p class="section-subtitle">Organiza tus tareas diarias y compromisos importantes</p>
                </div>

                <div class="section-actions">
                    <button class="action-btn" onclick="openActivityModal()">
                        <i class="fas fa-plus"></i>
                    </button>
                    <div class="activity-stats">
                        <div class="stat-item">
                            <span class="stat-number" id="total-activities">0</span>
                            <span class="stat-label">Total</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number" id="completed-activities">0</span>
                            <span class="stat-label">Completadas</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number" id="pending-activities">0</span>
                            <span class="stat-label">Pendientes</span>
                        </div>
                    </div>
                    <div class="activity-filters">
                        <select id="activity-filter">
                            <option value="all">Todas</option>
                            <option value="pending">Pendientes</option>
                            <option value="completed">Completadas</option>
                            <option value="today">Hoy</option>
                            <option value="overdue">Atrasadas</option>
                        </select>
                    </div>
                </div>

                <div class="activities-container">
                    <ul id="activities-list">
                        <!-- Las actividades se cargarán aquí dinámicamente -->
                    </ul>
                </div>
            </div>
        </main>
    </div>

    <!-- Modal para actividades -->
    <div class="modal" id="activity-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-title">Nueva Actividad</h3>
                <button class="close-btn" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="activity-form">
                    <div class="form-field">
                        <label>Título de la Actividad</label>
                        <input type="text" name="title" required placeholder="¿Qué necesitas hacer?">
                    </div>
                    <div class="form-field">
                        <label>Descripción</label>
                        <textarea name="description" rows="3" placeholder="Detalles adicionales..."></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-field">
                            <label>Fecha</label>
                            <input type="date" name="date" required>
                        </div>
                        <div class="form-field">
                            <label>Hora</label>
                            <input type="time" name="time">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-field">
                            <label>Prioridad</label>
                            <select name="priority">
                                <option value="low">Baja</option>
                                <option value="medium" selected>Media</option>
                                <option value="high">Alta</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Categoría</label>
                            <select name="category">
                                <option value="personal">Personal</option>
                                <option value="trabajo">Trabajo</option>
                                <option value="salud">Salud</option>
                                <option value="administrativa">Administrativa</option>
                                <option value="educacion">Educación</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" onclick="closeModal()">Cancelar</button>
                        <button type="submit">Guardar Actividad</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script type="module" src="js/app.js"></script>
</body>

</html>