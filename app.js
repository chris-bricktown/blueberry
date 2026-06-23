(function () {
  "use strict";

  const PRODUCTS = [
    { id: "fresh250", name: "생블루베리 250g", price: 7900, unit: "원",
      desc: "당일 수확해 바로 보내는 신선 생과", icon: "icon-berry", color: "#4b3f7a" },
    { id: "fresh500", name: "생블루베리 500g", price: 14500, unit: "원",
      desc: "가장 많이 찾는 인기 용량", icon: "icon-berry", color: "#5b4b95" },
    { id: "fresh1kg", name: "생블루베리 1kg", price: 26000, unit: "원",
      desc: "넉넉하게 즐기는 가족 세트", icon: "icon-berry", color: "#6a5ab0" },
    { id: "frozen1kg", name: "냉동 블루베리 1kg", price: 18000, unit: "원",
      desc: "급속냉동으로 영양과 맛을 그대로", icon: "icon-berry", color: "#6fa8dc" },
    { id: "jam240", name: "블루베리 잼 240g", price: 9500, unit: "원",
      desc: "과육이 살아있는 수제잼", icon: "icon-berry", color: "#7a3b69" },
    { id: "juice500", name: "블루베리 원액 500ml", price: 15000, unit: "원",
      desc: "물에 타 마시는 블루베리 주스 원액", icon: "icon-berry", color: "#3c3168" },
  ];

  const STORAGE_KEY = "blueberry-cart";
  let cart = loadCart();
  let pendingQty = {}; // 상품 카드의 수량 선택기 (장바구니에 담기 전 값)

  const productGrid = document.getElementById("productGrid");
  const cartItemsEl = document.getElementById("cartItems");
  const cartTotalEl = document.getElementById("cartTotal");
  const cartCountEl = document.getElementById("cartCount");
  const cartPanel = document.getElementById("cartPanel");
  const cartOverlay = document.getElementById("cartOverlay");
  const orderModal = document.getElementById("orderModal");
  const orderOverlay = document.getElementById("orderOverlay");
  const orderSummaryEl = document.getElementById("orderSummary");
  const toastEl = document.getElementById("toast");

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function formatPrice(n) {
    return n.toLocaleString("ko-KR") + "원";
  }

  function findProduct(id) {
    return PRODUCTS.find((p) => p.id === id);
  }

  function renderProducts() {
    productGrid.innerHTML = "";
    PRODUCTS.forEach((p) => {
      pendingQty[p.id] = pendingQty[p.id] || 1;
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <svg class="product-icon" color="${p.color}"><use href="#${p.icon}"></use></svg>
        <h3>${p.name}</h3>
        <p class="product-desc">${p.desc}</p>
        <p class="product-price">${formatPrice(p.price)}</p>
        <div class="product-actions">
          <div class="qty-control">
            <button data-action="dec" data-id="${p.id}" aria-label="수량 감소">−</button>
            <span data-qty="${p.id}">${pendingQty[p.id]}</span>
            <button data-action="inc" data-id="${p.id}" aria-label="수량 증가">+</button>
          </div>
          <button class="add-btn" data-action="add" data-id="${p.id}">담기</button>
        </div>
      `;
      productGrid.appendChild(card);
    });
  }

  productGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === "inc") {
      pendingQty[id] = Math.min(99, pendingQty[id] + 1);
      productGrid.querySelector(`[data-qty="${id}"]`).textContent = pendingQty[id];
    } else if (action === "dec") {
      pendingQty[id] = Math.max(1, pendingQty[id] - 1);
      productGrid.querySelector(`[data-qty="${id}"]`).textContent = pendingQty[id];
    } else if (action === "add") {
      addToCart(id, pendingQty[id]);
    }
  });

  function addToCart(id, qty) {
    cart[id] = (cart[id] || 0) + qty;
    saveCart();
    renderCart();
    showToast(`${findProduct(id).name} ${qty}개를 담았어요`);
  }

  function changeCartQty(id, delta) {
    if (!cart[id]) return;
    cart[id] += delta;
    if (cart[id] <= 0) delete cart[id];
    saveCart();
    renderCart();
  }

  function removeFromCart(id) {
    delete cart[id];
    saveCart();
    renderCart();
  }

  function cartTotal() {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = findProduct(id);
      return sum + (p ? p.price * qty : 0);
    }, 0);
  }

  function cartCount() {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }

  function renderCart() {
    const entries = Object.entries(cart);
    cartCountEl.textContent = cartCount();
    cartTotalEl.textContent = formatPrice(cartTotal());

    if (entries.length === 0) {
      cartItemsEl.innerHTML = '<p class="cart-empty">장바구니가 비어 있어요.</p>';
      return;
    }

    cartItemsEl.innerHTML = "";
    entries.forEach(([id, qty]) => {
      const p = findProduct(id);
      if (!p) return;
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <svg class="cart-item-icon" color="${p.color}"><use href="#${p.icon}"></use></svg>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">${formatPrice(p.price)} × ${qty} = ${formatPrice(p.price * qty)}</div>
        </div>
        <div class="qty-control">
          <button data-action="cart-dec" data-id="${id}" aria-label="수량 감소">−</button>
          <span>${qty}</span>
          <button data-action="cart-inc" data-id="${id}" aria-label="수량 증가">+</button>
        </div>
        <button class="cart-item-remove" data-action="cart-remove" data-id="${id}">삭제</button>
      `;
      cartItemsEl.appendChild(row);
    });
  }

  cartItemsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === "cart-inc") changeCartQty(id, 1);
    else if (action === "cart-dec") changeCartQty(id, -1);
    else if (action === "cart-remove") removeFromCart(id);
  });

  function openCart() {
    cartPanel.classList.add("open");
    cartOverlay.classList.add("show");
  }
  function closeCart() {
    cartPanel.classList.remove("open");
    cartOverlay.classList.remove("show");
  }
  document.getElementById("cartBtn").addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  cartOverlay.addEventListener("click", closeCart);

  function buildOrderSummary() {
    const entries = Object.entries(cart);
    if (entries.length === 0) return "장바구니가 비어 있습니다.";
    const lines = entries.map(([id, qty]) => {
      const p = findProduct(id);
      return `- ${p.name} x ${qty} = ${formatPrice(p.price * qty)}`;
    });
    lines.push("");
    lines.push(`총 합계: ${formatPrice(cartTotal())}`);
    lines.push("");
    lines.push("[블루베리팜 주문 요청입니다. 위 내용 확인 후 입금 안내 부탁드립니다.]");
    return lines.join("\n");
  }

  function openOrderModal() {
    if (Object.keys(cart).length === 0) {
      showToast("장바구니에 담긴 상품이 없어요");
      return;
    }
    const summary = buildOrderSummary();
    orderSummaryEl.value = summary;
    document.getElementById("smsOrderBtn").href = "sms:01000000000?body=" + encodeURIComponent(summary);
    orderModal.classList.add("open");
    orderOverlay.classList.add("show");
  }
  function closeOrderModal() {
    orderModal.classList.remove("open");
    orderOverlay.classList.remove("show");
  }
  document.getElementById("orderBtn").addEventListener("click", openOrderModal);
  document.getElementById("orderClose").addEventListener("click", closeOrderModal);
  orderOverlay.addEventListener("click", closeOrderModal);

  document.getElementById("copyOrderBtn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(orderSummaryEl.value);
      showToast("주문 내용을 복사했어요");
    } catch (e) {
      orderSummaryEl.select();
      showToast("복사 영역이 선택됐어요. Ctrl+C로 복사해주세요");
    }
  });

  let toastTimer = null;
  function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  renderProducts();
  renderCart();
})();
