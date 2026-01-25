
import { supabase } from '../supabase.js';

export class ListsManager {
    constructor() {
        this.lists = [];
    }

    async loadLists(user) {
        if (!user) return;
        this.currentUser = user; // Almacenar usuario para acciones internas
        
        try {
            const { data, error } = await supabase
                .from('listas')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            this.lists = data;
            this.renderLists();
        } catch (error) {
            console.error('Error loading lists:', error);
        }
    }

    renderLists() {
        // Renderizar en barra lateral (dashboard.html y otros) si existe un contenedor específico
        // Actualmente, las listas son específicas de lists.html, pero podríamos querer mostrarlas en la barra lateral o un menú desplegable más tarde.
        // Por ahora, centrémonos en renderizarlas en la página principal de Listas si estamos en esa página.
        
        const listsContainer = document.getElementById('lists-container');
        if (listsContainer) {
            listsContainer.innerHTML = '';
            
            if (this.lists.length === 0) {
                 listsContainer.innerHTML = '<p class="text-center text-muted">No tienes listas aún. ¡Crea una!</p>';
                 return;
            }

            this.lists.forEach(list => {
                const listCard = document.createElement('div');
                listCard.className = 'col-md-4 mb-4';
                listCard.innerHTML = `
                    <div class="card h-100 shadow-sm list-card" data-id="${list.id}" style="border-top: 4px solid ${list.color || 'var(--primary-color)'}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="card-title mb-0"><i class="fas ${list.icon || 'fa-list'} me-2"></i>${list.nombre}</h5>
                                <div class="dropdown">
                                    <button class="btn btn-link text-muted p-0" type="button" data-bs-toggle="dropdown">
                                        <i class="fas fa-ellipsis-v"></i>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <li><a class="dropdown-item text-danger delete-list-btn" href="#" data-id="${list.id}"><i class="fas fa-trash me-2"></i>Eliminar</a></li>
                                    </ul>
                                </div>
                            </div>
                            <div class="tasks-list" id="tasks-list-${list.id}">
                                <div class="text-center py-3"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></div>
                            </div>
                            <button class="btn btn-sm btn-outline-primary w-100 mt-3 add-task-btn" data-list-id="${list.id}">
                                <i class="fas fa-plus me-1"></i> Añadir Tarea
                            </button>
                        </div>
                    </div>
                `;
                listsContainer.appendChild(listCard);
                
                listsContainer.appendChild(listCard);
                
                // Cargar tareas para esta lista
                this.loadTasks(list.id);
            });

            // Volver a adjuntar escuchas de eventos para elementos dinámicos
            this.attachDynamicListeners();
        }
        
        // Actualizar selección en Modal si existe
        const listSelect = document.getElementById('parent-list-select');
        if (listSelect) {
            listSelect.innerHTML = this.lists.length ? '<option value="">Selecciona una lista...</option>' : '<option value="" disabled selected>No hay listas disponibles</option>';
            this.lists.forEach(list => {
                const option = document.createElement('option');
                option.value = list.id;
                option.textContent = list.nombre;
                listSelect.appendChild(option);
            });
        }
    }

