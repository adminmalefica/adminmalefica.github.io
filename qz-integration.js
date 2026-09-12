// Estado inicial limpio solicitado: caja en cero y 60 hamburguesas.
(function(){
  const RESET_VERSION='2026-09-11-reset-60-v1';
  const resetNeeded=localStorage.getItem('master_reset_version')!==RESET_VERSION;

  if(resetNeeded){
    localStorage.setItem('master_sales','[]');
    localStorage.setItem('master_pending','[]');
    localStorage.setItem('master_expenses','[]');
    localStorage.setItem('master_next_order','1');
    localStorage.setItem('master_burger_stock','60');
    localStorage.setItem('master_reset_version',RESET_VERSION);
    try{ sales=[]; pending=[]; expenses=[]; nextOrderNo=1; cart=[]; }catch(e){}
  }

  const burgerQty=Math.max(0,Number(localStorage.getItem('master_burger_stock')||60));
  try{ stock=[{name:'Hamburguesas',qty:burgerQty,min:10,cost:0}]; }catch(e){}
  localStorage.setItem('master_stock',JSON.stringify([{name:'Hamburguesas',qty:burgerQty,min:10,cost:0}]));

  setTimeout(function(){
    try{ renderAll(); }catch(e){}
  },0);

  document.addEventListener('change',function(e){
    if(!e.target.closest('#stockList')) return;
    try{
      const s=stock.find(x=>x.name==='Hamburguesas');
      if(s) localStorage.setItem('master_burger_stock',String(Math.max(0,Number(s.qty||0))));
    }catch(err){}
  },true);
})();

