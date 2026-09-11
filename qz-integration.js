(function(){
  const PRINTER_NAME='TP95W Malefica';

  function money(n){
    try{return Number(n||0).toLocaleString('es-UY');}catch(e){return String(n||0);}
  }

  function safeText(v){
    return String(v==null?'':v)
      .replace(/[\u2013\u2014]/g,'-')
      .replace(/\u00d7/g,'x');
  }

  async function ensureQZ(){
    if(!window.qz) throw new Error('No se pudo cargar QZ Tray en la página.');
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
    ticket += '\n\n\n';
    ticket += GS+'V'+'\x00';
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
      try{
        result=original.apply(this,arguments);
      }catch(err){
        throw err;
      }

      setTimeout(async()=>{
        const sale=findNewSale(beforeIds);
        if(!sale) return;
        try{
          await printSale(sale);
        }catch(err){
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

  installWrapper();
})();
