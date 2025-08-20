// PokéDex Numar — lógica principal
// Hecho por y para Numar: nombres y comentarios en español para que sea fácil de mantener.

const API = "https://pokeapi.co/api/v2";

// Estado global
const state = {
  all: [],          // pokémon completos (id, name, types, sprite)
  filtered: [],     // tras filtros
  page: 1,
  perPage: 20
};

// Mapeo de generaciones por rango de ID
const GEN_RANGES = {
  "1": [1, 151],
  "2": [152, 251],
  "3": [252, 386],
  "4": [387, 493],
  "5": [494, 649],
  "6": [650, 721],
  "7": [722, 809],
  "8": [810, 905],
  "9": [906, 1010]
};

// Elementos del DOM
const el = {
  q: document.querySelector("#q"),
  gen: document.querySelector("#gen"),
  sort: document.querySelector("#sort"),
  typesContainer: document.querySelector("#typesContainer"),
  applyBtn: document.querySelector("#applyBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  cards: document.querySelector("#cards"),
  prev: document.querySelector("#prev"),
  next: document.querySelector("#next"),
  pageInfo: document.querySelector("#pageInfo"),
  fabTop: document.querySelector("#fabTop"),
  toTop: document.querySelector("#toTop"),
  modal: document.querySelector("#modal"),
  closeModal: document.querySelector("#closeModal"),
  modalBody: document.querySelector("#modalBody"),
};

// Utilidad: dormir
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Cargar datos iniciales (primeros 200)
async function loadInitial() {
  const limit = 200;
  const listRes = await fetch(`${API}/pokemon?limit=${limit}&offset=0`);
  const list = await listRes.json();
  // Traemos detalles en paralelo (sprite, tipos, id correcto)
  const detailed = await Promise.all(
    list.results.map(async (p) => {
      const r = await fetch(p.url);
      const d = await r.json();
      return {
        id: d.id,
        name: d.name,
        types: d.types.map(t => t.type.name), // e.g., ["grass","poison"]
        sprite: d.sprites.other["official-artwork"].front_default || d.sprites.front_default
      };
    })
  );
  // Orden por id asc
  detailed.sort((a,b)=>a.id-b.id);
  state.all = detailed;
  state.filtered = detailed;
  renderTypes(detailed);
  render();
}

// Renderizar checkboxes de tipos dinámicamente
function renderTypes(data){
  const allTypes = Array.from(new Set(data.flatMap(p => p.types))).sort();
  el.typesContainer.innerHTML = allTypes.map(t => {
    const id = `type-${t}`;
    return `<label class="flex items-center gap-2">
      <input type="checkbox" value="${t}" id="${id}" class="accent-indigo-500">
      <span class="capitalize">${t}</span>
    </label>`;
  }).join("");
}

// Aplicar filtros/orden
function applyFilters(){
  const q = el.q.value.trim().toLowerCase();
  const gen = el.gen.value;
  const sort = el.sort.value;
  const typesChecked = Array.from(el.typesContainer.querySelectorAll("input[type=checkbox]:checked")).map(i=>i.value);

  let arr = state.all;

  // Búsqueda por id o nombre
  if(q){
    arr = arr.filter(p => p.name.includes(q) || String(p.id) === q);
  }
  // Filtro por tipos: incluir si contiene TODOS los seleccionados
  if(typesChecked.length){
    arr = arr.filter(p => typesChecked.every(t => p.types.includes(t)));
  }
  // Filtro por generación (por rango de ID)
  if(gen){
    const [min, max] = GEN_RANGES[gen];
    arr = arr.filter(p => p.id >= min && p.id <= max);
  }
  // Orden
  const [key, dir] = sort.split("-");
  arr.sort((a,b)=>{
    let res = 0;
    if(key === "name") res = a.name.localeCompare(b.name);
    else res = a.id - b.id;
    return dir === "asc" ? res : -res;
  });

  state.filtered = arr;
  state.page = 1;
  render();
}

// Resetear filtros
function resetFilters(){
  el.q.value = "";
  el.gen.value = "";
  el.sort.value = "id-asc";
  el.typesContainer.querySelectorAll("input[type=checkbox]").forEach(c=> c.checked = false);
  state.filtered = state.all.slice();
  state.page = 1;
  render();
}

// Render tarjetas y paginación
function render(){
  const { page, perPage, filtered } = state;
  const total = filtered.length || 0;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const slice = filtered.slice(start, start + perPage);

  el.cards.innerHTML = slice.map(cardTemplate).join("");
  el.pageInfo.textContent = `Página ${page} / ${pages} — ${total} resultados`;

  el.prev.disabled = page <= 1;
  el.next.disabled = page >= pages;

  // Scroll al inicio del contenido en cada render
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Wire para los botones de ver detalle
  el.cards.querySelectorAll("[data-open]").forEach(btn=>{
    btn.addEventListener("click", () => openModal(parseInt(btn.dataset.id, 10)));
  });
}

// Plantilla de tarjeta
function cardTemplate(p){
  const id = String(p.id).padStart(3,"0");
  return `<article class="card">
    <img alt="${p.name}" width="200" height="200" loading="lazy"
         src="${p.sprite}" />
    <h3>#${id} — <span class="capitalize">${p.name}</span></h3>
    <div class="mt-1">${p.types.map(t=>`<span class="pill capitalize">${t}</span>`).join("")}</div>
    <button class="btn-secondary mt-2" data-open data-id="${p.id}">Ver detalle</button>
  </article>`;
}

// Modal de detalle (fetch adicional para stats)
async function openModal(id){
  const r = await fetch(`${API}/pokemon/${id}`);
  const d = await r.json();
  const stats = d.stats.map(s => ({
    name: s.stat.name,
    base: s.base_stat
  }));

  el.modalBody.innerHTML = `
    <div class="flex items-center gap-4">
      <img src="${d.sprites.other["official-artwork"].front_default || d.sprites.front_default}" width="128" height="128" alt="${d.name}">
      <div>
        <h3 class="text-xl font-semibold capitalize">#${String(d.id).padStart(3,"0")} — ${d.name}</h3>
        <div class="mt-1">${d.types.map(t=>`<span class="pill capitalize">${t.type.name}</span>`).join("")}</div>
      </div>
    </div>
    <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
      ${stats.map(s=>`
        <div class="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
          <span class="capitalize">${s.name}</span>
          <span class="font-semibold tabular-nums">${s.base}</span>
        </div>
      `).join("")}
    </div>
  `;
  el.modal.showModal();
}

// Eventos UI
el.applyBtn.addEventListener("click", applyFilters);
el.resetBtn.addEventListener("click", resetFilters);
el.prev.addEventListener("click", ()=>{ state.page--; render(); });
el.next.addEventListener("click", ()=>{ state.page++; render(); });
el.closeModal.addEventListener("click", ()=> el.modal.close());
el.modal.addEventListener("click", (ev)=>{
  // cerrar si clic fuera del contenido
  const rect = ev.target.getBoundingClientRect?.();
  if(ev.target === el.modal) el.modal.close();
});

// Botón "arriba" (flotante en móvil)
window.addEventListener("scroll", () => {
  const show = window.scrollY > 400;
  el.fabTop.classList.toggle("hidden", !show);
});
el.fabTop.addEventListener("click", () => window.scrollTo({top: 0, behavior: "smooth"}));
el.toTop?.addEventListener("click", (e) => {
  e.preventDefault();
  window.scrollTo({top: 0, behavior: "smooth"});
});

// Inicializar
loadInitial().catch(err => {
  console.error(err);
  el.cards.innerHTML = `<p class="text-red-600">Error cargando datos. Intenta recargar.</p>`;
});
