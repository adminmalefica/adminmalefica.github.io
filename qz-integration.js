// Ajustes del Master Malefica Burger
// Carta vigente + stock unificado + impresion TP95W + caja por forma de pago.

// Carta nueva: reemplaza solo hamburguesas/combos y conserva bebidas, papas y entradas.
(function(){
  try{
    const previous=new Map((products||[]).map(p=>[p.name,p]));
    const keep=(products||[]).filter(p=>p.cat!=='Hamburguesas' && p.cat!=='Combos');
    const imgFor=(...names)=>{for(const n of names){const p=previous.get(n);if(p&&p.img)return p.img;}return '';};
    const menu=[
      {name:'Combo Apertura',img:imgFor('Combo Apertura','Clásica Smash'),price:290,cat:'Hamburguesas',desc:'Pan tortuga · carne smash · queso cheddar · salsa Maléfica · papas chicas'},
      {name:'Smash Intensa',img:imgFor('Smash Intensa','Smash Picante'),price:390,cat:'Hamburguesas',desc:'Pan de queso · doble carne smash · extra queso cheddar · panceta · cebolla caramelizada · salsa barbacoa · salsa Tabasco'},
      {name:'Hechizo de Queso',img:imgFor('Hechizo de Queso'),price:430,cat:'Hamburguesas',desc:'Pan de queso · medallón de carne · extra cheddar · queso provolone · panceta · cebolla caramelizada · salsa Maléfica'},
      {name:'Doble Impacto + papas',img:imgFor('Doble Impacto','Doble Impacto + papas'),price:530,cat:'Hamburguesas',desc:'Pan de papa · doble medallón de carne · extra queso cheddar · panceta · cebolla caramelizada · salsa Maléfica · papas'},
      {name:'Mini Smash',img:imgFor('Mini Smash','Clásica Smash'),price:270,cat:'Hamburguesas',desc:'Pan tortuga · carne smash · queso cheddar · mayonesa · ketchup'},
      {name:'Combo Junior',img:imgFor('Combo Junior','Mini Smash'),price:350,cat:'Hamburguesas',desc:'Mini Smash · papas fritas · jugo chico'}
    ];
    products.splice(0,products.length,...menu,...keep);

    // Agrega Corona sin modificar las demas bebidas.
    if(!products.some(p=>p.name==='Cerveza Corona')){
      products.push({name:'Cerveza Corona',price:130,cat:'Cervezas',emoji:'🍺'});
    }else{
      const corona=products.find(p=>p.name==='Cerveza Corona');
      corona.price=130; corona.cat='Cervezas';
    }

    const style=document.createElement('style');
    style.id='malefica-compact-header';
    style.textContent=`header{padding:3px 10px 5px!important;min-height:0!important}header img{width:min(120px,34vw)!important;max-height:58px!important;margin:0 auto 1px!important}header p{font-size:11px!important;margin:0!important;line-height:1.1!important}nav{top:64px!important;padding:6px!important;gap:5px!important}nav button{padding:8px 10px!important;font-size:13px!important}main{padding-top:8px!important}#pedidos>h2{margin-top:2px!important;margin-bottom:7px!important}.grid{gap:8px!important}.product{padding:9px!important;min-height:72px!important}.product .foodimg,.product .foodemoji{height:92px!important;margin-bottom:7px!important}.product b{font-size:15px!important}.price{font-size:15px!important;margin-top:4px!important}.desc{font-size:11px!important;line-height:1.2!important;margin-top:5px!important}`;
    document.getElementById(style.id)?.remove();document.head.appendChild(style);
    try{renderProducts();}catch(e){}
  }catch(e){console.error('No se pudo aplicar la carta nueva:',e);}
})();

// Estado inicial limpio solicitado previamente: caja en cero y 60 hamburguesas.
(function(){
  const RESET_VERSION='2026-09-11-reset-60-v1';
  const resetNeeded=localStorage.getItem('master_reset_version')!==RESET_VERSION;
  if(resetNeeded){localStorage.setItem('master_sales','[]');localStorage.setItem('master_pending','[]');localStorage.setItem('master_expenses','[]');localStorage.setItem('master_next_order','1');localStorage.setItem('master_burger_stock','60');localStorage.setItem('master_reset_version',RESET_VERSION);try{sales=[];pending=[];expenses=[];nextOrderNo=1;cart=[];}catch(e){}}
  const burgerQty=Math.max(0,Number(localStorage.getItem('master_burger_stock')||60));
  try{stock=[{name:'Hamburguesas',qty:burgerQty,min:10,cost:0}];}catch(e){}
  localStorage.setItem('master_stock',JSON.stringify([{name:'Hamburguesas',qty:burgerQty,min:10,cost:0}]));
  setTimeout(function(){try{renderAll();}catch(e){}},0);
  document.addEventListener('change',function(e){if(!e.target.closest('#stockList'))return;try{const s=stock.find(x=>x.name==='Hamburguesas');if(s)localStorage.setItem('master_burger_stock',String(Math.max(0,Number(s.qty||0))));}catch(err){}},true);
})();

