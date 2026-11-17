(() => {
  'use strict';
  const canvas = document.querySelector('#world');
  const ctx = canvas.getContext('2d');
  const toggle = document.querySelector('#motion-toggle');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motionPreference.matches;
  let inView = true;
  let frame = null;
  let width = 0, height = 0, time = 0, last = 0;
  let mouseX = 0, mouseY = 0, smoothX = 0, smoothY = 0;
  function project(x, y, z) {
    const angle = -.61 + smoothX * .25;
    const tilt = .37 + smoothY * .1;
    const rx = x * Math.cos(angle) - z * Math.sin(angle);
    const rz = x * Math.sin(angle) + z * Math.cos(angle);
    const ry = y * Math.cos(tilt) - rz * Math.sin(tilt);
    const depth = y * Math.sin(tilt) + rz * Math.cos(tilt);
    const scale = Math.min(width / 7.4, height / 5.8) * (9 / (9 + depth));
    return [width * .5 + rx * scale, height * .53 - ry * scale, scale];
  }
  function line(a, b, color, thickness = 1) {
    const p = project(...a), q = project(...b);
    ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]);
    ctx.strokeStyle = color; ctx.lineWidth = thickness; ctx.stroke();
  }
  function box(x, y, z, sx, sy, sz, color) {
    const v = [[x-sx,y-sy,z-sz],[x+sx,y-sy,z-sz],[x+sx,y-sy,z+sz],[x-sx,y-sy,z+sz],[x-sx,y+sy,z-sz],[x+sx,y+sy,z-sz],[x+sx,y+sy,z+sz],[x-sx,y+sy,z+sz]];
    [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(([a,b])=>line(v[a],v[b],color));
  }
  function ring(x,y,z,r,color,vertical=false) {
    const steps = 64;
    for(let i=0;i<steps;i++) {
      const a = i / steps * Math.PI*2, b = (i+1) / steps * Math.PI*2;
      line(vertical ? [x+Math.cos(a)*r,y+Math.sin(a)*r,z] : [x+Math.cos(a)*r,y,z+Math.sin(a)*r], vertical ? [x+Math.cos(b)*r,y+Math.sin(b)*r,z] : [x+Math.cos(b)*r,y,z+Math.sin(b)*r],color);
    }
  }
  function participant(x,z,color,offset) {
    const bob = Math.sin(time * .65 + offset) * .035;
    ring(x,-.9,z,.35,color+'70');
    ring(x,-.9,z,.48,color+'25');
    line([x,-.88,z],[x,.1+bob,z],color+'65',1.1);
    const p = project(x,.37+bob,z);
    const halo = ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],p[2]*.55);
    halo.addColorStop(0,color+'44'); halo.addColorStop(1,color+'00');
    ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(p[0],p[1],p[2]*.55,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(p[0],p[1],p[2]*.115,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
    box(x,-.08+bob,z,.17,.16,.13,color+'99');
    return [x,.37+bob,z];
  }
  function render() {
    ctx.clearRect(0,0,width,height);
    smoothX += (mouseX-smoothX)*.04; smoothY += (mouseY-smoothY)*.04;
    for(let i=-5;i<=5;i++){
      line([i*.5,-.95,-2.5],[i*.5,-.95,2.5],i===0?'#d3ff6b55':'#b0cc8730');
      line([-2.5,-.95,i*.5],[2.5,-.95,i*.5],i===0?'#d3ff6b55':'#b0cc8730');
    }
    box(0,.45,0,1.85,1.4,1.65,'#9ab97b4f');
    box(0,.45,0,1.89,1.44,1.69,'#9ab97b12');
    const a=participant(-1.05,.75,'#d3ff6b',0),b=participant(1.02,-.65,'#91d9c8',2);
    ctx.setLineDash([3,5]); line(a,b,'#d3ff6b77'); ctx.setLineDash([]);
    const angle=time*.14;
    for(let i=0;i<3;i++) {
      const offset=angle+i*Math.PI*2/3;
      const x=Math.cos(offset)*.55,z=Math.sin(offset)*.55;
      box(x,.65+Math.sin(time*.4+i)*.12,z,.13,.13,.13,'#d3ff6b7a');
    }
    ring(0,.65,0,.88,'#d3ff6b26');
    const core=project(0,.65,0);
    ctx.beginPath();ctx.arc(core[0],core[1],3,0,Math.PI*2);ctx.fillStyle='#d3ff6b';ctx.fill();
  }
  function tick(now){
    frame=null;
    if(paused||!inView||document.hidden){last=0;return;}
    if(last)time+=Math.min((now-last)/1000,.05);
    last=now;render();frame=requestAnimationFrame(tick);
  }
  function start(){if(!paused&&inView&&!document.hidden&&frame===null)frame=requestAnimationFrame(tick);}
  function updateToggle(){toggle.setAttribute('aria-pressed',String(paused));toggle.querySelector('.motion-label').textContent=paused?'Play motion':'Pause motion';toggle.querySelector('.pause-icon').textContent=paused?'▷':'Ⅱ';}
  function resize(){const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);render();}
  toggle.addEventListener('click',()=>{paused=!paused;updateToggle();if(paused){if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0;render();}else start();});
  canvas.addEventListener('pointermove',event=>{const r=canvas.getBoundingClientRect();mouseX=(event.clientX-r.left)/r.width-.5;mouseY=(event.clientY-r.top)/r.height-.5;});
  canvas.addEventListener('pointerleave',()=>{mouseX=0;mouseY=0;});
  motionPreference.addEventListener('change',event=>{paused=event.matches;updateToggle();if(paused){if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0;render();}else start();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0;}else start();});
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)start();else{if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0;}},{threshold:0}).observe(canvas);
  new ResizeObserver(resize).observe(canvas);
  updateToggle();resize();start();
})();
