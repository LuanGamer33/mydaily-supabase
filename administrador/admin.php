<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>MyDaily - Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="estilos.css">
    <!-- Supabase JS -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>

<body>

    <div class="sidebar">
        <div class="sidebar-user-info" style="background: rgba(255,255,255,0.4); padding: 15px; border-radius: 20px; text-align: center; color: #6d4c41;">
            <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 5px;">
                <span id="admin-name">Cargando...</span>
            </div>
            <div style="font-size: 0.85rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;">
                ADMINISTRADOR
            </div>
        </div>

        <button id="logout-btn" class="sidebar-btn logout-btn" style="background:none; border:none; cursor:pointer; width:100%; text-align:left; color:white; font-size:1rem;">
            <i class="fas fa-door-open"></i> 🚪 Cerrar Sesión
        </button>
    </div>

    <header class="header-admin">
        <div class="header-col-izq"></div>
        <div class="header-col-centro">
            <h1>
                <img src="img/logo_capybara.gif" width="60" alt="Koala">
                MyDaily
            </h1>
        </div>
        <div class="header-col-der">
            <img src="img/Unefa.png" width="40" alt="Unefa">
        </div>
    </header>

    <div class="main-content">
        <div class="contenedor-tabla">
            <h2 style="margin-top:0;">Gestión de Usuarios</h2>

            <div class="barra-busqueda">
                <select id="filtro">
                    <option value="username">Nombre</option>
                    <option value="id">ID</option>
                </select>
                <input type="text" id="busqueda" placeholder="Buscar...">
                <button id="btn-buscar" class="btn-buscar">Filtrar</button>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre de Usuario</th>
                        <th>Rol</th>
                        <th>Último Acceso</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody id="tabla-usuarios">
                    <!-- Filas dinámicas -->
                </tbody>
            </table>
        </div>
    </div>

    <!-- Script Admin -->
    <script type="module">
        import {
            supabase,
            getUser
        } from '../js/supabase.js';

        let currentUser = null;

        async function initAdmin() {
            // 1. Verificar sesión y rol
            const user = await getUser();
            if (!user) {
                window.location.href = "../index.php";
                return;
            }

            const {
                data: profile,
                error
            } = await supabase
                .from('usuarios')
                .select('rol, username')
                .eq('id', user.id)
                .single();

            if (error || !profile || profile.rol !== 'admin') {
                alert("Acceso denegado: No eres administrador.");
                window.location.href = "../dashboard.php";
                return;
            }

            currentUser = user;
            document.getElementById('admin-name').textContent = profile.username || user.email;

            // 2. Cargar usuarios
            loadUsers();
        }

        async function loadUsers(filterField = 'username', filterValue = '') {
            let query = supabase
                .from('usuarios')
                .select('id, username, rol, created_at') // Supabase auth users no se pueden consultar directamente desde cliente fácil, usamos la tabla publica users
                .order('created_at', {
                    ascending: false
                });

            if (filterValue) {
                if (filterField === 'id') {
                    query = query.eq('id', filterValue);
                } else {
                    query = query.ilike('username', `%${filterValue}%`);
                }
            }

            const {
                data,
                error
            } = await query;

            if (error) {
                console.error('Error cargando usuarios:', error);
                alert('Error cargando usuarios');
                return;
            }

            renderTable(data);
        }

        function renderTable(users) {
            const tbody = document.getElementById('tabla-usuarios');
            tbody.innerHTML = '';

            users.forEach(u => {
                const tr = document.createElement('tr');
                const isMe = u.id === currentUser.id;

                // Formatear fecha
                const date = new Date(u.created_at).toLocaleDateString() || 'N/A';

                let actionHtml = '';
                if (isMe) {
                    actionHtml = '<span style="color: #bcaaa4; font-size: 0.85rem; font-style: italic;">Tu cuenta</span>';
                } else {
                    const isUser = u.rol !== 'admin';
                    const toggleRoleLabel = isUser ? 'Hacer Admin' : 'Quitar Admin';
                    const toggleRoleIcon = isUser ? '⬆️' : '⬇️';
                    const toggleRoleTarget = isUser ? 'admin' : 'usuario';

                    actionHtml = `
                        <button onclick="toggleRole('${u.id}', '${toggleRoleTarget}')" class="btn-accion" style="margin-right:5px;" title="${toggleRoleLabel}">
                            ${toggleRoleIcon}
                        </button>
                        <button onclick="deleteUser('${u.id}')" class="btn-accion btn-eliminar" title="Eliminar">
                            🗑️
                        </button>
                    `;
                }

                tr.innerHTML = `
                    <td><small>${u.id.substring(0, 8)}...</small></td>
                    <td>${u.username || 'Sin nombre'}</td>
                    <td><span class="badge-rol">${u.rol || 'usuario'}</span></td>
                    <td>${date}</td>
                    <td style="display: flex; justify-content: center;">${actionHtml}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Exponer funciones al scope global para los onclick (hack rápido para módulos)
        window.toggleRole = async (id, newRole) => {
            if (!confirm(`¿Cambiar rol a ${newRole}?`)) return;

            const {
                error
            } = await supabase
                .from('usuarios')
                .update({
                    rol: newRole
                })
                .eq('id', id);

            if (error) {
                alert('Error actualizando rol: ' + error.message);
            } else {
                loadUsers();
            }
        };

        window.deleteUser = async (id) => {
            if (!confirm('¿Eliminar usuario de la base de datos pública? (Nota: Esto no elimina la cuenta de Auth de Supabase, solo el perfil público)')) return;

            const {
                error
            } = await supabase
                .from('usuarios')
                .delete()
                .eq('id', id);

            if (error) {
                alert('Error eliminando: ' + error.message);
            } else {
                loadUsers();
            }
        };

        // Listeners
        document.getElementById('btn-buscar').addEventListener('click', () => {
            const filter = document.getElementById('filtro').value;
            const value = document.getElementById('busqueda').value;
            loadUsers(filter, value);
        });

        document.getElementById('logout-btn').addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = '../index.php';
        });

        initAdmin();
    </script>
</body>

</html>