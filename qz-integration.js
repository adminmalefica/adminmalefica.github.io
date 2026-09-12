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

    // Limpia variantes/duplicados de bebidas y deja una sola ficha por producto.
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
