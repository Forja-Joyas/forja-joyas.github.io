"use strict";

const formatPrice = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const catalogCards = [...document.querySelectorAll("#catalogo .card")];
const productCards = [...document.querySelectorAll(".card")];
const unavailableModels = new Set([6, 11, 18, 24, 32, 38]);
const materials = [
  { id: "acero-blanco", name: "Acero Blanco" },
  { id: "acero-quirurgico", name: "Acero Quirúrgico" },
  { id: "acero-dorado", name: "Acero Dorado" },
  { id: "plata-925", name: "Plata 925" },
  { id: "enchapados", name: "Enchapados" },
];
const products = catalogCards.map((card, index) => {
  const model = index + 1;
  const name = card.querySelector(".meta b").textContent.trim();
  const material = materials[index % materials.length];
  card.dataset.material = material.id;
  return {
    id: `forja-${model}`,
    name,
    model: `Modelo ${String(model).padStart(2, "0")}`,
    image: card.querySelector("img").getAttribute("src"),
    price: 14500 + ((model * 1900) % 18000),
    inStock: !unavailableModels.has(model),
    material,
  };
});

let cart = JSON.parse(localStorage.getItem("forja-cart") || "[]").filter((item) =>
  products.some((product) => product.id === item.id && product.inStock),
);
const savedBuyer = JSON.parse(localStorage.getItem("forja-buyer") || "{}");

const drawer = document.querySelector("#cart-drawer");
const backdrop = document.querySelector("#cart-backdrop");
const cartItems = document.querySelector("#cart-items");
const emptyState = document.querySelector("#cart-empty");
const checkoutForm = document.querySelector("#checkout-form");
const cartCount = document.querySelector("#cart-count");
const catalogResult = document.querySelector("#catalog-result");
const categoryNames = {
  todos: "todos los productos",
  collares: "todos los collares",
  pulseras: "todas las pulseras",
  anillos: "todos los anillos",
  aros: "todos los aros",
  accesorios: "todos los accesorios",
};

let activeCategory = "todos";
let activeMaterial = "todos";

