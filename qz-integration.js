// Ajustes del Master Malefica Burger
// Carta vigente + bebidas + encabezado compacto.
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
    removeWhere((n,p)=>(p.cat==='Bebidas'||p.cat==='Cervezas') && (n.includes('stella') || n.includes('zilertal') || n.includes('zillertal') || n.includes('mahou') || n.includes('corona')));
    products.push(
      {name:'Agua 500 ml',price:85,cat:'Bebidas',emoji:'💧'},
      {name:'Coca-Cola 600 cc',price:95,cat:'Bebidas',emoji:'🥤'},
      {name:'Coca-Cola 1.5 L',price:185,cat:'Bebidas',emoji:'🥤'},
      {name:'Cerveza Stella',price:130,cat:'Cervezas',emoji:'🍺'},
      {name:'Cerveza Zilertal 1 L',price:245,cat:'Cervezas',emoji:'🍺'},
      {name:'Cerveza Mahou',price:85,cat:'Cervezas',emoji:'🍺'},
      {name:'Cerveza Corona',price:130,cat:'Cervezas',emoji:'🍺'}
    );
    const style=document.createElement('style');
    style.id='malefica-compact-header';
    style.textContent=`header{padding:3px 10px 5px!important;min-height:0!important}header img{width:min(120px,34vw)!important;max-height:58px!important;margin:0 auto 1px!important}header p{font-size:11px!important;margin:0!important;line-height:1.1!important}nav{top:64px!important;padding:6px!important;gap:5px!important}nav button{padding:8px 10px!important;font-size:13px!important}main{padding-top:8px!important}#pedidos>h2{margin-top:2px!important;margin-bottom:7px!important}.grid{gap:8px!important}.product{padding:9px!important;min-height:72px!important}.product .foodimg,.product .foodemoji{height:92px!important;margin-bottom:7px!important}.product b{font-size:15px!important}.price{font-size:15px!important;margin-top:4px!important}.desc{font-size:11px!important;line-height:1.2!important;margin-top:5px!important}`;
    document.getElementById(style.id)?.remove();document.head.appendChild(style);
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
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function doPrint(i){
    try{
      const o=pending[i];
      if(!o){alert('No se encontro el pedido para imprimir.');return;}
      if(o.paymentStatus!=='Pagado'){alert('Primero confirma el pago.');return;}

      document.getElementById('malefica-ticket-print')?.remove();
      document.getElementById('malefica-ticket-print-style')?.remove();

      const ticket=document.createElement('div');
      ticket.id='malefica-ticket-print';
      ticket.innerHTML=`<h2>MALEFICA BURGER</h2><div>Pedido #${esc(o.no)}</div><div>${esc(o.customer||'')}</div><div>${esc(o.type)} - ${esc(o.source)}</div><div>${new Date(o.date).toLocaleString('es-UY')}</div><hr>${(o.items||[]).map(x=>`<div class="tr"><span>${esc(x.qty)} x ${esc(x.name)}</span><span>$${money(x.qty*x.price)}</span></div>`).join('')}<hr><div class="tt"><b>TOTAL $${money(o.total)}</b></div><b>${esc(o.paymentStatus)} - ${esc(o.paymentMethod)}</b>${o.obs?'<p>Obs: '+esc(o.obs)+'</p>':''}`;
      ticket.style.display='none';
      document.body.appendChild(ticket);

      const st=document.createElement('style');
      st.id='malefica-ticket-print-style';
      st.textContent='@media print{@page{size:80mm auto;margin:2mm}body>*{display:none!important}#malefica-ticket-print{display:block!important;position:absolute!important;left:0!important;top:0!important;width:72mm!important;background:#fff!important;color:#000!important;font-family:monospace!important;font-size:12px!important;padding:2mm!important}#malefica-ticket-print h2{text-align:center!important;color:#000!important;margin:0 0 8px!important}#malefica-ticket-print .tr{display:flex!important;justify-content:space-between!important;gap:6px!important;border-bottom:1px dashed #999!important;padding:4px 0!important}#malefica-ticket-print .tt{font-size:16px!important;margin:7px 0!important}}';
      document.head.appendChild(st);
      window.print();
    }catch(e){
      console.error('Error al imprimir:',e);
      alert('Error al preparar el ticket: '+e.message);
    }
  }

  window.maleficaPrintTicket=doPrint;
  window.printTicket=doPrint;

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
