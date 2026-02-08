<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyDaily - Notas</title>
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
            <!-- Contenido de Notas -->
            <div class="section active glass-container">
                <div class="section-header-main">
                    <h2>Mis Notas</h2>
                    <p class="section-subtitle">Captura tus pensamientos, ideas y recordatorios importantes</p>
                </div>

                <div class="section-actions">
                    <button class="action-btn" onclick="openNoteModal()">
                        <i class="fas fa-plus"></i> Nueva Nota
                    </button>
                    <div class="notes-search">
                        <input type="text" placeholder="Buscar notas..." id="search-input">
                        <i class="fas fa-search"></i>
                    </div>
                    <div class="notes-filter">
                        <select id="notes-filter">
                            <option value="all">Todas</option>
                            <option value="recent">Recientes</option>
                            <option value="favorites">Favoritas</option>
                        </select>
                    </div>
                </div>

                <div class="notes-container">
                    <!-- Las notas se cargarán aquí dinámicamente -->
                </div>
            </div>
        </main>
    </div>

    <!-- Modal para notas -->
    <div class="modal" id="note-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-title">Nueva Nota</h3>
                <button class="close-btn" onclick="closeModal('note-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <form id="note-form" method="POST">
                    <div class="form-field">
                        <label>Título de la Nota</label>
                        <input type="text" name="title" required placeholder="Título de tu nota">
                    </div>
                    <div class="form-field">
                        <label>Contenido</label>
                        <textarea name="content" rows="8" required placeholder="Escribe aquí el contenido de tu nota..."></textarea>
                    </div>
                    <div class="form-field">
                        <label>Imagen de la Nota</label>
                        <input type="file" name="image" accept="image/*">
                        <img id="image-preview" style="display: none; max-width: 200px; margin-top: 10px; border-radius: 8px;">
                    </div>
                    <div class="form-field">
                        <label>Estado de Ánimo</label>
                        <select name="mood">
                            <option value="sun"><i class="fas fa-sun"></i> Soleado</option>
                            <option value="cloud"><i class="fas fa-cloud"></i> Nublado</option>
                            <option value="rain"><i class="fas fa-cloud-rain"></i> Lluvioso</option>
                            <option value="storm"><i class="fas fa-bolt"></i> Tormenta</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label>
                            <input type="checkbox" name="favorite"> Marcar como favorita
                        </label>
                    </div>
                    <div class="modal-actions">
                        <button type="button" onclick="closeModal()">Cancelar</button>
                        <button type="submit">Guardar Nota</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script type="module" src="js/app.js"></script>
</body>

</html>