function showCategory(category = "todos", shouldScroll = false) {
  const selectedCategory = categoryNames[category] ? category : "todos";
  const onlyInStock = document.querySelector("#stock-filter").checked;
  let visibleProducts = 0;
  activeCategory = selectedCategory;

  catalogCards.forEach((card, index) => {
    const productCategory = card.querySelector(".meta b").textContent.trim().split(" ")[0].toLowerCase();
    const matchesCategory = selectedCategory === "todos" || productCategory === selectedCategory;
    const matchesMaterial = activeMaterial === "todos" || products[index].material.id === activeMaterial;
    const isVisible = matchesCategory && matchesMaterial && (!onlyInStock || products[index].inStock);
    card.hidden = !isVisible;
    if (isVisible) visibleProducts += 1;
  });

  document.querySelectorAll(".catalog-filter").forEach((filter) => {
    filter.classList.toggle("is-active", filter.dataset.category === selectedCategory);
    filter.setAttribute("aria-current", filter.dataset.category === selectedCategory ? "true" : "false");
  });
  const materialLabel = activeMaterial === "todos" ? "" : ` en ${materials.find((material) => material.id === activeMaterial).name}`;
  const stockLabel = onlyInStock ? " disponibles" : "";
  catalogResult.textContent = visibleProducts
    ? `Mostrando ${categoryNames[selectedCategory]}${materialLabel}${stockLabel} · ${visibleProducts} piezas`
    : `Todavía no hay piezas publicadas en esta selección. Probá con otro filtro.`;

  if (shouldScroll) {
    document.querySelector("#catalogo").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function openCart() {
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  backdrop.hidden = false;
  requestAnimationFrame(() => backdrop.classList.add("is-visible"));
  document.body.classList.add("cart-open");
  document.querySelector("#close-cart").focus();
}

function closeCart() {
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  backdrop.classList.remove("is-visible");
  document.body.classList.remove("cart-open");
  setTimeout(() => { backdrop.hidden = true; }, 250);
}

function saveAndRender() {
  localStorage.setItem("forja-cart", JSON.stringify(cart));
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
  document.querySelector("#open-cart").setAttribute("aria-label", `Abrir carrito, ${totalItems} productos`);
  emptyState.hidden = cart.length > 0;
  checkoutForm.hidden = cart.length === 0;
  cartItems.innerHTML = cart.map((item) => {
    const product = products.find((candidate) => candidate.id === item.id);
    return `<article class="cart-item">
      <img src="${product.image}" alt="${product.name} ${product.model}" />
      <div class="cart-item-info"><small>${product.model}</small><h3>${product.name}</h3><span class="stock stock-yes">En stock</span>
        <div class="quantity"><button type="button" data-action="decrease" data-id="${product.id}" aria-label="Quitar una unidad">−</button><span>${item.quantity}</span><button type="button" data-action="increase" data-id="${product.id}" aria-label="Agregar una unidad">+</button></div>
      </div><div class="cart-item-side"><b>${formatPrice.format(product.price * item.quantity)}</b><button type="button" class="remove-item" data-action="remove" data-id="${product.id}">Eliminar</button></div>
    </article>`;
  }).join("");
  const total = cart.reduce((sum, item) => sum + products.find((product) => product.id === item.id).price * item.quantity, 0);
  document.querySelector("#cart-total").textContent = formatPrice.format(total);
}

productCards.forEach((card) => {
  const image = card.querySelector("img").getAttribute("src");
  const product = products.find((candidate) => candidate.image === image);
  if (!product) return;
  const meta = card.querySelector(".meta");
  meta.insertAdjacentHTML("afterbegin", `<span class="product-material">${product.material.name}</span>`);
  meta.querySelector("small").textContent = product.model;
  meta.insertAdjacentHTML("beforeend", `<div class="product-buy"><div><strong>${formatPrice.format(product.price)}</strong><span class="stock ${product.inStock ? "stock-yes" : "stock-no"}">${product.inStock ? "En stock" : "Sin stock"}</span></div><button class="add-to-cart" type="button" data-id="${product.id}" ${product.inStock ? "" : "disabled"}>${product.inStock ? "SUMAR AL CARRITO" : "AGOTADO"}</button></div>`);
});

document.addEventListener("click", (event) => {
  const categoryLink = event.target.closest('a[href="#collares"], a[href="#pulseras"], a[href="#anillos"], a[href="#aros"], a[href="#accesorios"], .catalog-filter');
  if (categoryLink) {
    event.preventDefault();
    const category = categoryLink.dataset.category || categoryLink.getAttribute("href").slice(1);
    history.replaceState(null, "", `#${category === "todos" ? "catalogo" : category}`);
    showCategory(category, true);
    return;
  }

  const button = event.target.closest(".add-to-cart");
  if (!button) return;
  const existing = cart.find((item) => item.id === button.dataset.id);
  if (existing) existing.quantity += 1;
  else cart.push({ id: button.dataset.id, quantity: 1 });
  saveAndRender();
  button.textContent = "AGREGADO ✓";
  setTimeout(() => { button.textContent = "SUMAR AL CARRITO"; }, 1100);
  openCart();
});

document.querySelectorAll(".material-filter, .material-nav a").forEach((control) => {
  control.addEventListener("click", (event) => {
    event.preventDefault();
    activeMaterial = control.dataset.material;
    document.querySelectorAll(".material-filter").forEach((filter) => {
      filter.classList.toggle("is-active", filter.dataset.material === activeMaterial);
      filter.setAttribute("aria-pressed", filter.dataset.material === activeMaterial ? "true" : "false");
    });
    document.querySelectorAll(".material-nav a").forEach((link) => {
      link.classList.toggle("is-active", link.dataset.material === activeMaterial);
    });
    showCategory(activeCategory, true);
  });
});

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const item = cart.find((candidate) => candidate.id === button.dataset.id);
  if (button.dataset.action === "increase") item.quantity += 1;
  if (button.dataset.action === "decrease") item.quantity -= 1;
  if (button.dataset.action === "remove" || item.quantity === 0) cart = cart.filter((candidate) => candidate.id !== button.dataset.id);
  saveAndRender();
});

document.querySelector("#stock-filter").addEventListener("change", () => showCategory(activeCategory));

document.querySelector("#open-cart").addEventListener("click", openCart);
document.querySelector("#close-cart").addEventListener("click", closeCart);
document.querySelector("#continue-shopping").addEventListener("click", closeCart);
backdrop.addEventListener("click", closeCart);
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeCart(); });

checkoutForm.elements.email.value = savedBuyer.email || "";
checkoutForm.elements.address.value = savedBuyer.address || "";
checkoutForm.addEventListener("input", () => {
  localStorage.setItem("forja-buyer", JSON.stringify({
    email: checkoutForm.elements.email.value,
    address: checkoutForm.elements.address.value,
  }));
});

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = document.querySelector("#form-message");
  message.textContent = "¡Gracias! Recibimos tu pedido. Te contactaremos por email para coordinar el pago y la entrega.";
  message.classList.add("success");
  message.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

const personalizeForm = document.querySelector("#personalize-form");
const engravingInput = document.querySelector("#engraving-text");
const fontSelect = document.querySelector("#font-style");
const engravingPreview = document.querySelector(".engraving-preview");

function updateEngravingPreview() {
  document.querySelector("#engraving-preview").textContent = engravingInput.value.trim() || "Tu diseño";
  engravingPreview.dataset.font = fontSelect.selectedOptions[0].dataset.style;
}

personalizeForm.addEventListener("input", updateEngravingPreview);
personalizeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = engravingInput.value.trim() || "una palabra a definir";
  const message = `Hola Forja, quiero personalizar una joya con el texto “${text}” y estilo de fuente ${fontSelect.value}.`;
  window.open(`https://wa.me/541162821988?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
});

const initialCategory = window.location.hash.slice(1);
showCategory(categoryNames[initialCategory] ? initialCategory : "todos");
updateEngravingPreview();

saveAndRender();
