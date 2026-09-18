"use strict";

const formatPrice = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const catalogCards = [...document.querySelectorAll("#catalogo .card")];
const productCards = [...document.querySelectorAll(".card")];
const unavailableModels = new Set([6, 11, 18, 24, 32, 38]);
const products = catalogCards.map((card, index) => {
  const model = index + 1;
  const name = card.querySelector(".meta b").textContent.trim();
  return {
    id: `forja-${model}`,
    name,
    model: `Modelo ${String(model).padStart(2, "0")}`,
    image: card.querySelector("img").getAttribute("src"),
    price: 14500 + ((model * 1900) % 18000),
    inStock: !unavailableModels.has(model),
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
  meta.querySelector("small").textContent = product.model;
  meta.insertAdjacentHTML("beforeend", `<div class="product-buy"><div><strong>${formatPrice.format(product.price)}</strong><span class="stock ${product.inStock ? "stock-yes" : "stock-no"}">${product.inStock ? "En stock" : "Sin stock"}</span></div><button class="add-to-cart" type="button" data-id="${product.id}" ${product.inStock ? "" : "disabled"}>${product.inStock ? "SUMAR AL CARRITO" : "AGOTADO"}</button></div>`);
});

document.addEventListener("click", (event) => {
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

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const item = cart.find((candidate) => candidate.id === button.dataset.id);
  if (button.dataset.action === "increase") item.quantity += 1;
  if (button.dataset.action === "decrease") item.quantity -= 1;
  if (button.dataset.action === "remove" || item.quantity === 0) cart = cart.filter((candidate) => candidate.id !== button.dataset.id);
  saveAndRender();
});

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

saveAndRender();
