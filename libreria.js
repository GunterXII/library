// ------- libreria.js -------

const myLibrary = [];
const bottone = document.getElementById("btnform");
const aggiungi = document.getElementById("bottone1");
const form = document.getElementById("form");
const checked = document.getElementById("checked");
const cross = document.getElementById("cross");
const output = document.getElementById("lista-cards");
const sortSelect = document.getElementById("sort");  // <select> per l’ordinamento
let contatore = 0;

// Inizializza stato completato nel form
form.dataset.completato = "false";
checked.style.cursor = cross.style.cursor = "pointer";
checked.style.filter = cross.style.filter = "grayscale(1)";

// Toggle completato nel form
checked.addEventListener("click", () => {
  form.dataset.completato = "true";
  checked.style.filter = "grayscale(0)";
  cross.style.filter = "grayscale(1)";
});
cross.addEventListener("click", () => {
  form.dataset.completato = "false";
  cross.style.filter = "grayscale(0)";
  checked.style.filter = "grayscale(1)";
});

// Classe Book con rating
class Book {
  constructor(autore, titolo, pagine, completato = false, rating = 0) {
    this.autore = autore;
    this.titolo = titolo;
    this.pagine = pagine;
    this.completato = completato;
    this.rating = rating;
    this.id = crypto.randomUUID();
  }
}

// Carica da localStorage
const saved = JSON.parse(localStorage.getItem("myLibrary"));
if (saved) {
  myLibrary.push(...saved);
  contatore = myLibrary.length;
}

// Salva su localStorage
function salva() {
  localStorage.setItem("myLibrary", JSON.stringify(myLibrary));
}

// Aggiunge un libro
function addBookToLibrary(autore, titolo, pagine, completato, rating = 0) {
  const libro = new Book(autore, titolo, pagine, completato, rating);
  myLibrary.push(libro);
  contatore++;
  salva();
}

// Riordina l'array al drop (drag & drop)
function reorderLibrary(dragIndex, dropIndex) {
  const [moved] = myLibrary.splice(dragIndex, 1);
  myLibrary.splice(dropIndex, 0, moved);
  salva();
}

// Applica ordinamento in base al valore di sortSelect
function applySort(arr) {
  const mode = sortSelect.value;
  return arr.slice().sort((a, b) => {
    if (mode === "titolo") return a.titolo.localeCompare(b.titolo);
    if (mode === "autore") return a.autore.localeCompare(b.autore);
    if (mode === "pagine") return a.pagine - b.pagine;
    if (mode === "rating") return b.rating - a.rating;
    return 0;
  });
}

// Render stelle
function renderStars(rating) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star" data-star="${i}">${i <= rating ? "★" : "☆"}</span>`;
  }
  return html;
}

