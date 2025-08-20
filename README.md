# PokéDex Numar — Barra a la derecha

Proyecto educativo que consume la **PokeAPI** y muestra una Pokédex con:
- Búsqueda por nombre/ID
- Filtros por **tipo**
- Filtro por **generación**
- Ordenamiento por nombre o ID
- **Paginación**
- Modal con detalles
- **Barra lateral a la derecha** (en escritorio) y arriba en móvil

## Cómo usar
1. Abre `index.html` con Live Server o `python -m http.server`.
2. Requiere conexión a Internet (PokeAPI y Tailwind CDN).
3. La barra queda a la **derecha** en `md:` o mayor; en móvil se apila arriba.

## Estructura
- `index.html`: Maquetado (Tailwind por CDN). La barra está a la derecha via `md:flex-row-reverse` y `border-l`.
- `styles.css`: Animaciones y retoques.
- `script.js`: Lógica (fetch a PokeAPI, filtros, paginación, modal).

Hecho para Numar, con clases y comentarios en español.
