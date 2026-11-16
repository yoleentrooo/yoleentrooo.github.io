// Sorteo de jugadores: un jugador por personaje, entre todos los que lo comentaron bien, una sola vez y dentro de la hora.
// Mismo número (el público de las 10 am) => mismo sorteo. No depende de nadie: node sorteo.js corre la comprobación.
(function(g){
  function rng32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  // listas: {personaje:[usuarios elegibles EN ORDEN DE COMENTARIO]}; personajes en el orden fijo del video.
  // Devuelve por personaje la lista completa ya barajada: el primero juega; si no cumple los requisitos, entra el que sigue.
  function sorteo(numero,personajes,listas){
    const r=rng32((numero^0x51ED270B)>>>0),out={};
    for(const p of personajes){const a=(listas[p]||[]).slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}out[p]=a}
    return out}
  // Elegibles: quien comentó más de una vez (cualquier personaje) queda fuera. comentarios: [{usuario,personaje}] en orden de hora.
  function elegibles(comentarios,personajes){
    const n={};for(const c of comentarios)n[c.usuario]=(n[c.usuario]||0)+1;
    const l={};for(const p of personajes)l[p]=[];
    for(const c of comentarios)if(n[c.usuario]===1&&l[c.personaje])l[c.personaje].push(c.usuario);
    return l}
  g.Sorteo={sorteo,elegibles};
  if(typeof module!=='undefined'){module.exports=g.Sorteo;
    if(require.main===module){const assert=require('assert'),P=['azul','rojo'],
      C=[{usuario:'a',personaje:'azul'},{usuario:'b',personaje:'azul'},{usuario:'c',personaje:'rojo'},{usuario:'b',personaje:'rojo'},{usuario:'d',personaje:'azul'},{usuario:'e',personaje:'verde'}];
      const L=elegibles(C,P);assert.deepStrictEqual(L,{azul:['a','d'],rojo:['c']});            // b comentó dos veces: fuera; verde no existe
      assert.deepStrictEqual(sorteo(3105,P,L),sorteo(3105,P,L));                                // mismo número, mismo sorteo
      const cnt={a:0,d:0};for(let s=0;s<4000;s++)cnt[sorteo(s,P,L).azul[0]]++;assert(Math.abs(cnt.a-2000)<200,JSON.stringify(cnt)); // parejo
      console.log('sorteo OK',cnt)}}
})(typeof window!=='undefined'?window:globalThis);