    async loadTasks(listId) {
        try {
            const { data, error } = await supabase
                .from('tareas')
                .select('*')
                .eq('lista_id', listId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const tasksContainer = document.getElementById(`tasks-list-${listId}`);
            if (tasksContainer) {
                tasksContainer.innerHTML = '';
                if (data.length === 0) {
                    tasksContainer.innerHTML = '<p class="text-muted small text-center mb-0">Sin tareas</p>';
                } else {
                    data.forEach(task => {
                        const taskItem = document.createElement('div');
                        taskItem.className = 'd-flex align-items-center mb-2 task-item';
                        taskItem.innerHTML = `
                             <div class="form-check">
                                <input class="form-check-input task-checkbox" type="checkbox" value="" id="task-${task.id}" ${task.completada ? 'checked' : ''} data-id="${task.id}">
                                <label class="form-check-label ${task.completada ? 'text-decoration-line-through text-muted' : ''}" for="task-${task.id}">
                                    ${task.texto}
                                </label>
                            </div>
                            <button class="btn btn-link btn-sm text-danger ms-auto p-0 delete-task-btn" data-id="${task.id}" style="opacity: 0.5; font-size: 0.8rem;"><i class="fas fa-times"></i></button>
                        `;
                        tasksContainer.appendChild(taskItem);
                    });
                }
            }
        } catch (error) {
           console.error(`Error loading tasks for list ${listId}:`, error);
        }
    }

    async createList(name, icon, color, userId) {
        try {
            const { data, error } = await supabase
                .from('listas')
                .insert([{ user_id: userId, nombre: name, icon: icon, color: color }])
                .select();
            
            if (error) throw error;
            
            // Recargar listas
            await this.loadLists({ id: userId });
            return data[0];
        } catch (error) {
            console.error('Error creating list:', error);
            throw error;
        }
    }
    
    async deleteList(listId, userId) {
        if(!confirm('¿Estás seguro de eliminar esta lista y todas sus tareas?')) return;
        
        try {
            const { error } = await supabase
                .from('listas')
                .delete()
                .eq('id', listId);
                
            if (error) throw error;
            await this.loadLists({ id: userId });
        } catch (error) {
             console.error('Error deleting list:', error);
             alert('Error al eliminar la lista');
        }
    }

    async createTask(listId, text, userId) {
        try {
            const { data, error } = await supabase
                .from('tareas')
                .insert([{ lista_id: listId, user_id: userId, texto: text }])
                .select();
            if (error) throw error;
            
            // Recargar tareas para la lista específica (optimización: no recargar todas las listas)
            await this.loadTasks(listId);
            return data[0];
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }
    
    async toggleTask(taskId, completed) {
         try {
            const { error } = await supabase
                .from('tareas')
                .update({ completada: completed })
                .eq('id', taskId);

            if (error) throw error;
            
            const checkbox = document.getElementById(`task-${taskId}`);
            if(checkbox) {
                 const label = checkbox.nextElementSibling;
                 if(completed) label.classList.add('text-decoration-line-through', 'text-muted');
                 else label.classList.remove('text-decoration-line-through', 'text-muted');
            }

        } catch (error) {
            console.error('Error toggling task:', error);
            const checkbox = document.getElementById(`task-${taskId}`);
            if(checkbox) checkbox.checked = !completed; 
            alert('Error al actualizar la tarea');
        }
    }
    
    async deleteTask(taskId, listId) {
        if(!confirm('¿Eliminar tarea?')) return;
        try {
             const { error } = await supabase
                .from('tareas')
                .delete()
                .eq('id', taskId);

            if (error) throw error;
            await this.loadTasks(listId);
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }

    setupListeners(user) {
        // Formularios
        const listForm = document.getElementById('list-form');
        if (listForm) {
            listForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const title = listForm.listTitle.value;
                if (!title) return;
                
                try {
                    await this.createList(title, 'fa-list', '#d4a89a', user.id);
                    listForm.reset();
                    this.closeModal('list-modal');
                } catch (err) {
                    alert('Error al crear lista');
                }
            });
        }

        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const title = taskForm.taskTitle.value;
                const listId = taskForm.parentList.value;
                
                if (!title || !listId) {
                    alert('Por favor completa todos los campos');
                    return;
                }
                
                try {
                    await this.createTask(listId, title, user.id);
                    taskForm.reset();
                    this.closeModal('task-modal');
                } catch (err) {
                    alert('Error al crear tarea');
                }
            });
        }

        // Ayudantes globales de modal (si no se usan los en línea o para anularlos para mejor control)
        window.openListModal = () => document.getElementById('list-modal').style.display = 'block';
        window.openTaskModal = () => document.getElementById('task-modal').style.display = 'block';
        window.closeModal = (id) => document.getElementById(id).style.display = 'none';
        
        // También adjuntar a ventana para verificar clics fuera
        window.onclick = (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = "none";
            }
        };
    }

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    }

    attachDynamicListeners() {
        // Botones de Eliminar Lista
        document.querySelectorAll('.delete-list-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const listId = e.currentTarget.getAttribute('data-id');
                const userId = supabase.auth.user()?.id; // Respaldo, mejor si se pasa
                // Pero espera, setupListeners tiene 'user'. attachDynamicListeners se llama desde renderLists que no tiene 'user' en el ámbito fácilmente a menos que se almacene.
                // ¿Deberíamos almacenar el usuario en el constructor o loadLists?
                // Por ahora, asumamos que la sesión es válida.
                // En realidad, renderLists es llamado por loadLists que tiene 'user'. 
                // Almacenemos el usuario en this.currentUser cuando se llama a loadLists.
                if (this.currentUser) {
                    this.deleteList(listId, this.currentUser.id);
                }
            });
        });
        
        // Botones de Agregar Tarea (Abrir Modal con lista preseleccionada)
        document.querySelectorAll('.add-task-btn').forEach(btn => {
             btn.addEventListener('click', (e) => {
                 const listId = e.currentTarget.getAttribute('data-list-id');
                 const listSelect = document.getElementById('parent-list-select');
                 if(listSelect) listSelect.value = listId;
                 
                 const modal = document.getElementById('task-modal');
                 if(modal) modal.style.display = 'block'; 
             });
        });
        
        // Casillas de verificación de tareas
         document.querySelectorAll('.task-checkbox').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const taskId = e.target.getAttribute('data-id');
                const completed = e.target.checked;
                this.toggleTask(taskId, completed);
            });
        });
        
        // Botones de Eliminar Tarea
        document.querySelectorAll('.delete-task-btn').forEach(btn => {
             btn.addEventListener('click', (e) => {
                 const taskId = e.currentTarget.getAttribute('data-id');
                 const listId = e.currentTarget.closest('.list-card').getAttribute('data-id');
                 this.deleteTask(taskId, listId);
             });
        });
    }
}