(function(){
  const PRINTER_NAME='TP95W Malefica';
  const SIGNER_URL='http://127.0.0.1:8183';
  let securityReady=false;

  function money(n){
    try{return Number(n||0).toLocaleString('es-UY');}catch(e){return String(n||0);}
  }

  function safeText(v){
    return String(v==null?'':v)
      .replace(/[\u2013\u2014]/g,'-')
      .replace(/\u00d7/g,'x');
  }

  function configureQZSecurity(){
    if(securityReady || !window.qz) return;
    qz.security.setCertificatePromise(function(resolve,reject){
      fetch(SIGNER_URL+'/certificate',{cache:'no-store'})
        .then(function(r){if(!r.ok) throw new Error('Firmador local no disponible'); return r.text();})
        .then(resolve).catch(reject);
    });
    qz.security.setSignatureAlgorithm('SHA512');
    qz.security.setSignaturePromise(function(toSign){
      return function(resolve,reject){
        fetch(SIGNER_URL+'/sign',{
          method:'POST',
          headers:{'Content-Type':'text/plain;charset=UTF-8'},
          body:toSign,
          cache:'no-store'
        })
          .then(function(r){if(!r.ok) throw new Error('No se pudo firmar la solicitud QZ'); return r.text();})
          .then(function(sig){resolve(sig.trim());}).catch(reject);
      };
    });
    securityReady=true;
    console.log('Firma local QZ configurada.');
  }

  async function ensureQZ(){
    if(!window.qz) throw new Error('No se pudo cargar QZ Tray en la página.');
    configureQZSecurity();
    if(!qz.websocket.isActive()) await qz.websocket.connect();
  }

  function buildTicket(sale){
    const ESC='\x1B', GS='\x1D';
    const when = sale.date ? new Date(sale.date) : new Date();
    const time = when.toLocaleTimeString('es-UY',{hour:'2-digit',minute:'2-digit'});
    const date = when.toLocaleDateString('es-UY');
    const items=(sale.items||[]).map(x=>`${x.qty} x ${safeText(x.name)}`).join('\n');
    const customer=safeText(sale.customer||'');
    const obs=safeText(sale.obs||'');
    const type=safeText(sale.type||'');
    const source=safeText(sale.source||'');
    const payment=safeText(sale.paymentMethod||'');
    const payStatus=safeText(sale.paymentStatus||'');

    let ticket='';
    ticket += ESC+'@';
    ticket += ESC+'a'+'\x01';
    ticket += ESC+'E'+'\x01'+'MALEFICA BURGER'+ESC+'E'+'\x00'+'\n';
    ticket += 'PEDIDO Nro '+safeText(sale.no||'')+'\n';
    ticket += date+' '+time+'\n';
    ticket += '--------------------------------\n';
    ticket += ESC+'a'+'\x00';
    if(customer) ticket += 'Cliente/Mesa: '+customer+'\n';
    if(type) ticket += 'Tipo: '+type+'\n';
    if(source) ticket += 'Origen: '+source+'\n';
    ticket += '--------------------------------\n';
    ticket += ESC+'E'+'\x01'+items+ESC+'E'+'\x00'+'\n';
    if(obs){
      ticket += '--------------------------------\n';
      ticket += ESC+'E'+'\x01'+'OBSERVACIONES'+ESC+'E'+'\x00'+'\n';
      ticket += obs+'\n';
    }
    ticket += '--------------------------------\n';
    ticket += 'Pago: '+payment+'\n';
    ticket += 'Estado: '+payStatus+'\n';
    ticket += ESC+'E'+'\x01'+'TOTAL: $'+money(sale.total)+ESC+'E'+'\x00'+'\n';
    ticket += ESC+'d'+'\x04';
    ticket += GS+'V'+'\x42'+'\x00';
    return ticket;
  }

  async function printSale(sale){
    await ensureQZ();
    const printer=await qz.printers.find(PRINTER_NAME);
    const config=qz.configs.create(printer,{encoding:'CP850'});
    const data=[{type:'raw',format:'command',flavor:'plain',data:buildTicket(sale)}];
    await qz.print(config,data);
  }

  function getSales(){
    try{return JSON.parse(localStorage.getItem('master_sales')||'[]');}
    catch(e){return [];}
  }

  function findNewSale(beforeIds){
    const after=getSales();
    for(let i=after.length-1;i>=0;i--){
      if(!beforeIds.has(after[i].id)) return after[i];
    }
    return null;
  }

  function burgerUnits(sale){
    let units=0;
    (sale.items||[]).forEach(function(item){
      let isBurger=false;
      try{
        const p=products.find(x=>x.name===item.name);
        isBurger=!!p && (p.cat==='Hamburguesas' || item.name==='Combo Apertura' || item.name==='Combo Junior');
      }catch(e){
        isBurger=/smash|impacto|hechizo|combo apertura|combo junior/i.test(item.name||'');
      }
      if(isBurger) units+=Number(item.qty||0);
    });
    return units;
  }

  function discountBurgerStock(sale){
    const units=burgerUnits(sale);
    if(units<=0) return;
    const current=Math.max(0,Number(localStorage.getItem('master_burger_stock')||0));
    const next=Math.max(0,current-units);
    localStorage.setItem('master_burger_stock',String(next));
    try{ stock=[{name:'Hamburguesas',qty:next,min:10,cost:0}]; }catch(e){}
    localStorage.setItem('master_stock',JSON.stringify([{name:'Hamburguesas',qty:next,min:10,cost:0}]));
    try{ renderStock(); renderSummary(); }catch(e){}
  }

  function installProductSelectionHighlight(){
    if(!document.getElementById('malefica-selected-product-style')){
      const style=document.createElement('style');
      style.id='malefica-selected-product-style';
      style.textContent='.product.malefica-selected{border:3px solid var(--orange)!important;box-shadow:0 0 0 2px rgba(255,122,0,.18);transition:border-color .12s,box-shadow .12s;}';
      document.head.appendChild(style);
    }

    function syncSelectedProducts(){
      let selected=new Set();
      try{
        if(typeof cart!=='undefined' && Array.isArray(cart)) cart.forEach(x=>selected.add(x.name));
      }catch(e){}
      document.querySelectorAll('.product').forEach(el=>{
        const name=(el.querySelector('b')?.textContent||'').trim();
        el.classList.toggle('malefica-selected',selected.has(name));
      });
    }

    document.addEventListener('click',function(e){
      if(e.target.closest('.product') || e.target.closest('#cart button')) setTimeout(syncSelectedProducts,0);
    },true);

    const cartEl=document.getElementById('cart');
    if(cartEl){
      new MutationObserver(syncSelectedProducts).observe(cartEl,{childList:true,subtree:true,characterData:true});
    }
    const productsEl=document.getElementById('products');
    if(productsEl){
      new MutationObserver(syncSelectedProducts).observe(productsEl,{childList:true,subtree:true});
    }
    syncSelectedProducts();
  }

  function installWrapper(){
    if(typeof window.saveOrder!=='function'){
      setTimeout(installWrapper,100);
      return;
    }
    if(window.saveOrder.__qzWrapped) return;

    const original=window.saveOrder;
    function wrappedSaveOrder(){
      const beforeIds=new Set(getSales().map(x=>x.id));
      let result;
      try{ result=original.apply(this,arguments); }
      catch(err){ throw err; }

      setTimeout(async()=>{
        const sale=findNewSale(beforeIds);
        if(!sale) return;
        discountBurgerStock(sale);
        try{ await printSale(sale); }
        catch(err){
          console.error('Error de impresión QZ:',err);
          alert('El pedido quedó guardado, pero no se pudo imprimir en la TP95W.\n\n'+(err&&err.message?err.message:err));
        }
      },50);
      return result;
    }
    wrappedSaveOrder.__qzWrapped=true;
    window.saveOrder=wrappedSaveOrder;
    console.log('Integración TP95W/QZ Tray activa.');
  }

  installProductSelectionHighlight();
  installWrapper();
})();

