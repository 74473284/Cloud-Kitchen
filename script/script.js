// ------ Data ------
const MENU = [
  { id: 'm1', name: 'Veg Steamed Momos', price: 99, category: 'Veg', img: 'vegsteam.jpg', desc: 'Soft, juicy veg filling. Served with red chutney.', spicy: 1, bestseller: true },
  { id: 'm2', name: 'Paneer Steamed Momos', price: 129, category: 'Veg', img: 'paneersteam.png', desc: 'Creamy paneer, fresh herbs.', spicy: 1 },
  { id: 'm3', name: 'Chicken Steamed Momos', price: 139, category: 'Non-Veg', img: 'chicken steam.jpg', desc: 'Classic chicken, perfectly seasoned.', spicy: 1, bestseller: true },
  { id: 'm4', name: 'Veg Fried Momos', price: 129, category: 'Veg', img: 'veg fried.jpg', desc: 'Crispy outside, juicy inside.', spicy: 2 },
  { id: 'm5', name: 'Chicken Fried Momos', price: 149, category: 'Non-Veg', img: 'chicken fried.jpg', desc: 'Golden fried chicken momos.', spicy: 2 },
  { id: 'm6', name: 'Tandoori Veg Momos', price: 159, category: 'Tandoori', img: 'veg tandoori.jpg', desc: 'Smoky, spicy tandoori glaze.', spicy: 3, bestseller: true },
  { id: 'm7', name: 'Tandoori Chicken Momos', price: 179, category: 'Tandoori', img: 'chicken tandoori.jpg', desc: 'Bold flavors from the tandoor.', spicy: 3 },
  { id: 'm8', name: 'Cheese Burst Momos', price: 169, category: 'Veg', img: 'cheese.jpg', desc: 'Molten cheese with herbs.', spicy: 1 },
  { id: 'm9', name: 'Peri Peri Momos', price: 169, category: 'Veg', img: 'peri-peri.jpg', desc: 'Fiery peri-peri sprinkle.', spicy: 3 },
  { id: 's1', name: 'French Fries', price: 89, category: 'Sides', img: 'french.jpg', desc: 'Crispy salted fries.', spicy: 0 },
  { id: 's2', name: 'Cold Coffee', price: 99, category: 'Beverages', img: 'colcoffee.jpg', desc: 'Chilled, strong & sweet.', spicy: 0 },
  { id: 's3', name: 'lemon Ice Tea', price: 39, category: 'Beverages', img: 'lamon ice tea.jpg', desc: 'Freshly brewed Ice Tea.', spicy: 0 },
];

// ------ Utilities ------
const el = (sel) => document.querySelector(sel);
const fmt = (n) => n.toLocaleString('en-IN');

// ------ State ------
const state = {
  items: [...MENU],
  filters: { search: '', category: 'all', veg: false, spicy: false, bestseller: false, sort: 'popularity' },
  cart: /** @type {Record<string,{id:string,name:string,price:number,qty:number,img:string}>} */ (JSON.parse(localStorage.getItem('pmb_cart')||'{}')),
  history: JSON.parse(localStorage.getItem('pmb_orders')||'[]'),
};

