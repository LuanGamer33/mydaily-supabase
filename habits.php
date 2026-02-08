<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyDaily - Hábitos Diarios</title>
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
            <!-- Contenido de Hábitos -->
            <div class="section active glass-container">
                <div class="section-header-main">
                    <h2>Hábitos Diarios</h2>
                    <p class="section-subtitle">Construye rutinas positivas que mejoren tu día a día</p>
                </div>

                <div class="section-actions">
                    <button class="action-btn" onclick="openHabitModal()">
                        <i class="fas fa-plus"></i> Añadir Hábito
                    </button>
                    <div class="habit-stats">
                        <div class="stat-item">
                            <span class="stat-number" id="total-habits">0</span>
                            <span class="stat-label">Total</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number" id="completed-today">0</span>
                            <span class="stat-label">Completados</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number" id="completion-rate">0%</span>
                            <span class="stat-label">Tasa</span>
                        </div>
                    </div>
                </div>

                <div class="items-grid" id="habits-list">
                    <!-- Los hábitos se cargarán aquí dinámicamente -->
                </div>
            </div>
        </main>
    </div>

    <!-- Modal para hábitos -->
    <div class="modal" id="habit-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-title">Nuevo Hábito</h3>
                <button class="close-btn" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="habit-form" method="POST">
                    <div class="form-field">
                        <label>Nombre del Hábito</label>
                        <input type="text" name="name" required placeholder="Ej: Hacer ejercicio">
                    </div>
                    <div class="form-field">
                        <label>Descripción</label>
                        <textarea name="description" rows="3" placeholder="Describe tu hábito..."></textarea>
                    </div>
                    <div class="form-field">
                        <label>Frecuencia</label>
                        <select name="frequency" id="habit-frequency">
                            <option value="daily">Diario</option>
                            <option value="weekly">Semanal</option>
                            <option value="monthly">Mensual</option>
                            <option value="yearly">Anual</option>
                            <option value="custom">Personalizado (Intervalo)</option>
                        </select>
                    </div>

                    <!-- Semanal -->
                    <div class="form-field frequency-option" id="frequency-weekly" style="display: none;">
                        <label>Días de la semana</label>
                        <div class="week-days-selector">
                            <label><input type="checkbox" name="days" value="1"> <span>L</span></label>
                            <label><input type="checkbox" name="days" value="2"> <span>M</span></label>
                            <label><input type="checkbox" name="days" value="3"> <span>M</span></label>
                            <label><input type="checkbox" name="days" value="4"> <span>J</span></label>
                            <label><input type="checkbox" name="days" value="5"> <span>V</span></label>
                            <label><input type="checkbox" name="days" value="6"> <span>S</span></label>
                            <label><input type="checkbox" name="days" value="0"> <span>D</span></label>
                        </div>
                    </div>

                    <!-- Mensual -->
                    <div class="form-field frequency-option" id="frequency-monthly" style="display: none;">
                        <label>Día del mes</label>
                        <input type="number" name="month_day" min="1" max="31" placeholder="Ej: 15">
                    </div>

                    <!-- Anual -->
                    <div class="form-field frequency-option" id="frequency-yearly" style="display: none;">
                        <label>Fecha anual</label>
                        <div style="display: flex; gap: 10px;">
                            <select name="year_month" style="flex: 1;">
                                <option value="0">Enero</option>
                                <option value="1">Febrero</option>
                                <option value="2">Marzo</option>
                                <option value="3">Abril</option>
                                <option value="4">Mayo</option>
                                <option value="5">Junio</option>
                                <option value="6">Julio</option>
                                <option value="7">Agosto</option>
                                <option value="8">Septiembre</option>
                                <option value="9">Octubre</option>
                                <option value="10">Noviembre</option>
                                <option value="11">Diciembre</option>
                            </select>
                            <input type="number" name="year_day" min="1" max="31" placeholder="Día" style="width: 80px;">
                        </div>
                    </div>

                    <!-- Custom Interval -->
                    <div class="form-field frequency-option" id="frequency-custom" style="display: none;">
                        <label>Repetir cada (días)</label>
                        <input type="number" name="custom_interval" min="1" max="365" placeholder="Ej: 3 (Cada 3 días)">
                    </div>
                    <div class="modal-actions">
                        <button type="button" onclick="closeModal()">Cancelar</button>
                        <button type="submit">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script type="module" src="js/app.js"></script>
</body>

</html>