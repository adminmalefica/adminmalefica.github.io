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
