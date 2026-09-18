// Ajustes del Master Malefica Burger
// Carta vigente + bebidas + pantalla principal compacta.
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

    const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
    const removeWhere=test=>{for(let i=products.length-1;i>=0;i--)if(test(norm(products[i].name),products[i]))products.splice(i,1);};
    removeWhere((n,p)=>p.cat==='Bebidas' && (n.startsWith('agua') || n.startsWith('cocacola600') || n.startsWith('cocacola15')));
    removeWhere((n,p)=>(p.cat==='Bebidas'||p.cat==='Cervezas') && (n.includes('stella') || n.includes('zilertal') || n.includes('zillertal') || n.includes('mahou') || n.includes('corona') || n.includes('budweiser') || n.includes('badwaiser') || n.includes('patricia')));

    products.push(
      {name:'Agua 500 ml',img:imgFor('Agua 500 ml'),price:85,cat:'Bebidas',emoji:'💧'},
      {name:'Coca-Cola 600 cc',img:imgFor('Coca-Cola 600 cc','Coca-Cola 600cc'),price:95,cat:'Bebidas',emoji:'🥤'},
      {name:'Coca-Cola 1.5 L',img:imgFor('Coca-Cola 1.5 L','Coca-Cola 1.5L'),price:185,cat:'Bebidas',emoji:'🥤'},
      {name:'Cerveza Stella',img:imgFor('Cerveza Stella','Stella'),price:135,cat:'Cervezas',emoji:'🍺'},
      {name:'Cerveza Corona',img:imgFor('Cerveza Corona','Corona'),price:120,cat:'Cervezas',emoji:'🍺'},
      {name:'Cerveza Zilertal 1 L',img:imgFor('Cerveza Zilertal 1 L','Zilertal 1L','Zillertal 1L'),price:245,cat:'Cervezas',emoji:'🍺'},
      {name:'Cerveza Mahou',img:imgFor('Cerveza Mahou','Mahou'),price:85,cat:'Cervezas',emoji:'🥫'}
    );

    const style=document.createElement('style');
    style.id='malefica-main-layout';
    style.textContent=`
      header{padding:2px 8px 3px!important;min-height:0!important;position:sticky!important}
      header img{width:min(105px,28vw)!important;max-height:46px!important;margin:0 auto!important}
      header p{font-size:10px!important;margin:0!important;line-height:1!important}
      nav{top:51px!important;padding:4px 6px!important;gap:4px!important;justify-content:center!important}
      nav button{padding:7px 10px!important;font-size:12px!important;border-radius:8px!important}
      main{max-width:1500px!important;padding:6px 8px!important}
      #pedidos>h2{display:none!important}
      #products{margin:0!important}
      .master-menu-board{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(340px,.85fr);gap:8px;align-items:start}
      .menu-panel{background:#151515;border:1px solid #ff7a00;border-radius:12px;padding:7px;min-width:0}
      .menu-title{margin:0 0 6px;color:#ff941f;text-align:center;font-size:18px;line-height:1}
      .burger-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}
      .drink-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}
      .compact-product{background:#222;border:1px solid #444;border-radius:9px;padding:5px;cursor:pointer;min-width:0;position:relative}
      .compact-product:hover{border-color:#ff7a00}
      .compact-product.selected{border:2px solid #ffd43b;box-shadow:0 0 0 1px rgba(255,212,59,.3)}
      .compact-product .product-quantity{position:absolute;left:5px;top:5px;z-index:2;display:flex;align-items:center;gap:3px;padding:2px 3px;border:1px solid #ffd43b;border-radius:7px;background:#111e;color:#fff;font-size:13px;font-weight:bold}
      .compact-product .product-quantity button{width:23px;height:23px;border:0;border-radius:5px;background:#ffd43b;color:#111;font-size:17px;font-weight:bold;cursor:pointer;padding:0}
      .compact-product .product-quantity button:focus-visible{outline:2px solid #fff;outline-offset:1px}
      .compact-product .foodimg{width:100%;height:66px;object-fit:cover;border-radius:7px;display:block;margin:0 0 4px;background:#111}
      .compact-product .foodemoji{height:44px;display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:3px}
      .compact-product b{display:block;font-size:12px;line-height:1.05;white-space:normal}
      .compact-product .price{position:absolute;right:5px;top:5px;background:#111c;color:#ff9b2f;padding:2px 5px;border-radius:6px;font-size:13px;font-weight:800;margin:0}
      .compact-product .desc{font-size:8.5px;line-height:1.12;color:#bbb;margin-top:3px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
      .right-stack{display:grid;gap:7px}
      .side-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}
      .side-grid .compact-product .foodimg{height:52px}
      .side-grid .compact-product .desc{display:none}
      #pedidos>.box{margin-top:8px!important}
      #pedidos>h2:nth-of-type(2){margin:8px 0!important;font-size:18px!important}
      @media(max-width:900px){.master-menu-board{grid-template-columns:1fr}.burger-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.drink-grid,.side-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
    document.getElementById(style.id)?.remove();
    document.head.appendChild(style);

    window.renderProducts=function(){
      const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const card=(p,drink=false)=>`<div class="compact-product product" data-product-name="${esc(p.name)}"><div class="price">$${money(p.price)}</div>${p.img?`<img class="foodimg" src="${p.img}" alt="${esc(p.name)}">`:`<div class="foodemoji">${p.emoji|| (drink?'🥤':'🍔')}</div>`}<b>${esc(p.name)}</b>${p.desc?`<div class="desc">${esc(p.desc)}</div>`:''}</div>`;
      const burgers=products.filter(p=>p.cat==='Hamburguesas');
      const drinks=products.filter(p=>p.cat==='Bebidas'||p.cat==='Cervezas');
      const extras=products.filter(p=>p.cat!=='Hamburguesas'&&p.cat!=='Bebidas'&&p.cat!=='Cervezas'&&p.cat!=='Combos');
      document.getElementById('products').innerHTML=`
        <div class="master-menu-board">
          <div class="menu-panel"><h2 class="menu-title">🍔 HAMBURGUESAS</h2><div class="burger-grid">${burgers.map(p=>card(p)).join('')}</div></div>
          <div class="right-stack">
            <div class="menu-panel"><h2 class="menu-title">🥤 BEBIDAS</h2><div class="drink-grid">${drinks.map(p=>card(p,true)).join('')}</div></div>
            ${extras.length?`<div class="menu-panel"><h2 class="menu-title">🍟 EXTRAS Y ENTRADAS</h2><div class="side-grid">${extras.map(p=>card(p)).join('')}</div></div>`:''}
          </div>
        </div>`;
      try{syncProductSelection();syncQuantities();}catch(e){}
    };

    function syncQuantities(){
      document.querySelectorAll('#products .compact-product[data-product-name]').forEach(card=>{
        const name=card.dataset.productName;
        const qty=cart.filter(item=>item.name===name).reduce((sum,item)=>sum+Number(item.qty||0),0);
        card.classList.toggle('selected',qty>0);
        let controls=card.querySelector('.product-quantity');
        if(!qty){controls?.remove();return;}
        if(!controls){
          controls=document.createElement('div');controls.className='product-quantity';
          const number=document.createElement('span');controls.appendChild(number);
          for(const [sign,label] of [['+','Agregar otro'],['−','Quitar uno']]){
            const button=document.createElement('button');button.type='button';button.textContent=sign;
            button.setAttribute('aria-label',label+' '+name);controls.appendChild(button);
          }
          card.prepend(controls);
        }
        controls.querySelector('span').textContent=String(qty);
      });
    }
    const cartNode=document.getElementById('cart');
    if(cartNode)new MutationObserver(syncQuantities).observe(cartNode,{childList:true,subtree:true});

    if(window.maleficaProductClickHandler)document.removeEventListener('click',window.maleficaProductClickHandler);
    window.maleficaProductClickHandler=function(e){
      const card=e.target.closest&&e.target.closest('.compact-product[data-product-name]');
      if(!card||e.maleficaProductHandled)return;
      e.maleficaProductHandled=true;
      e.stopImmediatePropagation();
      const button=e.target.closest('.product-quantity button');
      if(button){
        e.stopPropagation();
        const name=card.dataset.productName;
        if(button.textContent==='+')addCart(name);
        else{
          const index=cart.findIndex(item=>item.name===name);
          if(index!==-1){if(cart[index].qty>1)cart[index].qty--;else cart.splice(index,1);renderCart();}
        }
        return;
      }
      if(e.target.closest('.product-quantity'))return;
      addCart(card.dataset.productName);
    };
    document.addEventListener('click',window.maleficaProductClickHandler);

    try{renderProducts();}catch(e){}
  }catch(e){console.error('No se pudo aplicar la carta:',e);}
})();

// Tocar la misma hamburguesa varias veces suma cantidad.
(function(){
  if(typeof window.addCart!=='function')return;
  const original=window.addCart;
  window.addCart=function(name){
    let p;try{p=products.find(x=>x.name===name);}catch(e){p=null;}
    if(!p||p.cat!=='Hamburguesas')return original.apply(this,arguments);
    let existing=cart.find(x=>x.name===name);
    if(existing)existing.qty=Number(existing.qty||0)+1;else cart.push({name:p.name,price:p.price,qty:1});
    renderCart();
  };
})();

// Impresion de ticket robusta: captura directamente el click del boton Imprimir.
// Evita cargar dos veces la integracion QZ.
(function(){
  if(window.__maleficaQZPrintIntegrationInstalled)return;
  window.__maleficaQZPrintIntegrationInstalled=true;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const PRINTER_NAME='TP95W Malefica';
  const SIGNER_URL='http://127.0.0.1:8183';
  let securityReady=false;

  function configureQZSecurity(){
    if(securityReady||!window.qz)return;
    qz.security.setCertificatePromise(function(resolve,reject){
      fetch(SIGNER_URL+'/certificate',{cache:'no-store'})
        .then(function(r){if(!r.ok)throw new Error('Firmador local no disponible');return r.text();})
        .then(resolve).catch(reject);
    });
    qz.security.setSignatureAlgorithm('SHA512');
    qz.security.setSignaturePromise(function(toSign){
      return function(resolve,reject){
        fetch(SIGNER_URL+'/sign',{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:toSign,cache:'no-store'})
          .then(function(r){if(!r.ok)throw new Error('No se pudo firmar la solicitud QZ');return r.text();})
          .then(function(sig){resolve(sig.trim());}).catch(reject);
      };
    });
    securityReady=true;
  }

  function safeText(v){
    return String(v==null?'':v).replace(/[\u2013\u2014]/g,'-').replace(/\u00d7/g,'x');
  }

  async function ensureQZ(){
    if(!window.qz)throw new Error('No se pudo cargar QZ Tray.');
    configureQZSecurity();
    if(!qz.websocket.isActive())await qz.websocket.connect();
  }

  function buildRawTicket(o){
    const ESC='\x1B',GS='\x1D';
    const when=o.date?new Date(o.date):new Date();
    const items=(o.items||[]).map(x=>x.qty+' x '+safeText(x.name)+'   $'+money(x.qty*x.price)).join('\n');
    let ticket=ESC+'@'+ESC+'a'+'\x01'+ESC+'E'+'\x01'+'MALEFICA BURGER'+ESC+'E'+'\x00'+'\n';
    ticket+='PEDIDO Nro '+safeText(o.no||'')+'\n'+when.toLocaleDateString('es-UY')+' '+when.toLocaleTimeString('es-UY',{hour:'2-digit',minute:'2-digit'})+'\n';
    ticket+='--------------------------------\n'+ESC+'a'+'\x00';
    if(o.customer)ticket+='Cliente/Mesa: '+safeText(o.customer)+'\n';
    if(o.type)ticket+='Tipo: '+safeText(o.type)+'\n';
    if(o.source)ticket+='Origen: '+safeText(o.source)+'\n';
    ticket+='--------------------------------\n'+items+'\n';
    if(o.obs)ticket+='--------------------------------\nOBSERVACIONES\n'+safeText(o.obs)+'\n';
    ticket+='--------------------------------\nPago: '+safeText(o.paymentMethod||'')+'\nEstado: '+safeText(o.paymentStatus||'')+'\n';
    ticket+=ESC+'E'+'\x01'+'TOTAL: $'+money(o.total)+ESC+'E'+'\x00'+'\n\n\n';
    ticket+=GS+'V'+'\x00';
    return ticket;
  }

  async function printSale(o){
    await ensureQZ();
    const printer=await qz.printers.find(PRINTER_NAME);
    const config=qz.configs.create(printer,{encoding:'CP850'});
    await qz.print(config,[{type:'raw',format:'command',flavor:'plain',data:buildRawTicket(o)}]);
  }

  const printState=window.__maleficaPrintState||(window.__maleficaPrintState={printing:new Set(),recentlyPrinted:new Map()});
  const printing=printState.printing;
  const recentlyPrinted=printState.recentlyPrinted;
  async function doPrint(i){
    const o=pending[i];
    const key=o&&o.id;
    if(key&&(printing.has(key)||Date.now()-(recentlyPrinted.get(key)||0)<15000))return;
    if(key)printing.add(key);
    try{
      if(!o){alert('No se encontro el pedido para imprimir.');return;}
      if(o.paymentStatus!=='Pagado'){alert('Primero confirma el pago.');return;}
      await printSale(o);
      if(key)recentlyPrinted.set(key,Date.now());
    }catch(e){
      console.error('Error de impresión QZ:',e);
      alert('El pedido quedó guardado, pero no se pudo imprimir directamente. Verificá que QZ Tray esté abierto.\n\n'+e.message);
    }finally{if(key)setTimeout(()=>printing.delete(key),1500)}
  }

  window.maleficaPrintTicket=doPrint;
  window.printTicket=doPrint;

  // Imprimir al registrar un pedido pagado o confirmar el pago.
  // doPrint evita que el botón Imprimir genere una segunda copia inmediata.
  if(!window.__maleficaConfirmPaymentWrapped){
    const originalConfirmPayment=window.confirmPayment;
    if(typeof originalConfirmPayment==='function'){
      window.confirmPayment=function(i){
        const result=originalConfirmPayment.apply(this,arguments);
        if(pending[i]?.paymentStatus==='Pagado')setTimeout(()=>window.maleficaPrintTicket(i),0);
        return result;
      };
      window.__maleficaConfirmPaymentWrapped=true;
    }
  }

  if(!window.__maleficaSaveOrderWrapped){
    const originalSaveOrder=window.saveOrder;
    if(typeof originalSaveOrder==='function'){
      window.saveOrder=function(){
        const before=new Set(sales.map(x=>x.id));
        const result=originalSaveOrder.apply(this,arguments);
        const sale=sales.find(x=>!before.has(x.id));
        if(sale?.paymentStatus==='Pagado'){
          setTimeout(()=>{
            const i=pending.findIndex(x=>x.id===sale.id);
            if(i>=0)window.maleficaPrintTicket(i);
          },50);
        }
        return result;
      };
      window.__maleficaSaveOrderWrapped=true;
    }
  }

  document.addEventListener('click',function(e){
    const b=e.target.closest&&e.target.closest('button');
    if(!b)return;
    const attr=b.getAttribute('onclick')||'';
    const m=attr.match(/printTicket\((\d+)\)/);
    if(!m && !/imprimir/i.test(b.textContent||''))return;
    let i=m?Number(m[1]):-1;
    if(i<0){
      const boxes=[...document.querySelectorAll('#pending .darkbox')];
      const box=b.closest('.darkbox');
      i=boxes.indexOf(box);
    }
    if(i<0)return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    doPrint(i);
  },true);
})();
