
import { supabase, getUser } from '../supabase.js';

export class SettingsManager {
    constructor(uiManager) {
        this.ui = uiManager;
    }

    async loadUserProfile(user) {
        try {
            const currentUser = user || await getUser();
            if (!currentUser) return;

            // Actualizar elementos de UI (nombre usuario/email desde Auth)
            const usernameDisplays = document.querySelectorAll('.username');
            const usernameInputs = document.querySelectorAll('#username');
            const emailInputs = document.querySelectorAll('#email');
            
            // Prioridad: Metadata > Email
            const displayName = currentUser.user_metadata?.username || currentUser.email.split('@')[0];
            
            usernameDisplays.forEach(el => el.textContent = displayName);
            usernameInputs.forEach(el => el.value = displayName);
            emailInputs.forEach(el => el.value = currentUser.email);

            // Cargar Perfil extra y Configuración (normalizado)
            await this.loadExtendedProfile(currentUser.id);

        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    async loadExtendedProfile(userId) {
        try {
            // 1. Obtener Perfil (usuarios) para Avatar y Tema
            const { data: profile } = await supabase
                .from('usuarios')
                .select('avatar, tema, nombre, apellido, username')
                .eq('id', userId)
                .single();

            if (!profile) {
                // Auto-healing: Crear perfil si no existe
                console.warn('Perfil no encontrado, creando perfil por defecto...');
                profile = await this.createDefaultProfile(userId);
            }

            if (profile) {
                this.applyProfile(profile);
            }

            // 2. Obtener Configuración para otros ajustes
            const { data: config } = await supabase
                .from('configuraciones')
                .select('*')
                .eq('user_id', userId)
                .single();
            
            if (config) {
                this.applyConfig(config);
            }

        } catch (error) {
            console.error('Error loading extended profile:', error);
        }
    }

    async createDefaultProfile(userId) {
        try {
            const user = await getUser();
            const metadata = user?.user_metadata || {};
            
            const newProfile = {
                id: userId,
                username: metadata.username || user?.email?.split('@')[0] || 'User',
                nombre: metadata.nombre || 'Usuario',
                apellido: metadata.apellido || '',
                avatar: 'user-circle',
                tema: 'default'
            };
            
            const { error } = await supabase.from('usuarios').insert([newProfile]);
            
            if (error) {
                console.error('Error creando perfil por defecto:', error);
                return null;
            }
            
            return newProfile;
        } catch (e) {
            console.error('Excepción creando perfil:', e);
            return null;
        }
    }

    applyProfile(profile) {
        if (!profile) return;
        
        if (profile.username) {
            const usernameDisplays = document.querySelectorAll('.username');
            const usernameInputs = document.querySelectorAll('#username');
            usernameDisplays.forEach(el => el.textContent = profile.username);
            usernameInputs.forEach(el => el.value = profile.username);
        }

        if (profile.avatar) {
            this.updateAvatarDisplay(profile.avatar);
        }
        
        if (profile.tema) {
            document.documentElement.setAttribute('data-theme', profile.tema);
            localStorage.setItem('theme', profile.tema); // Guardar para rendimiento
            
            const themeOptions = document.querySelectorAll('.theme-option');
            themeOptions.forEach(o => {
                o.classList.toggle('active', o.getAttribute('data-theme') === profile.tema);
            });
        }
    }

    applyConfig(config) {
        if (!config) return;
        // Aquí aplicaríamos otros ajustes como notificaciones habilitadas, etc.
        // Por ahora, ajustes visuales están en 'usuarios' (perfil).
        console.log('App config loaded:', config);
    }

    updateAvatarDisplay(avatarType) {
        const userAvatars = document.querySelectorAll('.user-avatar i');
        userAvatars.forEach(avatar => {
            if (avatar) avatar.className = `fas fa-${avatarType}`;
        });
        
        const avatarOptions = document.querySelectorAll('.avatar-option');
        avatarOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.avatar === avatarType);
        });
    }

    setupListeners() {
        // Botón Guardar Perfil
        const saveBtn = document.getElementById('save-profile-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }

        // Opciones de Avatar
        const avatarOptions = document.querySelectorAll('.avatar-option');
        avatarOptions.forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('active'));
                option.classList.add('active');
            });
        });

        // Opciones de Tema
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.theme-option').forEach(el => el.classList.remove('active'));
                option.classList.add('active');
                // Opcional: Previsualizar tema inmediatamente
                const theme = option.dataset.theme;
                document.documentElement.setAttribute('data-theme', theme);
                localStorage.setItem('theme', theme); // Guardar previsualización inmediata
            });
        });

        // Nuevos Botones de Acción
        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.ui.showToast('Función "Exportar datos" próximamente', 'info');
            });
        }

        const deleteAccountBtn = document.getElementById('delete-account-btn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => {
                 this.ui.showToast('Función "Eliminar cuenta" en desarrollo', 'warning');
            });
        }

        const helpBtn = document.getElementById('show-help-btn');
        if (helpBtn) helpBtn.addEventListener('click', () => this.ui.showToast('Centro de ayuda en desarrollo', 'info'));

        const bugBtn = document.getElementById('report-bug-btn');
        if (bugBtn) bugBtn.addEventListener('click', () => this.ui.showToast('Formulario de reporte próximamente', 'info'));

        const feedbackBtn = document.getElementById('send-feedback-btn');
        if (feedbackBtn) feedbackBtn.addEventListener('click', () => this.ui.showToast('Envío de feedback próximamente', 'info'));

        const shortcutsToggle = document.getElementById('keyboard-shortcuts');
        if (shortcutsToggle) {
             shortcutsToggle.addEventListener('change', (e) => {
                 if(e.target.checked) {
                     this.ui.showToast('Atajos de teclado próximamente', 'info');
                     // Revertir cambio visualmente si se desea, o dejarlo activado pero sin efecto real
                     setTimeout(() => e.target.checked = false, 500); 
                 }
             });
        }
    }

    async saveProfile() {
        try {
            const user = await getUser();
            if (!user) return;

            const usernameInput = document.getElementById('username');
            // Preferir valor de entrada de nombre de usuario, respaldo a nombre de usuario de metadatos existente, respaldo a parte de correo electrónico
            const username = usernameInput ? usernameInput.value : (user.user_metadata?.username || user.email.split('@')[0]);
            
            const selectedAvatar = document.querySelector('.avatar-option.active')?.dataset.avatar || 'user-circle';
            const selectedTheme = document.querySelector('.theme-option.active')?.dataset.theme || 'default';

            // 1. Actualizar Metadatos de Usuario Auth (Supabase Auth)
            const { error: authError } = await supabase.auth.updateUser({
                data: { username: username } // Guardar como 'username' para coincidir con el registro
            });
            if (authError) throw authError;

            // 2. Actualizar/Insertar tabla 'usuarios' (Perfil)
            const profileData = {
                id: user.id, // Clave Primaria (PK)
                username: username,
                nombre: user.user_metadata?.nombre || username, // Mantener nombre existente o usar nombre de usuario
                avatar: selectedAvatar,
                tema: selectedTheme,
                updated_at: new Date()
            };

            const { error: profileError } = await supabase
                .from('usuarios')
                .upsert(profileData);

            if (profileError) throw profileError;

            this.ui.showToast('Perfil guardado exitosamente', 'success');
            
            // Re-aplicar a la UI
            this.applyProfile(profileData);

        } catch (error) {
            console.error('Error saving profile:', error);
            this.ui.showToast('Error al guardar perfil: ' + error.message, 'error');
        }
    }
}
