<?php
$currentPage = basename($_SERVER['PHP_SELF']);
?>
<aside class="sidebar">
    <!-- Botón Toggle Sidebar -->
    <button class="sidebar-toggle">
        <i class="fas fa-bars"></i>
        <span class="toggle-text">Contraer menú</span>
    </button>
    <!-- Información de Usuario -->
    <div class="user-info">
        <div class="user-avatar">
            <i class="fas fa-user-circle"></i>
        </div>
        <span class="username">Cargando...</span>
    </div>

    <!-- Navegación -->
    <nav class="nav-menu">
        <ul>
            <li>
                <a href="dashboard.php" class="nav-item <?php echo ($currentPage == 'dashboard.php') ? 'active' : ''; ?>" data-title="Panel Principal">
                    <i class="fas fa-tachometer-alt"></i><span> Panel Principal</span>
                </a>
            </li>
            <li>
                <a href="habits.php" class="nav-item <?php echo ($currentPage == 'habits.php') ? 'active' : ''; ?>" data-title="Habitos diarios">
                    <i class="fas fa-check-circle"></i><span> Hábitos Diarios</span>
                </a>
            </li>
            <?php /*<li>
                <a href="events.php" class="nav-item <?php echo ($currentPage == 'events.php') ? 'active' : ''; ?>" data-title="Eventos">
                    <i class="fas fa-calendar-alt"></i><span> Eventos</span>
                </a>
            </li>*/ ?>
            <li>
                <a href="notes.php" class="nav-item <?php echo ($currentPage == 'notes.php') ? 'active' : ''; ?>" data-title="Notas">
                    <i class="fas fa-sticky-note"></i><span> Notas</span>
                </a>
            </li>
            <li>
                <a href="lists.php" class="nav-item <?php echo ($currentPage == 'lists.php') ? 'active' : ''; ?>" data-title="Listas">
                    <i class="fas fa-list-check"></i><span> Listas</span>
                </a>
            </li>
            <?php /*<li>
                <a href="activities.php" class="nav-item <?php echo ($currentPage == 'activities.php') ? 'active' : ''; ?>" data-title="Actividades">
                    <i class="fas fa-tasks"></i><span> Actividades</span>
                </a>
            </li>*/ ?>
            <li>
                <a href="planning.php" class="nav-item <?php echo ($currentPage == 'planning.php') ? 'active' : ''; ?>" data-title="Planificación Diaria">
                    <i class="fas fa-calendar-day"></i><span> Planificación</span>
                </a>
            </li>
            <li>
                <a href="calendar.php" class="nav-item <?php echo ($currentPage == 'calendar.php') ? 'active' : ''; ?>" data-title="Calendario">
                    <i class="fas fa-calendar-alt"></i><span> Calendario</span>
                </a>
            </li>
            <li>
                <a href="settings.php" class="nav-item <?php echo ($currentPage == 'settings.php') ? 'active' : ''; ?>" data-title="Configuraciones">
                    <i class="fas fa-cog"></i><span> Configuraciones</span>
                </a>
            </li>
        </ul>
    </nav>

    <!-- Botón Cerrar Sesión -->
    <div class="logout-section">
        <button class="logout-btn">
            <i class="fas fa-sign-out-alt"></i><span> Cerrar Sesión</span>
        </button>
    </div>
</aside>