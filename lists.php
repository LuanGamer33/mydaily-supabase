<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyDaily - Listas</title>
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
                    <h2>Mis Listas</h2>
                    <p class="section-subtitle">Organiza tus tareas en listas personalizadas</p>
                </div>

                <div class="section-actions">
                    <button class="action-btn" onclick="openListModal()">
                        <i class="fas fa-plus"></i> Crear Lista
                    </button>
                    <button class="action-btn" onclick="openTaskModal()">
                        <i class="fas fa-plus-circle"></i> Crear Tarea
                    </button>
                </div>

                <div class="lists-container" id="lists-container">
                    <!-- Las listas se cargarán aquí dinámicamente -->
                    <div style="text-align: center; color: var(--text-light); padding: 2rem;">
                        <i class="fas fa-clipboard-list fa-3x" style="margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>Tus listas aparecerán aquí</p>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Modal para crear lista -->
    <div class="modal" id="list-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Nueva Lista</h3>
                <button class="close-btn" onclick="closeModal('list-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <form id="list-form" method="POST">
                    <div class="form-field">
                        <label>Nombre de la Lista</label>
                        <input type="text" name="listTitle" required placeholder="Ej: Compras Supermercado">
                    </div>
                    <div class="modal-actions">
                        <button type="button" onclick="closeModal('list-modal')">Cancelar</button>
                        <button type="submit">Crear Lista</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Modal para crear tarea -->
    <div class="modal" id="task-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Nueva Tarea</h3>
                <button class="close-btn" onclick="closeModal('task-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <form id="task-form" method="POST">
                    <div class="form-field">
                        <label>Nombre de la Tarea</label>
                        <input type="text" name="taskTitle" required placeholder="Ej: Comprar leche">
                    </div>
                    <div class="form-field">
                        <label>Seleccionar Lista</label>
                        <select name="parentList" id="parent-list-select">
                            <!-- Options loaded dynamically -->
                            <option value="">Selecciona una lista...</option>
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button type="button" onclick="closeModal('task-modal')">Cancelar</button>
                        <button type="submit">Crear Tarea</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script type="module" src="js/app.js"></script>
    <script>
        // Inline helpers removed in favor of ListsManager.js implementation
    </script>
</body>

</html>