// ------ Render Menu ------
const grid = el('#grid');
function renderMenu(){
  const { search, category, veg, spicy, bestseller, sort } = state.filters;
  let list = [...state.items];
  if (search) list = list.filter(i => (i.name + ' ' + i.desc).toLowerCase().includes(search.toLowerCase()));
  if (category !== 'all') list = list.filter(i => i.category === category);
  if (veg) list = list.filter(i => i.category === 'Veg' || i.category === 'Tandoori' && !/chicken/i.test(i.name));
  if (spicy) list = list.filter(i => i.spicy >= 2);
  if (bestseller) list = list.filter(i => i.bestseller);
  switch (sort){
    case 'priceAsc': list.sort((a,b)=>a.price-b.price); break;
    case 'priceDesc': list.sort((a,b)=>b.price-a.price); break;
    case 'name': list.sort((a,b)=>a.name.localeCompare(b.name)); break;
    default: /* popularity pseudo */ list.sort((a,b)=> (b.bestseller?1:0) - (a.bestseller?1:0));
  }

  grid.innerHTML = list.map(i=>`
    <article class="card" data-id="${i.id}">
      <img src="${i.img}" alt="${i.name}" loading="lazy" />
      <div class="body">
        <div class="title">${i.name}</div>
        <div class="desc">${i.desc}</div>
        <div class="meta">${badge(i.category)} ${spice(i.spicy)} ${i.bestseller? '<span title="Bestseller">⭐ Bestseller</span>':''}</div>
        <div class="price-row">
          <strong>₹ ${fmt(i.price)}</strong>
          <button class="btn add" data-id="${i.id}">Add</button>
        </div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.add').forEach(btn=>btn.addEventListener('click', e=>{
    const id = e.currentTarget.getAttribute('data-id');
    addToCart(id);
  }));
}

function badge(cat){
  const emoji = ({'Veg':'🥦','Non-Veg':'🍗','Tandoori':'🔥','Sides':'🍟','Beverages':'🥤'})[cat] || '🥟';
  return `<span title="${cat}">${emoji} ${cat}</span>`;
}
function spice(level){
  return `<span title="Spice level">${'🌶️'.repeat(level)}</span>`;
}

// ------ Cart ------
const cartDrawer = el('#cartDrawer');
const cartItemsEl = el('#cartItems');
const cartQty = el('#cartQty');

function openCart(){ cartDrawer.classList.add('open'); cartDrawer.setAttribute('aria-hidden','false'); }
function closeCart(){ cartDrawer.classList.remove('open'); cartDrawer.setAttribute('aria-hidden','true'); }

el('#openCart').addEventListener('click', openCart);
el('#closeCart').addEventListener('click', closeCart);

function addToCart(id, qty=1){
  const item = MENU.find(x=>x.id===id);
  if(!item) return;
  if(!state.cart[id]) state.cart[id] = { id, name: item.name, price: item.price, qty: 0, img: item.img };
  state.cart[id].qty += qty;
  persistCart();
  renderCart();
  openCart();
}

function updateQty(id, qty){
  if(!state.cart[id]) return;
  state.cart[id].qty = Math.max(1, qty);
  persistCart();
  renderCart();
}

function removeItem(id){ delete state.cart[id]; persistCart(); renderCart(); }

function persistCart(){ localStorage.setItem('pmb_cart', JSON.stringify(state.cart)); }

function cartTotals(){
  const items = Object.values(state.cart);
  const subtotal = items.reduce((s,i)=> s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.05);
  const delivery = subtotal >= 499 || subtotal===0 ? 0 : 29;
  const grand = subtotal + tax + delivery;
  return { subtotal, tax, delivery, grand };
}

function renderCart(){
  const items = Object.values(state.cart);
  cartItemsEl.innerHTML = items.length ? items.map(i=>`
    <div class="cart-item">
      <img src="${i.img}" alt="${i.name}" />
      <div>
        <div style="display:flex; justify-content:space-between; gap:8px; align-items:center;">
          <strong style="color:var(--accent)">${i.name}</strong>
          <button class="remove" data-id="${i.id}">Remove</button>
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:6px;">
          <div class="qty">
            <button data-act="dec" data-id="${i.id}">−</button>
            <span>${i.qty}</span>
            <button data-act="inc" data-id="${i.id}">+</button>
          </div>
          <strong>₹ ${fmt(i.price * i.qty)}</strong>
        </div>
      </div>
      <div></div>
    </div>
  `).join('') : `<p style="color:var(--muted); text-align:center; padding:20px;">Your basket is empty. Add some delicious momos!</p>`;

  cartItemsEl.querySelectorAll('button').forEach(btn=>{
    const id = btn.getAttribute('data-id');
    const act = btn.getAttribute('data-act');
    if (btn.classList.contains('remove')) btn.addEventListener('click', ()=>removeItem(id));
    if (act==='inc') btn.addEventListener('click', ()=>{ state.cart[id].qty++; persistCart(); renderCart(); });
    if (act==='dec') btn.addEventListener('click', ()=>{ if(state.cart[id].qty>1){ state.cart[id].qty--; persistCart(); renderCart(); } });
  });

  const { subtotal, tax, delivery, grand } = cartTotals();
  el('#subTotal').textContent = fmt(subtotal);
  el('#tax').textContent = fmt(tax);
  el('#delivery').textContent = fmt(delivery);
  el('#grand').textContent = fmt(grand);
  cartQty.textContent = items.reduce((s,i)=>s+i.qty,0);
  el('#deliveryLabel').innerHTML = delivery === 0 && subtotal>0 ? '<strong style="color:var(--success)">Free</strong>' : `₹ <span id="delivery">${fmt(delivery)}</span>`;
}

// Quick Reorder (re-adds last order if exists)
el('#quickReorder').addEventListener('click', ()=>{
  const last = state.history[state.history.length-1];
  if(!last){ alert('No past order found. Add items to cart!'); return; }
  last.items.forEach(it=> addToCart(it.id, it.qty));
});

// ------ Filters & Search ------
el('#search').addEventListener('input', e=>{ state.filters.search = e.target.value; renderMenu(); });
el('#sort').addEventListener('change', e=>{ state.filters.sort = e.target.value; renderMenu(); });
el('#category').addEventListener('change', e=>{ state.filters.category = e.target.value; renderMenu(); });
document.querySelectorAll('.chip').forEach(c=>{
  c.addEventListener('click', ()=>{
    const key = c.dataset.filter;
    c.classList.toggle('active');
    state.filters[key] = c.classList.contains('active');
    renderMenu();
  });
});

// ------ Checkout ------
const checkoutBtn = el('#checkoutBtn');
const modal = el('#checkoutModal');
const cancelCheckout = el('#cancelCheckout');
const form = el('#checkoutForm');
const successBox = el('#orderSuccess');

checkoutBtn.addEventListener('click', ()=>{
  if(Object.keys(state.cart).length===0){ alert('Your basket is empty!'); return; }
  modal.classList.add('open');
});
cancelCheckout.addEventListener('click', ()=> modal.classList.remove('open'));
modal.addEventListener('click', (e)=>{ if(e.target===modal) modal.classList.remove('open'); });

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const totals = cartTotals();
  const order = {
    id: 'PMB' + Math.random().toString(36).slice(2,8).toUpperCase(),
    ts: new Date().toISOString(),
    items: Object.values(state.cart),
    totals,
    customer: data,
  };
  // Apply promo code (example: PMB50 => ₹50 off if grand ≥ 299)
  if(data.promo && data.promo.trim().toUpperCase()==='PMB50' && totals.grand >= 299){
    order.totals.promo = 50;
    order.totals.grand = order.totals.grand - 50;
  }
  // Save order history
  state.history.push(order);
  localStorage.setItem('pmb_orders', JSON.stringify(state.history));
  // Clear cart
  state.cart = {}; persistCart(); renderCart();

  // Confirmation UI
  successBox.classList.add('show');
  successBox.innerHTML = `
    <h3 style="color:var(--success);">✅ Order Confirmed!</h3>
    <p>Order ID: <strong>${order.id}</strong></p>
    <p>Amount Paid: <strong>₹ ${fmt(order.totals.grand)}</strong> • Payment: <strong>${data.payment}</strong></p>
    <p>Thanks, <strong>${data.name}</strong>! Your delicious momos are on the way to <strong>${data.address}</strong>.</p>
    <div style="margin-top:14px; display:flex; gap:10px; justify-content:center;">
      <button class="btn" id="closeModalAfter">Close</button>
      <button class="btn ghost" id="reorderNow">Re-order Same</button>
    </div>
  `;
  el('#closeModalAfter').addEventListener('click', ()=> modal.classList.remove('open'));
  el('#reorderNow').addEventListener('click', ()=>{
    modal.classList.remove('open');
    order.items.forEach(it=> addToCart(it.id, it.qty));
  });
});

// ------ Init ------
renderMenu();
renderCart();
el('#year').textContent = new Date().getFullYear();

// Keyboard shortcuts
window.addEventListener('keydown', (e)=>{
  if(e.key==='c' && (e.ctrlKey || e.metaKey)) openCart();
  if(e.key==='Escape') { closeCart(); modal.classList.remove('open'); }
});

const sliderWrapper = document.querySelector('.slider-wrapper');
const slides = document.querySelectorAll('.slide');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');
let index = 0;

function showSlide(i) {
  index = (i + slides.length) % slides.length;
  sliderWrapper.style.transform = `translateX(-${index * 100}%)`;
}

prevBtn.addEventListener('click', () => showSlide(index - 1));
nextBtn.addEventListener('click', () => showSlide(index + 1));

setInterval(() => showSlide(index + 1), 5000);
