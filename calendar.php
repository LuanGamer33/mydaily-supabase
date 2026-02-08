<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyDaily - Calendario</title>
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
    <style>
        @media (max-width: 900px) {
            .calendar-layout {
                grid-template-columns: 1fr !important;
            }

            .agenda-column {
                order: 2;
            }

            .calendar-section {
                order: 1;
            }
        }
    </style>
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
            <!-- Contenido de calendario y agenda -->
            <div class="section active glass-container">
                <div class="section-header-main">
                    <h2>Agenda y Calendario</h2>
                    <p class="section-subtitle">Organiza tu vida y compromisos</p>
                </div>

                <div class="calendar-layout" style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
                    <!-- Columna Izquierda: Agenda del Día -->
                    <div class="agenda-column">
                        <div class="section-header">
                            <h3 id="selected-date-title">Hoy</h3>
                        </div>
                        <div class="section-actions">
                            <button class="action-btn" id="add-event-btn">
                                <i class="fas fa-plus"></i> Añadir Evento
                            </button>
                        </div>

                        <div class="agenda-timeline">
                            <ul id="agenda-list" class="day-events-list">
                                <!-- Las actividades del día seleccionado se cargarán aquí -->
                                <li class="empty-state">Selecciona un día para ver los eventos</li>
                            </ul>
                        </div>
                    </div>

                    <!-- Columna Derecha: Calendario Mensual -->
                    <div class="calendar-section">
                        <div class="section-header calendar-nav">
                            <button id="prev-month" class="nav-btn"><i class="fas fa-chevron-left"></i></button>
                            <h2 id="current-month">Calendario</h2>
                            <button id="next-month" class="nav-btn"><i class="fas fa-chevron-right"></i></button>
                        </div>
                        <div class="calendar-grid">
                            <div class="calendar-header">
                                <span>D</span><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span>
                            </div>
                            <div class="calendar-body" id="calendar-body"></div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Modal para crear evento -->
    <div class="modal" id="calendar-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-title">Nuevo Evento</h3>
                <button class="close-btn" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="Calendar-form" method="POST">
                    <div class="form-field">
                        <label>Título</label>
                        <input type="text" name="title" required placeholder="Título del evento">
                    </div>
                    <div class="form-field">
                        <label>Descripción</label>
                        <textarea name="description" rows="2" placeholder="Detalles..."></textarea>
                    </div>
                    <div class="form-row" style="display: flex; gap: 1rem;">
                        <div class="form-field" style="flex: 1;">
                            <label>Fecha</label>
                            <input type="date" name="date" required>
                        </div>
                        <div class="form-field" style="flex: 1;">
                            <label>Hora</label>
                            <input type="time" name="time">
                        </div>
                    </div>
                    <div class="form-field">
                        <label>Lugar</label>
                        <input type="text" name="location" placeholder="Ubicación (opcional)">
                    </div>

                    <div class="modal-actions">
                        <button type="button" onclick="closeModal()">Cancelar</button>
                        <button type="submit">Guardar Evento</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script type="module" src="js/app.js"></script>
</body>

</html>