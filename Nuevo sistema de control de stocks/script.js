// Clave para localStorage
const STORAGE_KEY = "webvic_stock_data_v1";

// Estado global
let state = {
  products: [], // [{ code, name, price, stock }]
  sales: [] // [{ id, code, name, qty, unitPrice, total, date, time, dateKey }]
};

// Utilidad: cargar estado desde localStorage
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.sales)) {
      state = parsed;
    }
  } catch (e) {
    console.error("Error al leer localStorage:", e);
  }
}

// Utilidad: guardar estado en localStorage
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Utilidad: formatear número a 2 decimales
function formatMoney(value) {
  return Number(value).toFixed(2);
}

// Devuelve YYYY-MM-DD de hoy
function getTodayKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Devuelve hora HH:MM
function getTime() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// Renderizar la tabla de productos
function renderProducts() {
  const tbody = document.getElementById("products-table-body");
  tbody.innerHTML = "";

  if (state.products.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "No hay productos cargados.";
    td.style.textAlign = "center";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  state.products.forEach((p) => {
    const tr = document.createElement("tr");

    const tdCode = document.createElement("td");
    tdCode.textContent = p.code;

    const tdName = document.createElement("td");
    tdName.textContent = p.name;

    const tdPrice = document.createElement("td");
    tdPrice.textContent = `$ ${formatMoney(p.price)}`;

    const tdStock = document.createElement("td");
    tdStock.textContent = p.stock;

    const badge = document.createElement("span");
    badge.classList.add("badge");
    if (p.stock === 0) {
      badge.classList.add("badge-zero");
      badge.textContent = "Sin stock";
    } else if (p.stock <= 5) {
      badge.classList.add("badge-low");
      badge.textContent = "Stock bajo";
    } else {
      badge.classList.add("badge-ok");
      badge.textContent = "OK";
    }
    tdStock.appendChild(document.createTextNode(" "));
    tdStock.appendChild(badge);

    const tdActions = document.createElement("td");

    const btnEdit = document.createElement("button");
    btnEdit.textContent = "Editar";
    btnEdit.className = "btn btn-secondary";
    btnEdit.onclick = () => loadProductIntoForm(p.code);

    const btnDelete = document.createElement("button");
    btnDelete.textContent = "Eliminar";
    btnDelete.className = "btn btn-secondary";
    btnDelete.style.marginLeft = "0.25rem";
    btnDelete.onclick = () => deleteProduct(p.code);

    tdActions.appendChild(btnEdit);
    tdActions.appendChild(btnDelete);

    tr.appendChild(tdCode);
    tr.appendChild(tdName);
    tr.appendChild(tdPrice);
    tr.appendChild(tdStock);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });
}

// Cargar producto en el formulario para editar
function loadProductIntoForm(code) {
  const p = state.products.find((prod) => prod.code === code);
  if (!p) return;
  document.getElementById("code").value = p.code;
  document.getElementById("name").value = p.name;
  document.getElementById("price").value = p.price;
  document.getElementById("stock").value = p.stock;
  document.getElementById("code").focus();
}

// Eliminar producto
function deleteProduct(code) {
  const confirmed = confirm(
    `¿Seguro que querés eliminar el producto con código "${code}"?`
  );
  if (!confirmed) return;
  state.products = state.products.filter((p) => p.code !== code);
  saveState();
  renderProducts();
}

// Renderizar ventas del día
function renderSales() {
  const tbody = document.getElementById("sales-table-body");
  const labelDate = document.getElementById("today-date-label");
  const dayTotalSpan = document.getElementById("day-total");

  const todayKey = getTodayKey();
  labelDate.textContent = todayKey;

  tbody.innerHTML = "";

  const salesToday = state.sales.filter((s) => s.dateKey === todayKey);

  if (salesToday.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.textContent = "No hay ventas registradas hoy.";
    td.style.textAlign = "center";
    tr.appendChild(td);
    tbody.appendChild(tr);
    dayTotalSpan.textContent = "0.00";
    return;
  }

  let dayTotal = 0;

  salesToday.forEach((s) => {
    const tr = document.createElement("tr");

    const tdTime = document.createElement("td");
    tdTime.textContent = s.time;

    const tdCode = document.createElement("td");
    tdCode.textContent = s.code;

    const tdName = document.createElement("td");
    tdName.textContent = s.name;

    const tdQty = document.createElement("td");
    tdQty.textContent = s.qty;

    const tdUnit = document.createElement("td");
    tdUnit.textContent = `$ ${formatMoney(s.unitPrice)}`;

    const tdTotal = document.createElement("td");
    tdTotal.textContent = `$ ${formatMoney(s.total)}`;

    const tdActions = document.createElement("td");
    const btnRemove = document.createElement("button");
    btnRemove.className = "btn btn-secondary";
    btnRemove.textContent = "Eliminar";
    btnRemove.onclick = () => removeSale(s.id);
    tdActions.appendChild(btnRemove);

    tr.appendChild(tdTime);
    tr.appendChild(tdCode);
    tr.appendChild(tdName);
    tr.appendChild(tdQty);
    tr.appendChild(tdUnit);
    tr.appendChild(tdTotal);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);

    dayTotal += s.total;
  });

  dayTotalSpan.textContent = formatMoney(dayTotal);
}

