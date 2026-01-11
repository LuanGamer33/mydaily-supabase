import { supabase } from "../supabase.js";

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

    // Verificación estricta para páginas protegidas
    if (!session && !this.isPublicRoute()) {
      window.location.replace("index.html");
    }
  }

  isPublicRoute() {
    const path = window.location.pathname;
    return path.includes("index.html") || path === "/" || path.endsWith("/");
  }

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Manejar redirección vía cambio de estado o reemplazo manual si es necesario
      // El listener de cambio de estado capturará SIGNED_OUT, pero podemos forzarlo también
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
      // Usar replace para evitar que el botón atrás regrese a la página protegida
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
      return {
        user: null,
        session: null,
        error: this.friendlyErrorMessage(error),
      };
    }
  }

  async register(userData) {
    try {
      const { email, password, ...meta } = userData;

      // Construir URL de redirección dinámicamente
      const redirectUrl = new URL("dashboard.html", window.location.href).href;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: meta, // Guardar datos adicionales como nombre, usuario en metadatos
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      // INSERTAR PERFIL EN BASE DE DATOS PÚBLICA (CRUCIAL PARA QUE APAREZCA EL NOMBRE)
      if (data.user) {
        const { error: profileError } = await supabase.from("usuarios").insert([
          {
            id: data.user.id,
            username: meta.username,
            nombre: meta.nombre,
            apellido: meta.apellido,
            fecha_nacimiento: meta.fechaNacimiento,
            genero: meta.genero,
            avatar: "user-circle", // Default
            tema: "default", // Default
          },
        ]);

        if (profileError) {
          console.error("Error creating user profile:", profileError);
          // No lanzamos error para no bloquear el login, pero lo logueamos
        }
      }

      if (data.session) {
        this.setSession(data.session);
      }

      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error("Register error:", error);
      return {
        user: null,
        session: null,
        error: this.friendlyErrorMessage(error),
      };
    }
  }

  async loginWithProvider(provider) {
    try {
      // Construir URL de redirección dinámicamente basada en la ubicación actual
      // Esto maneja 'localhost/MyDaily/' correctamente
      const redirectUrl = new URL("dashboard.html", window.location.href).href;

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
      return {
        user: null,
        session: null,
        error: this.friendlyErrorMessage(error),
      };
    }
  }

  setSession(session) {
    this.session = session;
    this.user = session?.user || null;
  }

  isAuthenticated() {
    return !!this.session;
  }

  redirect(path) {
    // Verificación básica de redirección relativa
    if (!window.location.pathname.endsWith(path)) {
      window.location.href = path;
    }
  }

  friendlyErrorMessage(error) {
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
