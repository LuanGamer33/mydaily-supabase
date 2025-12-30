import { supabase } from '../supabase.js';

export class AuthManager {
  constructor() {
    this.user = null;
    this.session = null;
  }

  async init() {
    // Verificar sesión actual al iniciar
    const {
      data: { session },
    } = await supabase.auth.getSession();
    this.session = session;
    this.user = session?.user || null;

    // Configurar listener para cambios de auth
    supabase.auth.onAuthStateChange(this.handleAuthStateChange.bind(this));
    
    // Strict check for protected pages
    if (!session && !this.isPublicRoute()) {
        window.location.replace('index.html');
    }
  }
  
  isPublicRoute() {
      const path = window.location.pathname;
      return path.includes('index.html') || path === '/' || path.endsWith('/');
  }

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Handle redirect via state change or manual replace if needed immediately
      // The state change listener will catch SIGNED_OUT, but we can force it too
    } catch (error) {
      console.error("Logout error:", error);
      this.friendlyErrorMessage(error);
    }
  }

  handleAuthStateChange(event, session) {
    console.log("Auth state changed:", event);
    this.session = session;
    this.user = session?.user || null;

    if (event === "SIGNED_IN") {
      this.redirect("dashboard.html");
    } else if (event === "SIGNED_OUT") {
      // Use replace to prevent back button from returning to protected page
      window.location.replace("index.html");
    }
  }

  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        this.setSession(data.session);
      }

      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error("Login error:", error);
      return { user: null, session: null, error: this.friendlyErrorMessage(error) };
    }
  }

  async register(userData) {
    try {
      const { email, password, ...meta } = userData;
      
      // Construct redirect URL dynamically
      const redirectUrl = new URL('dashboard.html', window.location.href).href;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: meta, // Save additional data like name, username in metadata
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      if (data.session) {
        this.setSession(data.session);
      }

      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error("Register error:", error);
      return { user: null, session: null, error: this.friendlyErrorMessage(error) };
    }
  }

  async loginWithProvider(provider) {
    try {
      // Construct redirect URL dynamically based on current location
      // This handles 'localhost/MyDaily/' correctly
      const redirectUrl = new URL('dashboard.html', window.location.href).href;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) throw error;
      
      // Si hay sesión, el usuario ya está logueado (auto-confirm desactivado en Supabase)
      if (data.session) {
          this.setSession(data.session);
      }
      
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error("Register error:", error);
      return { user: null, session: null, error: this.friendlyErrorMessage(error) };
    }
  }

  setSession(session) {
      this.session = session;
      this.user = session?.user || null;
  }

  isAuthenticated() {
      return !!this.session;
  }

  // ... (lines 103-121 same) ...

  redirect(path) {
    // Basic relative redirect check
    if (!window.location.pathname.endsWith(path)) {
      window.location.href = path;
    }
  }

  friendlyErrorMessage(error) {
      // ... (existing error messages) ...
    if (error.message.includes("Invalid login credentials"))
      return "Correo o contraseña incorrectos";
    if (error.message.includes("Email not confirmed"))
      return "Verifica tu correo electrónico";
    if (error.message.includes("already registered"))
      return "Este correo ya está registrado";
    if (error.message.includes("Password should be at least"))
      return "La contraseña debe tener al menos 6 caracteres";
    return error.message;
  }
}
