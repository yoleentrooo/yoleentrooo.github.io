// SOLO UNO — Prueba 1 "EL RECORRIDO". Sin pantalla. Mismo número => misma carrera, siempre.
// Los 10 jugadores son idénticos: misma velocidad base, mismas probabilidades. Solo cambia el azar del número.
(function(root){
function rng32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const DT=1/60,V=4.8,META=262;
// Probabilidades (iguales para todos). Están aquí juntas para que cualquiera las pueda revisar.
const P={falsas:2,          // losetas falsas por fila (de 9)
  martilloFalla:.16,        // se avienta mal al martillo
  martilloAguanta:.45,      // tras el golpe se queda en la pista (si no, cae)
  rodilloResbala:.26,       // resbala en un rodillo
  agarre:.45,               // al caer de lado, alcanza a agarrarse de la orilla
  sogaLimpio:.60,sogaOrilla:.22, // soga: cae limpio / queda colgado de la orilla / (resto) no llega
  bolaEsquiva:.80};         // esquiva una bola en la rampa
const Z={losetas:{s0:12,filas:20,prof:2.5,cols:9},martillos:[76,86,96,106],rodillos:[[122,132],[136,146],[150,160]],soga:{a:180,b:188,x:[-4,-2,0,2,4],T:2.6},rampa:{a:210,b:256}};
function makeCarrera(players,seed,keep){
  keep=keep||6;const rnd=rng32(seed*7919+101);
  const g={t:0,ev:[],done:false,over:false,endT:0,keep,balls:[],bolas:[],orden:[],out:null,elim:null,tiles:[],hams:[],ropes:[],stats:{caidas:0,agarres:0,aguantes:0,golpes:0}};
  const L=Z.losetas;
  for(let r=0;r<L.filas;r++){const solid=r%5===0,row=[];const fk=new Set();if(!solid)while(fk.size<P.falsas)fk.add(Math.floor(rnd()*L.cols));
    for(let c=0;c<L.cols;c++)row.push({falsa:fk.has(c),caida:false,tc:0,pisada:false});g.tiles.push(row)}
  Z.martillos.forEach((s,i)=>g.hams.push({s,T:2.3+rnd()*.5,ph:rnd()*6.283,x:0}));
  Z.soga.x.forEach((x,i)=>g.ropes.push({x,ph:i*1.2566+rnd()*.5,u:0,ocupada:null}));
  const lanes=players.map((_,i)=>i);for(let i=lanes.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[lanes[i],lanes[j]]=[lanes[j],lanes[i]]}
  players.forEach((id,i)=>g.balls.push({id,s:2+ (lanes[i]%2)*1.6,x:(lanes[i]-4.5)*.9,y:0,tx:(lanes[i]-4.5)*.9,st:'run',tmr:0,cp:2,home:(lanes[i]-4.5)*.9,w:.5+rnd()*.7,ph:rnd()*6.283,col:-1,fila:-1,
    inm:0,vistas:new Set(),hamOk:-1,rodDado:-1,rodEn:0,rope:-1,lugar:0,vis:{rot:0},bolaDado:0}));
  const ev=(type,o)=>{if(g.ev.length<300)g.ev.push(Object.assign({type,t:g.t},o||{}))};
  const caer=(b,cp,why)=>{b.st='fall';b.tmr=1.15;b.cp=cp;g.stats.caidas++;ev('fall',{id:b.id,why})};
  const hamX=(h,t)=>4.6*Math.sin(6.283*t/h.T+h.ph);
  g.step=function(){
    if(g.done)return;g.t+=DT;const t=g.t;
    if(g.over){if(t>=g.endT)g.done=true}
    for(const h of g.hams)h.x=hamX(h,t);
    for(const r of g.ropes)r.u=.5-.5*Math.cos(6.283*t/Z.soga.T+r.ph); // 0 = orilla de salida, 1 = orilla de llegada
    // bolas de la rampa
    if(t>3&&Math.floor(t/1.35)!==Math.floor((t-DT)/1.35))g.bolas.push({s:Z.rampa.b+2,x:(rnd()*2-1)*4.2,id:g.bolas.length});
    for(const o of g.bolas)o.s-=7*DT;g.bolas=g.bolas.filter(o=>o.s>Z.rampa.a-3);
    if(g.over&&t<g.endT){/* los que no clasificaron se quedan donde están */}
    // el orden en que se atiende a los jugadores rota en cada paso, para que nadie tenga ventaja por su lugar en la lista
    g.paso=(g.paso||0)+1;const nB=g.balls.length;
    for(let kk=0;kk<nB;kk++){const b=g.balls[(kk+g.paso)%nB];
      if(b.st==='done'){b.s+=V*.7*DT*(b.s<META+7?1:0);continue}
      if(g.over)continue;
      if(b.st==='fall'){b.tmr-=DT;b.y-=9*DT;if(b.tmr<=0){b.st='respawn';b.tmr=.75;b.s=b.cp;b.y=6;b.x=b.tx=Math.max(-3.6,Math.min(3.6,b.x));b.col=-1;b.fila=-1;b.rope=-1;ev('respawn',{id:b.id})}continue}
      if(b.st==='respawn'){b.tmr-=DT;b.y=Math.max(0,6*(b.tmr/.75));if(b.tmr<=0){b.st='run';b.y=0}continue}
      if(b.st==='stun'||b.st==='hang'){b.tmr-=DT;if(b.tmr<=0){if(b.st==='hang'){ev('climb',{id:b.id});g.stats.agarres++}else{ev('recover',{id:b.id});g.stats.aguantes++}b.st='run';b.y=0;b.x=b.tx=Math.max(-4,Math.min(4,b.x))}continue}
      if(b.st==='slide'){b.tmr-=DT;b.s-=11*DT*Math.max(0,b.tmr);b.x+=Math.max(-3*DT,Math.min(3*DT,b.tx-b.x));if(b.tmr<=0){b.st='stun';b.tmr=.7;b.inm=1.6}continue}
      if(b.st==='swing'){const r=g.ropes[b.rope];b.tmr-=DT;const u=1-b.tmr/(Z.soga.T/2);b.s=Z.soga.a+(Z.soga.b-Z.soga.a)*Math.min(1,u);b.y=-1.2*Math.sin(Math.PI*Math.min(1,u))+.3;b.x=r.x;
        if(b.tmr<=0){r.ocupada=null;b.rope=-1;const d=rnd();
          if(d<P.sogaLimpio){b.st='run';b.y=0;b.s=Z.soga.b+.3;ev('land',{id:b.id})}
          else if(d<P.sogaLimpio+P.sogaOrilla){b.st='hang';b.tmr=1.5;b.s=Z.soga.b-.1;b.y=-1;ev('grab',{id:b.id})}
          else caer(b,Z.soga.a-3,'soga')}continue}
      if(b.inm>0)b.inm-=DT;
      const sp=V*(1+.05*Math.sin(t*b.w+b.ph));let v=sp,prev=b.s;
      // — zona 1: losetas falsas —
      const f=Math.floor((b.s+.35-L.s0)/L.prof);
      if(f>=0&&f<L.filas&&f!==b.fila){const c0=b.col<0?Math.max(0,Math.min(8,Math.round(b.x+4))):b.col,row=g.tiles[f];let best=[],bs=-1;
        // puede brincar a una loseta vecina; si las vecinas ya son hoyo, alcanza una más lejos
        for(const alc of[1,2,8]){for(let c=c0-alc;c<=c0+alc;c++){if(c<0||c>8)continue;const tl=row[c],sc=tl.caida?0:tl.pisada?3:1;if(sc>bs){bs=sc;best=[c]}else if(sc===bs&&!best.includes(c))best.push(c)}if(bs>0)break}
        if(bs===3&&rnd()<.3){const nu=[];for(let c=c0-1;c<=c0+1;c++)if(c>=0&&c<=8&&!row[c].caida&&!row[c].pisada)nu.push(c);if(nu.length)best=nu}
        b.col=best[Math.floor(rnd()*best.length)];b.fila=f;b.tx=b.col-4;
        const tl=row[b.col];if(tl.falsa){if(!tl.caida){tl.caida=true;tl.tc=t;ev('tile',{f,c:b.col})}caer(b,L.s0+Math.floor(f/5)*5*L.prof+.6,'loseta');b.x=b.tx;continue}tl.pisada=true}
      if(b.s>L.s0+L.filas*L.prof)b.col=-1;
      // — zona 2: martillos —
      for(let i=0;i<g.hams.length;i++){const h=g.hams[i];
        if(b.hamOk<i&&b.s>=h.s-1.6&&b.s<h.s-1.2){ // decide si pasa o espera
          let peligro=false;for(let k=0;k<=8;k++){const tt=t+k*.07;if(Math.abs(hamX(h,tt)-b.x)<1.7)peligro=true}
          if(b.dado!==i){b.dado=i;b.falla=rnd()<P.martilloFalla}
          if(peligro&&!b.falla){v=0}else b.hamOk=i}
        if(Math.abs(b.s-h.s)<.8&&Math.abs(h.x-b.x)<1.35){g.stats.golpes++;const dir=Math.sign(Math.cos(6.283*t/h.T+h.ph))||1;
          if(rnd()<P.martilloAguanta){b.st='stun';b.tmr=1.4;b.s=h.s-2.4;b.x=Math.max(-4,Math.min(4,b.x+dir*1.2));b.hamOk=i-1;b.dado=-1;ev('hit',{id:b.id,aguanta:true,dir})}
          else{ev('hit',{id:b.id,aguanta:false,dir});b.vx=dir*7;caer(b,h.s-3,'martillo');b.hamOk=i-1;b.dado=-1}
          v=0;break}}
      if(b.st!=='run')continue;
      // — zona 3: rodillos —
      for(let i=0;i<Z.rodillos.length;i++){const[a,c]=Z.rodillos[i];
        if(b.s>=a&&b.s<c){v*=.8;if(b.rodDado!==i){b.rodDado=i;b.rodEn=rnd()<P.rodilloResbala?a+(c-a)*(.2+rnd()*.7):-1}
          if(b.rodEn>0&&b.s>=b.rodEn){b.rodEn=-1;const lado=(i%2?1:-1);b.lado=lado;b.x=lado*4.3;
            if(rnd()<P.agarre){b.st='hang';b.tmr=1.7;b.y=-1;ev('grab',{id:b.id})}else{b.rodDado=-1;caer(b,a-1.5,'rodillo')}}}}
      if(b.st!=='run')continue;
      // — zona 4: la soga —
      if(b.s>=Z.soga.a-6&&b.s<Z.soga.a-.4&&b.rope<0){let br=0,bw=1e9;g.ropes.forEach((r,i)=>{const w=(r.ocupada!==null?Z.soga.T:0)+Math.abs(r.x-b.x)*.25;if(w<bw){bw=w;br=i}});b.ropeGoal=br;b.tx=g.ropes[br].x}
      if(b.s>=Z.soga.a-.5&&b.s<Z.soga.a+.2){const r=g.ropes[b.ropeGoal||0];
        if(r.ocupada===null&&r.u<.06&&Math.abs(b.x-r.x)<.5){r.ocupada=b.id;b.rope=b.ropeGoal||0;b.st='swing';b.tmr=Z.soga.T/2;ev('swing',{id:b.id});continue}
        v=0;b.s=Math.min(b.s,Z.soga.a-.45)}
      // — zona 5: rampa con bolas —
      if(b.s>Z.rampa.a-2&&b.s<Z.rampa.b)for(const o of g.bolas){const ds=o.s-b.s;
        if(ds>0&&ds<7&&Math.abs(o.x-b.x)<1.9&&!b.vistas.has(o.id)){b.vistas.add(o.id);
          if(rnd()<P.bolaEsquiva){let bx=b.x,bsc=-1e9;for(let x=-4;x<=4;x+=1){let cl=9;for(const q of g.bolas){const d2=q.s-b.s;if(d2>-1&&d2<9)cl=Math.min(cl,Math.abs(x-q.x))}const sc=Math.min(cl,2.4)-.2*Math.abs(x-b.x);if(sc>bsc){bsc=sc;bx=x}}b.tx=bx}}
        if(!(b.inm>0)&&ds*ds+(o.x-b.x)*(o.x-b.x)<1.25*1.25){b.st='slide';b.tmr=1.0;b.tx=Math.max(-4,Math.min(4,b.x+(b.x>=o.x?1:-1)*1.1));g.stats.golpes++;ev('bola',{id:b.id});break}}
      if(b.st!=='run')continue;
      const enLosetas=b.s>L.s0-1&&b.s<L.s0+L.filas*L.prof+.5,enSoga=b.s>Z.soga.a-6&&b.s<Z.soga.b+1,enRampa=b.s>Z.rampa.a-2&&b.s<Z.rampa.b;
      if(!enLosetas&&!enSoga&&!enRampa)b.tx=Math.max(-4,Math.min(4,b.home+1.1*Math.sin(t*b.w*.8+b.ph*2)));
      b.x+=Math.max(-6*DT,Math.min(6*DT,b.tx-b.x));b.s+=v*DT;b.y=0;
      if(b.s>=META){b.st='done';g.orden.push(b.id);b.lugar=g.orden.length;ev('meta',{id:b.id,lugar:b.lugar});
        if(g.orden.length>=keep&&!g.over){g.over=true;g.endT=t+4.5;g.out=g.orden.slice();g.elim=g.balls.filter(q=>q.st!=='done').sort((p,q)=>p.s-q.s).map(q=>q.id);ev('end')}}
    }
  };
  g.rank=()=>g.balls.slice().sort((a,b)=>(a.lugar||99)-(b.lugar||99)||b.s-a.s);
  return g;
}
const api={rng32,makeCarrera,DT,V,META,Z,P};if(typeof module!=='undefined')module.exports=api;else root.Carrera=api;
})(typeof window!=='undefined'?window:globalThis);
