
import { supabase, getUser } from '../supabase.js';

export class SettingsManager {
    constructor(uiManager) {
        this.ui = uiManager;
    }

    async loadUserProfile() {
        try {
            const user = await getUser();
            if (!user) return;

            // Update UI elements (username/email from Auth)
            const usernameDisplays = document.querySelectorAll('.username');
            const usernameInputs = document.querySelectorAll('#username');
            const emailInputs = document.querySelectorAll('#email');
            
            const displayName = user.user_metadata?.full_name || user.email.split('@')[0];
            
            usernameDisplays.forEach(el => el.textContent = displayName);
            usernameInputs.forEach(el => el.value = displayName);
            emailInputs.forEach(el => el.value = user.email);

            // Load extra Profile & Config (normalized)
            await this.loadExtendedProfile(user.id);

        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    async loadExtendedProfile(userId) {
        try {
            // 1. Fetch Profile (usuarios) for Avatar & Theme
            const { data: profile } = await supabase
                .from('usuarios')
                .select('avatar, tema, nombre, apellido')
                .eq('id', userId)
                .single();

            if (profile) {
                this.applyProfile(profile);
            }

            // 2. Fetch Config (configuraciones) for other settings
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

    applyProfile(profile) {
        if (!profile) return;
        
        if (profile.avatar) {
            this.updateAvatarDisplay(profile.avatar);
        }
        
        if (profile.tema) {
            document.documentElement.setAttribute('data-theme', profile.tema);
            const themeOptions = document.querySelectorAll('.theme-option');
            themeOptions.forEach(o => {
                o.classList.toggle('active', o.getAttribute('data-theme') === profile.tema);
            });
        }
    }

    applyConfig(config) {
        if (!config) return;
        // Here we would apply other settings like notifications enabled, etc.
        // For now, visual settings are in 'usuarios' (profile).
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

    async saveProfile(formData) {
        try {
            const user = await getUser();
            if (!user) return;

            const username = formData.username;
            const selectedAvatar = document.querySelector('.avatar-option.active')?.dataset.avatar || 'user-circle';
            const selectedTheme = document.querySelector('.theme-option.active')?.dataset.theme || 'default';

            // 1. Update Auth User Metadata (Supabase Auth)
            const { error: authError } = await supabase.auth.updateUser({
                data: { full_name: username }
            });
            if (authError) throw authError;

            // 2. Update/Upsert 'usuarios' table (Profile)
            const profileData = {
                id: user.id, // PK
                username: user.email.split('@')[0], // Fallback/Default
                nombre: username, // Storing display name as 'nombre'
                avatar: selectedAvatar,
                tema: selectedTheme,
                updated_at: new Date()
            };

            const { error: profileError } = await supabase
                .from('usuarios')
                .upsert(profileData);

            if (profileError) throw profileError;

            // 3. Update/Upsert 'configuraciones' table (Settings)
            // (Only if we had specific settings in the form, currently we only have profile stuff)
            // But let's create the row if missing
            /*
            const configData = {
                user_id: user.id,
                updated_at: new Date()
            };
            await supabase.from('configuraciones').upsert(configData);
            */

            this.ui.showToast('Perfil guardado exitosamente', 'success');
            
            // Re-apply to UI
            this.applyProfile(profileData);
             const usernameDisplays = document.querySelectorAll('.username');
            usernameDisplays.forEach(el => el.textContent = username);

        } catch (error) {
            console.error('Error saving profile:', error);
            this.ui.showToast('Error al guardar perfil: ' + error.message, 'error');
        }
    }
}
