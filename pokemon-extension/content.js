(function () {
    const backendUrl = "http://localhost:5000/api/pokemon";
    let currentIndex = 0;
    let pokemons = [];
    let debounceTimer = null;
  
    function makePopupDraggable(popup) {
      let isDragging = false, offsetX = 0, offsetY = 0;
  
      const header = popup.querySelector('.popup-header');
      if (!header) return;
  
      header.style.cursor = 'move';
      header.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - popup.getBoundingClientRect().left;
        offsetY = e.clientY - popup.getBoundingClientRect().top;
        document.addEventListener('mousemove', movePopup);
        document.addEventListener('mouseup', stopDragging);
      });
  
      function movePopup(e) {
        if (!isDragging) return;
        popup.style.left = `${e.clientX - offsetX}px`;
        popup.style.top = `${e.clientY - offsetY}px`;
      }
  
      function stopDragging() {
        isDragging = false;
        document.removeEventListener('mousemove', movePopup);
        document.removeEventListener('mouseup', stopDragging);
      }
    }
  
    function renderPopup() {
      let container = document.getElementById('pokemon-popup');
      if (!container) {
        container = document.createElement('div');
        container.id = 'pokemon-popup';
        container.style.cssText = `
          position: fixed; top: 10%; left: 10px; width: 250px; background: #fff;
          border: 2px solid #444; padding: 10px; z-index: 9999;
          box-shadow: 0 0 10px rgba(0,0,0,0.5); font-family: sans-serif;
        `;
        container.innerHTML = `
          <div class="popup-header" style="text-align: right;">
            <input type="text" id="manual-search" placeholder="Buscar Pokémon..." style="width: 70%">
            <button id="search-btn">🔍</button>
            <div style="margin-top:5px;">
              <button id="prev-pkmn">&lt;</button>
              <button id="next-pkmn">&gt;</button>
            </div>
          </div>
          <div id="popup-content"></div>
        `;
        document.body.appendChild(container);
        makePopupDraggable(container);
  
        // Flechas y búsqueda
        container.querySelector('#prev-pkmn').addEventListener('click', () => {
          if (pokemons.length === 0) return;
          currentIndex = (currentIndex - 1 + pokemons.length) % pokemons.length;
          updatePopupContent();
        });
  
        container.querySelector('#next-pkmn').addEventListener('click', () => {
          if (pokemons.length === 0) return;
          currentIndex = (currentIndex + 1) % pokemons.length;
          updatePopupContent();
        });
  
        container.querySelector('#manual-search').addEventListener('keypress', async (e) => {
          if (e.key === 'Enter') {
            const name = e.target.value.trim();
            if (name) {
              try {
                const res = await fetch(`${backendUrl}?name=${encodeURIComponent(name)}`);
                const data = await res.json();
                if (!data.error) {
                  pokemons.push(data);
                  currentIndex = pokemons.length - 1;
                  updatePopupContent();
                } else {
                  alert("Pokémon no encontrado.");
                }
              } catch {
                alert("Error al buscar el Pokémon.");
              }
            }
          }
        });
  
        container.querySelector('#search-btn').addEventListener('click', async () => {
          const name = container.querySelector('#manual-search').value.trim();
          if (name) {
            try {
              const res = await fetch(`${backendUrl}?name=${encodeURIComponent(name)}`);
              const data = await res.json();
              if (!data.error) {
                pokemons.push(data);
                currentIndex = pokemons.length - 1;
                updatePopupContent();
              } else {
                alert("Pokémon no encontrado.");
              }
            } catch {
              alert("Error al buscar el Pokémon.");
            }
          }
        });
      }
  
      updatePopupContent();
    }
  
    function updatePopupContent() {
      const content = document.getElementById('popup-content');
      if (!content) return;
  
      if (pokemons.length === 0) {
        content.innerHTML = `<p style="font-style:italic;color:#666;">No hay Pokémon cargados.</p>`;
        return;
      }
  
      const data = pokemons[currentIndex];
      content.innerHTML = `
        <h3>${data.name}</h3>
        <img src="${data.image}" alt="${data.name}" style="width: 100%">
        <p><strong>Type:</strong> ${data.type}</p>
        <p><strong>Débil contra:</strong> ${data.weak.join(", ") || "None"}</p>
        <p><strong>Resistente a:</strong> ${data.resistant.join(", ") || "None"}</p>
        <p><strong>Imune a:</strong> ${data.immune.join(", ") || "None"}</p>
      `;
    }
  
    async function processTable() {
      const columns = document.querySelectorAll('#pkmn-list .pkmn-list-column');
      const names = new Set();
  
      for (let i = 0; i < columns.length; i += 4) {
        const name = columns[i]?.innerText?.trim();
        if (name && name !== "Name") names.add(name);
      }
  
      const seen = new Set();
      const fetched = [];
      for (const name of names) {
        if (seen.has(name)) continue;
        seen.add(name);
  
        try {
          const res = await fetch(`${backendUrl}?name=${encodeURIComponent(name)}`);
          const data = await res.json();
          if (!data.error) fetched.push(data);
        } catch (err) {
          console.warn(`No se pudo obtener info de ${name}`, err);
        }
      }
  
      pokemons = fetched;
      currentIndex = 0;
      renderPopup();
    }
  
    function tryAttachObserver() {
        const container = document.querySelector('#pkmn-list')?.parentElement;
        if (container) {
          const observer = new MutationObserver(() => {
            processTable();
          });
      
          observer.observe(container, {
            childList: true,
            subtree: true,
          });
        } else {
          console.warn('[observer] Contenedor no encontrado, reintentando...');
          setTimeout(tryAttachObserver, 10000);
        }
      }
      
  
    tryAttachObserver();
  })();
  