// Las hamburguesas se acumulan por cantidad: tocar la misma otra vez suma 1.
(function(){
  if(typeof window.addCart!=='function') return;
  const originalAddCart=window.addCart;
  window.addCart=function(name){
    let p;
    try{ p=products.find(x=>x.name===name); }catch(e){ p=null; }
    if(!p || p.cat!=='Hamburguesas') return originalAddCart.apply(this,arguments);

    let price=p.price;
    if(price<=0){
      let v=prompt('Ingresá el precio de '+name+':');
      if(v===null) return;
      price=Number(v||0);
      if(price<=0) return alert('Precio inválido.');
    }

    let existing=cart.find(x=>x.name===name);
    if(existing){
      existing.qty=Number(existing.qty||0)+1;
    }else{
      cart.push({name,price,qty:1});
    }
    renderCart();
  };
})();

// Caja clara por forma de pago: separa efectivo, Mercado Pago, POS, transferencias y pendientes.
(function(){
  function moneyCash(n){
    try{return Number(n||0).toLocaleString('es-UY');}catch(e){return String(n||0);}
  }

  function installCashBreakdown(){
    if(typeof window.renderSales!=='function'){
      setTimeout(installCashBreakdown,100);
      return;
    }
    if(window.renderSales.__cashBreakdownWrapped) return;

    const originalRenderSales=window.renderSales;
    function renderCashBreakdown(){
      originalRenderSales.apply(this,arguments);
      const stats=document.getElementById('saleStats');
      if(!stats) return;

      let box=document.getElementById('paymentBreakdownBox');
      if(!box){
        box=document.createElement('div');
        box.id='paymentBreakdownBox';
        box.className='darkbox';
        box.innerHTML='<h3>💳 Caja por forma de pago</h3><div id="paymentBreakdown"></div>';
        stats.insertAdjacentElement('afterend',box);
      }

      let d='';
      const filter=document.getElementById('filterDate');
      if(filter) d=filter.value;
      let list=[];
      try{ list=(sales||[]).filter(s=>!d||String(s.date||'').slice(0,10)===d); }catch(e){}
      const paid=list.filter(s=>s.paymentStatus==='Pagado');
      const total=list.reduce((a,s)=>a+Number(s.total||0),0);
      const collected=paid.reduce((a,s)=>a+Number(s.total||0),0);
      const pendingTotal=list.filter(s=>s.paymentStatus!=='Pagado').reduce((a,s)=>a+Number(s.total||0),0);
      const byMethod={};
      paid.forEach(s=>{
        const m=s.paymentMethod||'Sin dato';
        byMethod[m]=(byMethod[m]||0)+Number(s.total||0);
      });

      const units=list.reduce((a,s)=>a+(s.items||[]).reduce((b,x)=>b+Number(x.qty||0),0),0);
      stats.innerHTML='<div class="stat"><small>Ventas</small><strong>'+list.length+'</strong></div>'+
        '<div class="stat"><small>Facturación</small><strong>$'+moneyCash(total)+'</strong></div>'+
        '<div class="stat"><small>Cobrado</small><strong>$'+moneyCash(collected)+'</strong></div>';

      const methods=['Efectivo','Mercado Pago','POS','Transferencia','PedidosYa'];
      const el=document.getElementById('paymentBreakdown');
      if(el){
        el.innerHTML=methods.map(m=>'<div class="list-item"><span>'+m+'</span><b>$'+moneyCash(byMethod[m]||0)+'</b></div>').join('')+
          '<div class="list-item"><span><b>Pendiente de cobro</b></span><b>$'+moneyCash(pendingTotal)+'</b></div>'+
          '<div class="list-item"><span>Productos vendidos</span><b>'+units+'</b></div>';
      }

      const cards=document.querySelectorAll('#salesList .darkbox');
      cards.forEach((card,i)=>{
        const sale=list[i];
        if(!sale || !sale.paymentMethod) return;
        if(card.querySelector('.cash-method-tag')) return;
        const tag=document.createElement('div');
        tag.className='cash-method-tag small muted';
        tag.textContent='Pago: '+sale.paymentMethod;
        card.appendChild(tag);
      });
    }
    renderCashBreakdown.__cashBreakdownWrapped=true;
    window.renderSales=renderCashBreakdown;

    const originalRenderAll=window.renderAll;
    if(typeof originalRenderAll==='function' && !originalRenderAll.__cashBreakdownWrapped){
      const wrappedRenderAll=function(){
        const r=originalRenderAll.apply(this,arguments);
        setTimeout(()=>{try{window.renderSales();}catch(e){}},0);
        return r;
      };
      wrappedRenderAll.__cashBreakdownWrapped=true;
      window.renderAll=wrappedRenderAll;
    }

    try{window.renderSales();}catch(e){}
  }

  installCashBreakdown();
})();
