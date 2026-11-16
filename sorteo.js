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
  // LUGARES: con el número público se sortean de una vez los lugares finales de la competencia (índice 0 = campeón … último = revancha).
  // Esto ES el resultado. Las carreras solo lo representan: se les puede cambiar el diseño, nunca el resultado.
  function baraja(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function lugares(numero,jugadores){return baraja(jugadores,rng32((numero^0x2B5E1A77)>>>0))}
  // REPARTO: qué jugador va en cada monito de una carrera ya animada. out = monitos que pasan (en orden de llegada);
  // elim = monitos eliminados (el peor primero). Pasan los mejores lugares; el orden de llegada se baraja para no revelar al campeón.
  function reparto(numero,lug,out,elim){const m=[],pasan=baraja(lug.slice(0,out.length),rng32((numero^0x7F4A7C15)>>>0));
    out.forEach((s,i)=>m[s]=pasan[i]);elim.forEach((s,i)=>m[s]=lug[out.length+elim.length-1-i]);return m}
  // SEMILLA: número público (seguidores al cierre) + clave secreta cuyo candado (sha256) se publicó ANTES de conocer el número.
  // Así nadie puede adelantar al campeón durante la semana, y nosotros no pudimos escoger la clave a conveniencia. Se revelan con la final.
  function semilla(numero,clave){const t=numero+'|'+clave;let h=0x811c9dc5;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,0x01000193)}return h>>>0}
  g.Sorteo={sorteo,elegibles,lugares,reparto,semilla};
  if(typeof module!=='undefined'){module.exports=g.Sorteo;
    if(require.main===module){const assert=require('assert'),P=['azul','rojo'],
      C=[{usuario:'a',personaje:'azul'},{usuario:'b',personaje:'azul'},{usuario:'c',personaje:'rojo'},{usuario:'b',personaje:'rojo'},{usuario:'d',personaje:'azul'},{usuario:'e',personaje:'verde'}];
      const L=elegibles(C,P);assert.deepStrictEqual(L,{azul:['a','d'],rojo:['c']});            // b comentó dos veces: fuera; verde no existe
      assert.deepStrictEqual(sorteo(3105,P,L),sorteo(3105,P,L));                                // mismo número, mismo sorteo
      const cnt={a:0,d:0};for(let s=0;s<4000;s++)cnt[sorteo(s,P,L).azul[0]]++;assert(Math.abs(cnt.a-2000)<200,JSON.stringify(cnt)); // parejo
      const J=[0,1,2,3,4,5,6,7,8,9],lg=lugares(3105,J);assert.deepStrictEqual(lg,lugares(3105,J));assert.deepStrictEqual(lg.slice().sort((a,b)=>a-b),J);
      const g1=Array(10).fill(0);for(let s=0;s<20000;s++)g1[lugares(s,J)[0]]++;assert(g1.every(v=>Math.abs(v-2000)<220),g1.join());           // cualquiera puede ser campeón, parejo
      const out=[7,2,9,0,4,5],el=[3,8,1,6],m=reparto(3105,lg,out,el);assert.deepStrictEqual(m.slice().sort((a,b)=>a-b),J);
      assert.deepStrictEqual(out.map(s=>m[s]).sort(),lg.slice(0,6).sort());assert.strictEqual(m[el[0]],lg[9]);                              // pasan los 6 mejores; el peor monito es el último lugar
      assert.strictEqual(semilla(3105,'abc'),semilla(3105,'abc'));assert.notStrictEqual(semilla(3105,'abc'),semilla(3106,'abc'));assert.notStrictEqual(semilla(3105,'abc'),semilla(3105,'abd'));
      console.log('sorteo OK',cnt,'campeones',g1.join())}}
})(typeof window!=='undefined'?window:globalThis);
