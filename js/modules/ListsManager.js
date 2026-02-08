
import { supabase } from '../supabase.js';

export class ListsManager {
    constructor(ui) {
        this.lists = [];
        this.ui = ui;
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
            // this.attachDynamicListeners(); // DEPRECATED: delegación de eventos en setupListeners
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
        if(!await this.ui.showConfirm('¿Estás seguro de eliminar esta lista y todas sus tareas?', 'Eliminar Lista', 'danger')) return;
        
        try {
            const { error } = await supabase
                .from('listas')
                .delete()
                .eq('id', listId);
                
            if (error) throw error;
            await this.loadLists({ id: userId });
        } catch (error) {
             console.error('Error deleting list:', error);
             this.ui.showToast('Error al eliminar la lista', 'error');
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
            this.ui.showToast('Error al actualizar la tarea', 'error');
        }
    }
    
    async deleteTask(taskId, listId) {
        if(!await this.ui.showConfirm('¿Eliminar tarea?', 'Eliminar Tarea', 'warning')) return;
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
        this.currentUser = user; // Ensure user is available for delegated actions

        // Form Listeners
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
                    this.ui?.showToast('Error al crear lista', 'error');
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
                    this.ui?.showToast('Por favor completa todos los campos', 'warning');
                    return;
                }
                
                try {
                    await this.createTask(listId, title, user.id);
                    taskForm.reset();
                    this.closeModal('task-modal');
                } catch (err) {
                    this.ui?.showToast('Error al crear tarea', 'error');
                }
            });
        }

        // Global Helpers
        window.openListModal = () => {
            const el = document.getElementById('list-modal');
            if(el) el.classList.add('show');
        };
        window.openTaskModal = () => {
            const el = document.getElementById('task-modal');
            if(el) el.classList.add('show');
        };
        window.closeModal = (id) => {
            const modal = document.getElementById(id);
            if (modal) {
                modal.classList.remove('show');
                modal.style.display = ''; 
            }
        };
        
        window.onclick = (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.classList.remove('show');
                event.target.style.display = '';
            }
        };

        // --- Event Delegation for Dynamic Elements ---
        const listsContainer = document.getElementById('lists-container');
        if (listsContainer) {
            // Click Events (Delete List, Delete Task, Add Task Button)
            listsContainer.addEventListener('click', (e) => {
                // Delete List
                const deleteListBtn = e.target.closest('.delete-list-btn');
                if (deleteListBtn) {
                    e.preventDefault();
                    const listId = deleteListBtn.getAttribute('data-id');
                    if (this.currentUser) {
                        this.deleteList(listId, this.currentUser.id);
                    }
                    return;
                }

                // Delete Task
                const deleteTaskBtn = e.target.closest('.delete-task-btn');
                if (deleteTaskBtn) {
                    e.preventDefault();
                    const taskId = deleteTaskBtn.getAttribute('data-id');
                    const listId = deleteTaskBtn.closest('.list-card').getAttribute('data-id'); // Get parent list ID
                    this.deleteTask(taskId, listId);
                    return;
                }

                // Add Task Button (Opens Modal)
                const addTaskBtn = e.target.closest('.add-task-btn');
                if (addTaskBtn) {
                    const listId = addTaskBtn.getAttribute('data-list-id');
                    const listSelect = document.getElementById('parent-list-select');
                    if(listSelect) listSelect.value = listId;
                    
                    const modal = document.getElementById('task-modal');
                    if(modal) modal.classList.add('show'); 
                    return;
                }
            });

            // Change Events (Task Checkbox)
            listsContainer.addEventListener('change', (e) => {
                if (e.target.classList.contains('task-checkbox')) {
                    const taskId = e.target.getAttribute('data-id');
                    const completed = e.target.checked;
                    this.toggleTask(taskId, completed);
                }
            });
        }
    }

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = '';
        }
    }

    attachDynamicListeners() {
        // Deprecated: Logic moved to setupListeners using event delegation
    }
}
