(() => {
  const STORAGE_KEY = 'demo-kds-orders-v1';
  const $ = id => document.getElementById(id);
  let filter = 'active';
  let soundOn = true;
  let orders = loadOrders();
  let productRowId = 0;

  function loadOrders() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      {id:101, table:'Mesa 4', channel:'Salón', createdAt:Date.now()-7*60000, status:'pending', notes:'Sin cebolla', items:[{name:'Hamburguesa clásica',qty:2},{name:'Papas fritas',qty:1}]},
      {id:102, table:'Mesa 2', channel:'Salón', createdAt:Date.now()-13*60000, status:'preparing', notes:'Una limonada sin hielo', items:[{name:'Pollo a la plancha',qty:1},{name:'Limonada',qty:2}]},
      {id:103, table:'Para llevar', channel:'Para llevar', createdAt:Date.now()-3*60000, status:'pending', notes:'', items:[{name:'Pizza margarita',qty:1},{name:'Agua',qty:2}]}
    ];
  }
  function save() { try {
     localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); 
    } catch(e) {} }

  function escapeHtml(s) { 
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'

    }[c]));
   }
  function elapsed(ms) { const sec=Math.max(0,Math.floor(ms/1000)); const m=Math.floor(sec/60),s=sec%60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
  function statusLabel(s) { return ({pending:'Pendiente',preparing:'En preparación',ready:'Listo'})[s] || s; }
  function render() {
    const active=orders.filter(o=>o.status!=='ready');
    $('activeCount').textContent=active.length;
    $('pendingCount').textContent=orders.filter(o=>o.status==='pending').length;
    $('prepCount').textContent=orders.filter(o=>o.status==='preparing').length;
    $('readyCount').textContent=orders.filter(o=>o.status==='ready').length;
    const shown=orders.filter(o=>{
      if(filter==='active') return o.status!=='ready';
      if(filter==='all') return true;
      return o.status===filter;
    }).sort((a,b)=>{
      if(a.status==='ready'&&b.status!=='ready') return 1;
      if(b.status==='ready'&&a.status!=='ready') return -1;
      return a.createdAt-b.createdAt;
    });
    if(!shown.length) {
      $('board').innerHTML='<div class="empty"><strong>¡Todo al día!</strong>No hay pedidos en esta vista.</div>';
      return;
    }
    $('board').innerHTML=shown.map(o=>{
      const age=Date.now()-o.createdAt, late=age>=15*60000, medium=age>=8*60000;
      const items=o.items.map(i=>`<div class="item"><div class="qty">${i.qty}×</div><div><div class="item-name">${escapeHtml(i.name)}</div></div></div>`).join('');
      let next='';
      if(o.status==='pending') next=`<button class="btn primary" data-action="start" data-id="${o.id}">▶ Preparar</button>`;
      else if(o.status==='preparing') next=`<button class="btn primary" data-action="ready" data-id="${o.id}">✓ Marcar listo</button>`;
      else next=`<button class="btn" data-action="reopen" data-id="${o.id}">↶ Reabrir</button>`;
      return `<article class="order ${late&&o.status!=='ready'?'late':''}">
        <div class="order-head"><div><div class="order-no">#${o.id} · ${escapeHtml(o.table)}</div><div class="order-meta">${escapeHtml(o.channel)} · ${new Date(o.createdAt).toLocaleTimeString('es-SV',{hour:'2-digit',minute:'2-digit'})}</div><span class="status ${o.status}">${statusLabel(o.status)}</span></div>
        <div class="timer ${late&&o.status!=='ready'?'late':medium&&o.status!=='ready'?'medium':''}" data-time="${o.id}">${elapsed(age)}</div></div>
        <div class="items">${items}</div>
        ${o.notes?`<div class="order-note">📝 ${escapeHtml(o.notes)}</div>`:''}
        <div class="order-foot">${next}<button class="btn danger" data-action="delete" data-id="${o.id}" title="Eliminar pedido">✕</button></div>
      </article>`;
    }).join('');
  }
  function toast(message) { const t=$('toast');t.textContent=message;t.style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.style.display='none',2300); }
  function beep() { if(!soundOn) return; try { const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const ctx=new C(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=880;gain.gain.value=.08;osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.18);osc.onended=()=>ctx.close(); } catch(e) {} }
  function addOrder(data) {
    const id=orders.reduce((m,o)=>Math.max(m,Number(o.id)||0),100)+1;
    orders.push({id,createdAt:Date.now(),status:'pending',...data});
    save();filter='active';document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter));render();beep();toast(`Pedido #${id} enviado a cocina`);
  }
  function addProductRow(name='',qty=1) {
    const id=++productRowId, row=document.createElement('div');row.className='product-row';row.dataset.row=id;
    row.innerHTML=`<input class="product-name" aria-label="Producto" placeholder="Ej. Hamburguesa" value="${escapeHtml(name)}" maxlength="80" required><input class="product-qty" aria-label="Cantidad" type="number" min="1" max="99" value="${qty}" required>`;
    $('productRows').appendChild(row);
  }
  function openNewOrder() { $('orderForm').reset();$('productRows').innerHTML='';productRowId=0;addProductRow();$('orderDialog').showModal();$('table').focus(); }
  $('newBtn').addEventListener('click',openNewOrder);
  $('closeDialog').addEventListener('click',()=>$('orderDialog').close());
  $('cancelDialog').addEventListener('click',()=>$('orderDialog').close());
  $('addProduct').addEventListener('click',()=>addProductRow());
  $('orderForm').addEventListener('submit',e=>{
    e.preventDefault();
    const items=[...$('productRows').querySelectorAll('.product-row')].map(r=>({name:r.querySelector('.product-name').value.trim(),qty:Number(r.querySelector('.product-qty').value)})).filter(i=>i.name&&i.qty>0);
    if(!items.length){toast('Agrega al menos un producto');return;}
    addOrder({table:$('table').value.trim(),channel:$('channel').value,notes:$('notes').value.trim(),items});
    $('orderDialog').close();
  });
  $('filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===b));render();});
  $('board').addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b)return;
    const id=Number(b.dataset.id),o=orders.find(x=>Number(x.id)===id);if(!o)return;
    switch(b.dataset.action){
      case 'start':o.status='preparing';toast(`Pedido #${id} en preparación`);break;
      case 'ready':o.status='ready';o.readyAt=Date.now();toast(`Pedido #${id} listo`);break;
      case 'reopen':o.status='pending';o.createdAt=Date.now();delete o.readyAt;toast(`Pedido #${id} reabierto`);break;
      case 'delete':if(!confirm(`¿Eliminar el pedido #${id}?`))return;orders=orders.filter(x=>Number(x.id)!==id);toast(`Pedido #${id} eliminado`);break;
    }
    save();render();
  });
  
  $('demoBtn').addEventListener('click',()=>addOrder({table:['Mesa 1','Mesa 6','Para llevar'][Math.floor(Math.random()*3)],channel:'Salón',notes:'',items:[{name:'Combo de la casa',qty:1},{name:'Papas fritas',qty:1}]}));
  $('soundBtn').addEventListener('click',()=>{soundOn=!soundOn;$('soundBtn').textContent=`🔔 Sonido: ${soundOn?'activado':'desactivado'}`;if(soundOn)beep();});
  $('resetBtn').addEventListener('click',()=>{if(!confirm('¿Restablecer los pedidos de demostración? Se borrarán los pedidos actuales.'))return;orders=[
    {id:101,table:'Mesa 4',channel:'Salón',createdAt:Date.now()-7*60000,status:'pending',notes:'Sin cebolla',items:[{name:'Hamburguesa clásica',qty:2},{name:'Papas fritas',qty:1}]},
    {id:102,table:'Mesa 2',channel:'Salón',createdAt:Date.now()-13*60000,status:'preparing',notes:'Una limonada sin hielo',items:[{name:'Pollo a la plancha',qty:1},{name:'Limonada',qty:2}]},
    {id:103,table:'Para llevar',channel:'Para llevar',createdAt:Date.now()-3*60000,status:'pending',notes:'',items:[{name:'Pizza margarita',qty:1},{name:'Agua',qty:2}]}
  ];filter='active';document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter));save();render();toast('Demo restablecida');});
  // Actualiza cronómetros sin reconstruir las tarjetas.
  setInterval(()=>{document.querySelectorAll('[data-time]').forEach(el=>{const o=orders.find(x=>String(x.id)===el.dataset.time);if(!o)return;const age=Date.now()-o.createdAt;el.textContent=elapsed(age);el.classList.toggle('late',age>=15*60000&&o.status!=='ready');el.classList.toggle('medium',age>=8*60000&&age<15*60000&&o.status!=='ready');const card=el.closest('.order');if(card)card.classList.toggle('late',age>=15*60000&&o.status!=='ready');});},1000);
  render();
})();




























