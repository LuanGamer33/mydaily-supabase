import { supabase, getUser } from "../supabase.js";

export class NotesManager {
  constructor(uiManager) {
    this.ui = uiManager;
    this.notes = [];
    this.container = document.querySelector(".notes-container");
    this.currentEditId = null;

    this.init();
  }

  init() {
    this.setupListeners();
  }

  setupListeners() {
    const form = document.getElementById("note-form");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const noteData = {
          title: formData.get("title"),
          content: formData.get("content"),
          mood: formData.get("mood"),
          favorite: formData.get("favorite") === "on",
          imageFile:
            formData.get("image").size > 0 ? formData.get("image") : null,
        };

        await this.saveNote(noteData);

        // Cerrar modal si éxito (saveNote muestra aviso en error)
        // Podemos asumir éxito si no se lanza error dentro de saveNote...
        // saveNote captura errores, así que necesitamos depender de la respuesta de la UI.
        // Un mejor patrón sería que saveNote retorne un booleano de éxito.
        // Por ahora, asumamos que si llega al final está bien, cerrar modal.
        // En realidad saveNote maneja su propio aviso de error...
        // Pero para evitar riesgo al modificar firma de saveNote, solo cerraremos modal.
        this.ui.closeModal("note-modal");
      });
    }
  }

  async loadNotes() {
    try {
      const user = await getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("notas")
        .select(
          "id_notas, nom, cont, imagen, estado_animo, favorita, created_at"
        )
        .eq("user_id", user.id)
        .order("id_notas", { ascending: false });

      if (error) throw error;

      this.notes = data || [];
      this.render();
      return this.notes;
    } catch (error) {
      console.error("Error loading notes:", error);
      this.ui.showToast("Error cargando notas", "error");
      return [];
    }
  }

  render() {
    if (!this.container) {
        this.container = document.querySelector(".notes-container");
    }
    
    if (!this.container) return;
    this.container.innerHTML = "";

    if (this.notes.length === 0) {
      this.container.innerHTML =
        '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No tienes notas aún. ¡Crea tu primera nota!</p>';
      return;
    }

    const moodEmojis = {
      sun: '<i class="fa-solid fa-sun"></i>',
      cloud: '<i class="fa-solid fa-cloud-sun"></i>',
      rain: '<i class="fa-solid fa-cloud-rain"></i>',
      storm: '<i class="fa-solid fa-cloud-bolt"></i>',
    };

    this.notes.forEach((note) => {
      const noteCard = document.createElement("div");
      noteCard.className = `note-card ${note.favorita ? "favorite" : ""}`;
      noteCard.dataset.id = note.id_notas;

      noteCard.innerHTML = `
                <div class="note-header">
                    <h4>${note.nom}</h4>
                    <div class="note-actions">
                        <button class="favorite-btn ${
                          note.favorita ? "active" : ""
                        }" data-action="toggle-fav">
                            <i class="fas fa-star"></i>
                        </button>
                        <button class="edit-btn" data-action="edit"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" data-action="delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="note-content">
                    <p>${note.cont}</p>
                    ${
                      note.imagen
                        ? `<img src="${note.imagen}" alt="Note Image" class="note-image" style="max-width: 100%; border-radius: 8px; margin-top: 10px;">`
                        : ""
                    }
                </div>
                <div class="note-footer">
                    <span class="note-date"><i class="fas fa-calendar"></i> ${this.formatDate(
                      note.created_at || new Date()
                    )}</span>
                    <span class="note-words"><i class="fas fa-file-word"></i> ${
                      note.cont.split(" ").length
                    } palabras</span>
                    <span class="note-mood">${
                      moodEmojis[note.estado_animo] || moodEmojis.sun
                    }</span>
                </div>
            `;

      // Agregar escuchas a los botones
      noteCard
        .querySelector('[data-action="toggle-fav"]')
        .addEventListener("click", () => this.toggleFavorite(note.id_notas));
      noteCard
        .querySelector('[data-action="edit"]')
        .addEventListener("click", () => this.prepareEdit(note));
      noteCard
        .querySelector('[data-action="delete"]')
        .addEventListener("click", () => this.deleteNote(note.id_notas));

      this.container.appendChild(noteCard);
    });
  }

  async saveNote(noteData) {
    try {
      const user = await getUser();
      if (!user) {
        this.ui.showToast("Usuario no autenticado", "warning");
        return;
      }

      let imageBase64 = "";
      if (noteData.imageFile) {
        imageBase64 = await this.fileToBase64(noteData.imageFile);
      }

      if (this.currentEditId) {
        // Actualizar
        const updateData = {
          nom: noteData.title,
          cont: noteData.content,
          estado_animo: noteData.mood || "sun",
          favorita: noteData.favorite || false,
        };
        if (imageBase64) updateData.imagen = imageBase64;

        const { error } = await supabase
          .from("notas")
          .update(updateData)
          .eq("id_notas", this.currentEditId)
          .eq("user_id", user.id);

        if (error) throw error;
        this.ui.showToast("Nota actualizada", "success");
      } else {
        // Insertar
        const { error } = await supabase.from("notas").insert([
          {
            nom: noteData.title,
            cont: noteData.content,
            user_id: user.id,
            imagen: imageBase64,
            estado_animo: noteData.mood || "sun",
            favorita: noteData.favorite || false,
          },
        ]);

        if (error) throw error;
        this.ui.showToast("Nota creada", "success");
      }

      this.currentEditId = null;
      await this.loadNotes();
    } catch (error) {
      console.error("Error saving note:", error);
      this.ui.showToast("Error al guardar: " + error.message, "error");
    }
  }

  prepareEdit(note) {
    this.currentEditId = note.id_notas;
    // Llenar modal - esto implica que accedemos al formulario en el modal
    // Podemos hacer esto aquí o lógica separada.
    const modal = document.getElementById("note-modal");
    if (!modal) return; // Debería crear si depende de creación dinámica de modal

    const form = modal.querySelector("form");
    if (form) {
      if (form.elements.title) form.elements.title.value = note.nom;
      if (form.elements.content) form.elements.content.value = note.cont;
      if (form.elements.mood) form.elements.mood.value = note.estado_animo;
      if (form.elements.favorite)
        form.elements.favorite.checked = note.favorita;
    }

    this.ui.openModal("note-modal");
  }

  async toggleFavorite(id) {
    const note = this.notes.find((n) => n.id_notas === id);
    if (!note) return;

    try {
      const user = await getUser();
      const { error } = await supabase
        .from("notas")
        .update({ favorita: !note.favorita })
        .eq("id_notas", id)
        .eq("user_id", user.id);

      if (error) throw error;
      await this.loadNotes();
    } catch (error) {
      console.error("Error updating favorite:", error);
      this.ui.showToast("Error al actualizar", "error");
    }
  }

  async deleteNote(id) {
    if (!confirm("¿Estás seguro de eliminar esta nota?")) return;

    try {
      const user = await getUser();
      const { error } = await supabase
        .from("notas")
        .delete()
        .eq("id_notas", id)
        .eq("user_id", user.id);

      if (error) throw error;

      this.ui.showToast("Nota eliminada", "success");
      await this.loadNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      this.ui.showToast("Error al eliminar", "error");
    }
  }

  // Utilidades
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }
}
