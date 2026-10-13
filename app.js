// ===== 1. Configuración =====
const API_URL = "https://rickandmortyapi.com/api/character";

// ===== 2. Estado de la aplicación =====
const state = {
  page: 1,
  name: "",
  status: "",
  totalPages: 1,
};

// ===== 3. Referencias al DOM =====
const grid = document.getElementById("characters");
const message = document.getElementById("message");
const searchInput = document.getElementById("search");
const statusSelect = document.getElementById("status");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const pageInfo = document.getElementById("page-info");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modal-body");
const closeModalBtn = document.getElementById("close-modal");

// ===== 4. Consumo de la API =====
async function fetchCharacters() {
  const params = new URLSearchParams({ page: state.page });
  if (state.name) params.set("name", state.name);
  if (state.status) params.set("status", state.status);

  message.textContent = "Cargando...";
  grid.innerHTML = "";

  try {
    const response = await fetch(`${API_URL}?${params}`);

    // La API responde 404 cuando no hay resultados para el filtro
    if (response.status === 404) {
      state.totalPages = 1;
      message.textContent = "No se encontraron personajes con esos filtros.";
      updatePagination();
      return;
    }
    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

    const data = await response.json();
    state.totalPages = data.info.pages;
    message.textContent = `${data.info.count} personajes encontrados`;
    renderCharacters(data.results);
    updatePagination();
  } catch (error) {
    console.error(error);
    message.textContent = "Ocurrió un error al consultar la API. Intenta de nuevo.";
  }
}

// ===== 5. Renderizado =====
function statusLabel(status) {
  const labels = { Alive: "Vivo", Dead: "Muerto", unknown: "Desconocido" };
  return labels[status] || status;
}

function renderCharacters(characters) {
  grid.innerHTML = characters
    .map(
      (c) => `
      <article class="card" tabindex="0" data-id="${c.id}">
        <img src="${c.image}" alt="${c.name}" loading="lazy" />
        <div class="card-info">
          <h3>${c.name}</h3>
          <p class="badge ${c.status.toLowerCase()}">${statusLabel(c.status)} - ${c.species}</p>
        </div>
      </article>`
    )
    .join("");
}

function updatePagination() {
  pageInfo.textContent = `Página ${state.page} de ${state.totalPages}`;
  prevBtn.disabled = state.page <= 1;
  nextBtn.disabled = state.page >= state.totalPages;
}

// ===== 6. Detalle en modal =====
async function openDetail(id) {
  modal.classList.remove("hidden");
  modalBody.innerHTML = "<p>Cargando...</p>";
  try {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    const c = await res.json();
    modalBody.innerHTML = `
      <h2>${c.name}</h2>
      <div class="detail">
        <img src="${c.image}" alt="${c.name}" />
        <dl>
          <dt>Estado</dt><dd>${statusLabel(c.status)}</dd>
          <dt>Especie</dt><dd>${c.species}</dd>
          <dt>Género</dt><dd>${c.gender}</dd>
          <dt>Origen</dt><dd>${c.origin.name}</dd>
          <dt>Ubicación</dt><dd>${c.location.name}</dd>
        </dl>
      </div>
      <p class="episodes">Aparece en ${c.episode.length} episodio(s).</p>`;
  } catch (error) {
    console.error(error);
    modalBody.innerHTML = "<p>No se pudo cargar el detalle.</p>";
  }
}

function closeDetail() {
  modal.classList.add("hidden");
}

// ===== 7. Eventos =====
// Debounce: espera a que el usuario deje de escribir antes de consultar
let debounceTimer;
searchInput.addEventListener("input", (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    state.name = e.target.value.trim();
    state.page = 1;
    fetchCharacters();
  }, 400);
});

statusSelect.addEventListener("change", (e) => {
  state.status = e.target.value;
  state.page = 1;
  fetchCharacters();
});

prevBtn.addEventListener("click", () => {
  if (state.page > 1) { state.page--; fetchCharacters(); }
});
nextBtn.addEventListener("click", () => {
  if (state.page < state.totalPages) { state.page++; fetchCharacters(); }
});

// Delegación de eventos: un solo listener para todas las tarjetas
grid.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (card) openDetail(card.dataset.id);
});
grid.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const card = e.target.closest(".card");
    if (card) openDetail(card.dataset.id);
  }
});

closeModalBtn.addEventListener("click", closeDetail);
modal.addEventListener("click", (e) => { if (e.target === modal) closeDetail(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDetail(); });

// ===== 8. Inicio =====
fetchCharacters();