(function(){
  const PRINTER_NAME='TP95W Malefica',SIGNER_URL='http://127.0.0.1:8183';let securityReady=false;
  function money(n){try{return Number(n||0).toLocaleString('es-UY');}catch(e){return String(n||0);}}
  function safeText(v){return String(v==null?'':v).replace(/[\u2013\u2014]/g,'-').replace(/\u00d7/g,'x');}
  function configureQZSecurity(){if(securityReady||!window.qz)return;qz.security.setCertificatePromise(function(resolve,reject){fetch(SIGNER_URL+'/certificate',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Firmador local no disponible');return r.text();}).then(resolve).catch(reject);});qz.security.setSignatureAlgorithm('SHA512');qz.security.setSignaturePromise(function(toSign){return function(resolve,reject){fetch(SIGNER_URL+'/sign',{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:toSign,cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('No se pudo firmar la solicitud QZ');return r.text();}).then(sig=>resolve(sig.trim())).catch(reject);};});securityReady=true;}
  async function ensureQZ(){if(!window.qz)throw new Error('No se pudo cargar QZ Tray en la página.');configureQZSecurity();if(!qz.websocket.isActive())await qz.websocket.connect();}
  function buildTicket(sale){const ESC='\x1B',GS='\x1D';const when=sale.date?new Date(sale.date):new Date();const time=when.toLocaleTimeString('es-UY',{hour:'2-digit',minute:'2-digit'}),date=when.toLocaleDateString('es-UY');const items=(sale.items||[]).map(x=>`${x.qty} x ${safeText(x.name)}`).join('\n');const customer=safeText(sale.customer||''),obs=safeText(sale.obs||''),type=safeText(sale.type||''),source=safeText(sale.source||''),payment=safeText(sale.paymentMethod||''),payStatus=safeText(sale.paymentStatus||'');let t=ESC+'@'+ESC+'a'+'\x01'+ESC+'E'+'\x01'+'MALEFICA BURGER'+ESC+'E'+'\x00'+'\n';t+='PEDIDO Nro '+safeText(sale.no||'')+'\n'+date+' '+time+'\n--------------------------------\n'+ESC+'a'+'\x00';if(customer)t+='Cliente/Mesa: '+customer+'\n';if(type)t+='Tipo: '+type+'\n';if(source)t+='Origen: '+source+'\n';t+='--------------------------------\n'+ESC+'E'+'\x01'+items+ESC+'E'+'\x00'+'\n';if(obs)t+='--------------------------------\n'+ESC+'E'+'\x01'+'OBSERVACIONES'+ESC+'E'+'\x00'+'\n'+obs+'\n';t+='--------------------------------\nPago: '+payment+'\nEstado: '+payStatus+'\n'+ESC+'E'+'\x01'+'TOTAL: $'+money(sale.total)+ESC+'E'+'\x00'+'\n'+ESC+'d'+'\x04'+GS+'V'+'\x42'+'\x00';return t;}
  async function printSale(sale){await ensureQZ();const printer=await qz.printers.find(PRINTER_NAME);const config=qz.configs.create(printer,{encoding:'CP850'});await qz.print(config,[{type:'raw',format:'command',flavor:'plain',data:buildTicket(sale)}]);}
  function getSales(){try{return JSON.parse(localStorage.getItem('master_sales')||'[]');}catch(e){return[];}}
  function findNewSale(beforeIds){const after=getSales();for(let i=after.length-1;i>=0;i--)if(!beforeIds.has(after[i].id))return after[i];return null;}
  function burgerUnits(sale){let units=0;(sale.items||[]).forEach(item=>{let isBurger=false;try{const p=products.find(x=>x.name===item.name);isBurger=!!p&&p.cat==='Hamburguesas';}catch(e){isBurger=/smash|impacto|hechizo|combo apertura|combo junior/i.test(item.name||'');}if(isBurger)units+=Number(item.qty||0);});return units;}
  function discountBurgerStock(sale){const units=burgerUnits(sale);if(units<=0)return;const current=Math.max(0,Number(localStorage.getItem('master_burger_stock')||0)),next=Math.max(0,current-units);localStorage.setItem('master_burger_stock',String(next));try{stock=[{name:'Hamburguesas',qty:next,min:10,cost:0}];}catch(e){}localStorage.setItem('master_stock',JSON.stringify([{name:'Hamburguesas',qty:next,min:10,cost:0}]));try{renderStock();renderSummary();}catch(e){}}
  function installProductSelectionHighlight(){if(!document.getElementById('malefica-selected-product-style')){const s=document.createElement('style');s.id='malefica-selected-product-style';s.textContent='.product.malefica-selected{border:3px solid var(--orange)!important;box-shadow:0 0 0 2px rgba(255,122,0,.18)}';document.head.appendChild(s);}function sync(){let selected=new Set();try{if(Array.isArray(cart))cart.forEach(x=>selected.add(x.name));}catch(e){}document.querySelectorAll('.product').forEach(el=>{const name=(el.querySelector('b')?.textContent||'').trim();el.classList.toggle('malefica-selected',selected.has(name));});}document.addEventListener('click',e=>{if(e.target.closest('.product')||e.target.closest('#cart button'))setTimeout(sync,0);},true);const c=document.getElementById('cart');if(c)new MutationObserver(sync).observe(c,{childList:true,subtree:true,characterData:true});const p=document.getElementById('products');if(p)new MutationObserver(sync).observe(p,{childList:true,subtree:true});sync();}
  function installWrapper(){if(typeof window.saveOrder!=='function'){setTimeout(installWrapper,100);return;}if(window.saveOrder.__qzWrapped)return;const original=window.saveOrder;function wrapped(){const beforeIds=new Set(getSales().map(x=>x.id));const result=original.apply(this,arguments);setTimeout(async()=>{const sale=findNewSale(beforeIds);if(!sale)return;discountBurgerStock(sale);try{await printSale(sale);}catch(err){console.error('Error de impresion QZ:',err);alert('El pedido quedo guardado, pero no se pudo imprimir en la TP95W.\n\n'+(err&&err.message?err.message:err));}},50);return result;}wrapped.__qzWrapped=true;window.saveOrder=wrapped;}
  installProductSelectionHighlight();installWrapper();
})();

// Tocar la misma hamburguesa varias veces suma cantidad, no la cancela.
(function(){if(typeof window.addCart!=='function')return;const original=window.addCart;window.addCart=function(name){let p;try{p=products.find(x=>x.name===name);}catch(e){p=null;}if(!p||p.cat!=='Hamburguesas')return original.apply(this,arguments);let price=p.price;if(price<=0){let v=prompt('Ingresa el precio de '+name+':');if(v===null)return;price=Number(v||0);if(price<=0)return alert('Precio invalido.');}let existing=cart.find(x=>x.name===name);if(existing)existing.qty=Number(existing.qty||0)+1;else cart.push({name,price,qty:1});renderCart();};})();

// Caja separada por forma de pago.
(function(){function moneyCash(n){try{return Number(n||0).toLocaleString('es-UY');}catch(e){return String(n||0);}}function install(){if(typeof window.renderSales!=='function'){setTimeout(install,100);return;}if(window.renderSales.__cashBreakdownWrapped)return;const original=window.renderSales;function wrapped(){original.apply(this,arguments);const stats=document.getElementById('saleStats');if(!stats)return;let box=document.getElementById('paymentBreakdownBox');if(!box){box=document.createElement('div');box.id='paymentBreakdownBox';box.className='darkbox';box.innerHTML='<h3>💳 Caja por forma de pago</h3><div id="paymentBreakdown"></div>';stats.insertAdjacentElement('afterend',box);}const d=document.getElementById('filterDate')?.value||'';let list=[];try{list=(sales||[]).filter(s=>!d||String(s.date||'').slice(0,10)===d);}catch(e){}const paid=list.filter(s=>s.paymentStatus==='Pagado'),total=list.reduce((a,s)=>a+Number(s.total||0),0),collected=paid.reduce((a,s)=>a+Number(s.total||0),0),pendingTotal=list.filter(s=>s.paymentStatus!=='Pagado').reduce((a,s)=>a+Number(s.total||0),0),byMethod={};paid.forEach(s=>{const m=s.paymentMethod||'Sin dato';byMethod[m]=(byMethod[m]||0)+Number(s.total||0);});const units=list.reduce((a,s)=>a+(s.items||[]).reduce((b,x)=>b+Number(x.qty||0),0),0);stats.innerHTML='<div class="stat"><small>Ventas</small><strong>'+list.length+'</strong></div><div class="stat"><small>Facturacion</small><strong>$'+moneyCash(total)+'</strong></div><div class="stat"><small>Cobrado</small><strong>$'+moneyCash(collected)+'</strong></div>';const el=document.getElementById('paymentBreakdown'),methods=['Efectivo','Mercado Pago','POS','Transferencia','PedidosYa'];if(el)el.innerHTML=methods.map(m=>'<div class="list-item"><span>'+m+'</span><b>$'+moneyCash(byMethod[m]||0)+'</b></div>').join('')+'<div class="list-item"><span><b>Pendiente de cobro</b></span><b>$'+moneyCash(pendingTotal)+'</b></div><div class="list-item"><span>Productos vendidos</span><b>'+units+'</b></div>';}wrapped.__cashBreakdownWrapped=true;window.renderSales=wrapped;try{window.renderSales();}catch(e){}}install();})();