// Mostra libreria
function mostraLibri() {
  output.innerHTML = "";
  let contaletti = 0;
  const list = applySort(myLibrary);

  list.forEach((book, index) => {
    const card = document.createElement("div");
    card.classList.add("card-libro");
    card.draggable = true;
    card.dataset.index = index;
    card.style.opacity = "0";
    card.style.transform = "scale(0.9)";
    card.innerHTML = `
      <h3 data-field="titolo">${book.titolo}</h3>
      <p><strong>Autore:</strong> <span data-field="autore">${book.autore}</span></p>
      <p><strong>Pagine:</strong> <span data-field="pagine">${book.pagine}</span></p>
      <p><em>ID:</em> ${book.id}</p>
      <p>Completato: ${book.completato ? "✅" : "❌"}</p>
      <div class="rating" data-index="${index}">${renderStars(book.rating)}</div>
      <img src="/svg/checked-tick-svgrepo-com.svg" width="20" class="check-completato" style="cursor:pointer">
      <img src="/svg/trash-2.svg" width="20" class="icona-trash" style="cursor:pointer">
    `;
    output.appendChild(card);

    // animazione entrata
    requestAnimationFrame(() => {
      card.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      card.style.opacity = "1";
      card.style.transform = "scale(1)";
    });

    if (book.completato) contaletti++;

    // Drag & drop
    card.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", card.dataset.index);
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });
    card.addEventListener("dragover", e => {
      e.preventDefault();
      card.classList.add("drag-over");
    });
    card.addEventListener("dragleave", () => {
      card.classList.remove("drag-over");
    });
    card.addEventListener("drop", e => {
      e.preventDefault();
      const dragIndex = Number(e.dataTransfer.getData("text/plain"));
      reorderLibrary(dragIndex, Number(card.dataset.index));
      mostraLibri();
    });

    // Toggle completato
    card.querySelector(".check-completato").addEventListener("click", () => {
      book.completato = !book.completato;
      salva();
      mostraLibri();
    });

    // Remove con fade-out
    card.querySelector(".icona-trash").addEventListener("click", () => {
      card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      card.style.opacity = "0";
      card.style.transform = "scale(0.8)";
      setTimeout(() => {
        const idx = myLibrary.findIndex(b => b.id === book.id);
        if (idx > -1) {
          myLibrary.splice(idx, 1);
          contatore--;
          salva();
          mostraLibri();
        }
      }, 300);
    });

    // Inline editing
    ["titolo","autore","pagine"].forEach(field => {
      const el = card.querySelector(`[data-field="${field}"]`);
      el.style.cursor = "text";
      el.addEventListener("dblclick", () => {
        const input = document.createElement("input");
        input.type = field === "pagine" ? "number" : "text";
        input.value = el.textContent;
        input.style.width = "100%";
        el.replaceWith(input);
        input.focus();
        function salvaEdit() {
          const val = input.value.trim();
          if (val) {
            book[field] = field === "pagine" ? Number(val) : val;
            salva();
            mostraLibri();
          } else {
            input.focus();
          }
        }
        input.addEventListener("blur", salvaEdit);
        input.addEventListener("keydown", e => {
          if (e.key === "Enter") salvaEdit();
        });
      });
    });

    // Rating click
    card.querySelector(".rating").addEventListener("click", e => {
      if (e.target.dataset.star) {
        book.rating = Number(e.target.dataset.star);
        salva();
        mostraLibri();
      }
    });

    // Scroll nuova card
    if (index === myLibrary.length - 1) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  // Aggiorna contatori
  document.getElementById("numero").textContent = contatore;
  document.getElementById("letto").textContent = contaletti;
}

// Ripple + apertura form
aggiungi.addEventListener("click", e => {
  const circle = document.createElement("span");
  circle.classList.add("ripple");
  aggiungi.appendChild(circle);
  const d = Math.max(aggiungi.clientWidth, aggiungi.clientHeight);
  circle.style.width = circle.style.height = d + "px";
  circle.style.left = e.clientX - aggiungi.offsetLeft - d/2 + "px";
  circle.style.top = e.clientY - aggiungi.offsetTop - d/2 + "px";
  setTimeout(() => circle.remove(), 600);

  form.classList.remove("nascondi");
  form.style.display = "block";
  void form.offsetWidth;
  form.classList.add("mostra");
});

// Submit form con animazione chiusura
bottone.addEventListener("click", e => {
  e.preventDefault();
  const a = document.getElementById("autore").value.trim();
  const t = document.getElementById("titolo").value.trim();
  const p = document.getElementById("pagine").value.trim();
  if (!a||!t||!p) { alert("Compila tutti i campi!"); return; }
  const comp = form.dataset.completato === "true";
  addBookToLibrary(a, t, p, comp);
  mostraLibri();
  document.getElementById("autore").value = "";
  document.getElementById("titolo").value = "";
  document.getElementById("pagine").value = "";
  form.dataset.completato = "false";
  checked.style.filter = cross.style.filter = "grayscale(1)";
  form.classList.remove("mostra");
  form.classList.add("nascondi");
  setTimeout(() => form.style.display = "none", 500);
});

// Gestione ordinamento
sortSelect.addEventListener("change", mostraLibri);

// Inizializza render
mostraLibri();