// Registrar venta
function handleSaleForm(event) {
  event.preventDefault();
  const codeInput = document.getElementById("sale-code");
  const qtyInput = document.getElementById("sale-qty");

  const code = codeInput.value.trim();
  const qty = parseInt(qtyInput.value, 10);

  if (!code || !qty || qty <= 0) {
    alert("Completá código y cantidad correctamente.");
    return;
  }

  const product = state.products.find(
    (p) => p.code.toLowerCase() === code.toLowerCase()
  );
  if (!product) {
    alert("No existe un producto con ese código.");
    return;
  }

  if (product.stock < qty) {
    alert(`Stock insuficiente. Stock actual: ${product.stock}`);
    return;
  }

  // Actualizar stock
  product.stock -= qty;

  // Crear registro de venta
  const dateKey = getTodayKey();
  const time = getTime();
  const sale = {
    id: Date.now() + "-" + Math.random().toString(16).slice(2),
    code: product.code,
    name: product.name,
    qty,
    unitPrice: Number(product.price),
    total: Number(product.price) * qty,
    dateKey,
    time
  };

  state.sales.push(sale);
  saveState();

  // Limpiar campos de venta
  qtyInput.value = "";
  codeInput.value = "";
  codeInput.focus();

  renderProducts();
  renderSales();
}

// Eliminar venta (para “arrepentidos”) y devolver stock
function removeSale(id) {
  const sale = state.sales.find((s) => s.id === id);
  if (!sale) return;

  const confirmed = confirm(
    `¿Eliminar la venta de ${sale.qty} x "${sale.name}"? Esto devolverá el stock.`
  );
  if (!confirmed) return;

  // Devolver stock
  const product = state.products.find((p) => p.code === sale.code);
  if (product) {
    product.stock += sale.qty;
  }

  // Eliminar la venta del estado
  state.sales = state.sales.filter((s) => s.id !== id);
  saveState();

  renderProducts();
  renderSales();
}

// Manejo del formulario de productos
function handleProductForm(event) {
  event.preventDefault();
  const codeInput = document.getElementById("code");
  const nameInput = document.getElementById("name");
  const priceInput = document.getElementById("price");
  const stockInput = document.getElementById("stock");

  const code = codeInput.value.trim();
  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value);
  const stock = parseInt(stockInput.value, 10);

  if (!code || !name || isNaN(price) || isNaN(stock) || stock < 0) {
    alert("Completá todos los campos de producto correctamente.");
    return;
  }

  const existingIndex = state.products.findIndex(
    (p) => p.code.toLowerCase() === code.toLowerCase()
  );

  if (existingIndex >= 0) {
    // Actualizar producto existente
    state.products[existingIndex] = {
      ...state.products[existingIndex],
      code,
      name,
      price,
      stock
    };
  } else {
    // Crear nuevo producto
    state.products.push({ code, name, price, stock });
  }

  saveState();
  renderProducts();

  // Limpiar
  codeInput.value = "";
  nameInput.value = "";
  priceInput.value = "";
  stockInput.value = "";
  codeInput.focus();
}

// Limpiar formulario de productos
function resetProductForm() {
  document.getElementById("product-form").reset();
  document.getElementById("code").focus();
}

// Descargar backup JSON
function downloadBackup() {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `backup_stock_${getTodayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Restaurar desde backup JSON
function restoreFromBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed || !Array.isArray(parsed.products) || !Array.isArray(parsed.sales)) {
        alert("El archivo no tiene el formato esperado.");
        return;
      }
      const confirmed = confirm(
        "Esto reemplazará el inventario y las ventas actuales por los del archivo. ¿Continuar?"
      );
      if (!confirmed) return;

      state = parsed;
      saveState();
      renderProducts();
      renderSales();
      alert("Backup restaurado correctamente.");
    } catch (err) {
      console.error(err);
      alert("Error al leer el archivo. ¿Es un JSON válido?");
    } finally {
      // limpiar input para poder volver a elegir el mismo archivo si hace falta
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

// Inicialización
function init() {
  loadState();
  renderProducts();
  renderSales();

  document
    .getElementById("product-form")
    .addEventListener("submit", handleProductForm);

  document
    .getElementById("product-form-reset")
    .addEventListener("click", resetProductForm);

  document
    .getElementById("sale-form")
    .addEventListener("submit", handleSaleForm);

  document
    .getElementById("backup-download")
    .addEventListener("click", downloadBackup);

  document
    .getElementById("backup-upload")
    .addEventListener("change", restoreFromBackup);
}

document.addEventListener("DOMContentLoaded", init);
