import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { OfficeAgent } from "../lib/types";

const W=320,H=190,SCALE=3;
const floors:Record<number,{name:string;wall:string;floor:string;accent:string}> = {
  1:{name:"LOBBY",wall:"#26384d",floor:"#9b673c",accent:"#77d6be"},
  2:{name:"COORDINATION",wall:"#24364a",floor:"#98653a",accent:"#e5c36e"},
  3:{name:"CHATGPT LAB",wall:"#27384c",floor:"#9a683d",accent:"#65d7a6"},
  4:{name:"CLAUDE WORKSHOP",wall:"#25354b",floor:"#96643b",accent:"#8ebaff"},
  5:{name:"DEEPSEEK RESEARCH",wall:"#29344c",floor:"#95633b",accent:"#c5a4ff"},
};
function box(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,c:string){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function poly(ctx:CanvasRenderingContext2D,pts:number[][],fill:string){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(const p of pts.slice(1))ctx.lineTo(p[0],p[1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();}
function gradient(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,a:string,b:string){const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,a);g.addColorStop(1,b);ctx.fillStyle=g;ctx.fillRect(x,y,w,h);}
function shadow(ctx:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number){ctx.save();ctx.fillStyle="rgba(8,13,22,.34)";ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function text(ctx:CanvasRenderingContext2D,t:string,x:number,y:number,c="#e9e2ce",size=7){ctx.fillStyle=c;ctx.font="bold "+size+"px monospace";ctx.shadowColor="#101725";ctx.shadowBlur=1;ctx.fillText(t,x,y);ctx.shadowBlur=0}
function drawCabinet(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){
 shadow(ctx,x+w/2,y+h+4,w*.62,4);
 poly(ctx,[[x,y],[x+w,y],[x+w+5,y-4],[x+5,y-4]],"#d29a60");
 poly(ctx,[[x+w,y],[x+w+5,y-4],[x+w+5,y+h-4],[x+w,y+h]],"#49301f");
 gradient(ctx,x,y,w,h,"#d39a60","#71472d");box(ctx,x+2,y+2,w-4,h-5,"#6d472e");
 const shelves=Math.max(1,Math.floor(h/11));
 for(let i=1;i<shelves;i++){const sy=y+i*(h/shelves);poly(ctx,[[x+2,sy],[x+w-2,sy],[x+w+2,sy-2],[x+2,sy-2]],"#d2a16a");box(ctx,x+3,sy,w-6,2,"#4c3020");}
 for(let i=0;i<Math.floor(w/9);i++){const bx=x+4+i*9;gradient(ctx,bx,y+3,5,Math.max(3,h-9),"#a46d43","#503523");box(ctx,bx+1,y+4,3,2,["#d4b66d","#6b9a9b","#b77b68"][i%3]);box(ctx,bx+1,y+7,1,Math.max(2,h-16),"rgba(255,220,160,.24)");}
 box(ctx,x+w-5,y+Math.floor(h/2),2,4,"#f0cf89");
}
function drawPlant(ctx:CanvasRenderingContext2D,x:number,y:number){
 shadow(ctx,x,y+6,10,3);
 poly(ctx,[[x-7,y],[x+7,y],[x+5,y+9],[x-5,y+9]],"#9b5538");poly(ctx,[[x-7,y],[x+7,y],[x+5,y+3],[x-5,y+3]],"#e2a06a");
 const leaves=[[-7,-7,-13,-16],[-2,-9,-2,-21],[4,-8,10,-18],[0,-5,7,-13],[-4,-5,-10,-12]];
 for(const [ax,ay,bx,by] of leaves){poly(ctx,[[x+ax,y+ay],[x+bx,y+by],[x+bx+4,y+by+2],[x+ax+3,y+ay+3]],"#3c9868");poly(ctx,[[x+ax+1,y+ay],[x+bx+2,y+by+1],[x+ax+2,y+ay+2]],"#8bd18c");}
}
function drawCooler(ctx:CanvasRenderingContext2D,x:number,y:number){
 shadow(ctx,x,y+4,9,3);poly(ctx,[[x-6,y-18],[x+5,y-18],[x+8,y-21],[x-3,y-21]],"#e2f1ee");gradient(ctx,x-6,y-19,12,19,"#eaf3ed","#7899a5");
 poly(ctx,[[x+6,y-19],[x+8,y-21],[x+8,y-2],[x+6,y]],"#526d7b");gradient(ctx,x-5,y-17,10,8,"#9de0eb","#397d9d");box(ctx,x-5,y-7,10,5,"#f1f1df");box(ctx,x-2,y-5,4,2,"#4d7c8c");box(ctx,x-4,y,2,4,"#526273");box(ctx,x+2,y,2,4,"#526273");
}
function drawElevator(ctx:CanvasRenderingContext2D,tick:number){
 // Compact lift: door is only slightly taller than a person, fixed to the left wall on every floor.
 shadow(ctx,31,132,24,4);
 poly(ctx,[[12,94],[44,94],[48,90],[16,90]],"#8799a4");poly(ctx,[[44,94],[48,90],[48,127],[44,131]],"#253447");
 gradient(ctx,12,94,32,37,"#748b9b","#26394d");box(ctx,15,97,26,31,"#142234");
 gradient(ctx,17,99,11,27,"#a9c0c6","#405b70");gradient(ctx,29,99,10,27,"#8fa7b4","#30465c");
 box(ctx,27,99,2,27,"#263b50");box(ctx,20,102,1,21,"rgba(255,255,255,.32)");box(ctx,32,102,1,21,"rgba(255,255,255,.22)");
 box(ctx,47,105,3,14,"#d4b16c");box(ctx,51,106,4,4,"#7bd5b4");box(ctx,51,113,4,4,"#d9b86e");
 text(ctx,"LIFT",17,87,"#f1d7a5",7);
 if(tick%260<48){box(ctx,17,99,23,27,"#26384d");box(ctx,28,99,2,27,"#b2c1c8");}
}
function drawDesk(ctx:CanvasRenderingContext2D,x:number,y:number,glow:string){
 shadow(ctx,x+19,y+19,23,4);
 poly(ctx,[[x,y],[x+34,y],[x+40,y-5],[x+6,y-5]],"#d4a16a");poly(ctx,[[x+34,y],[x+40,y-5],[x+40,y+8],[x+34,y+13]],"#55351f");
 gradient(ctx,x,y,35,12,"#c48b50","#694124");box(ctx,x+3,y+11,3,7,"#5a3924");box(ctx,x+31,y+11,3,7,"#5a3924");
 poly(ctx,[[x+12,y-8],[x+25,y-8],[x+28,y-11],[x+15,y-11]],"#647c8d");gradient(ctx,x+12,y-8,13,9,"#253847","#111923");box(ctx,x+13,y-7,11,6,glow);box(ctx,x+17,y+1,3,2,"#d5c9aa");box(ctx,x+8,y+4,7,3,"#d5c9aa");
}
function drawPerson(ctx:CanvasRenderingContext2D,x:number,y:number,kind:"gamer"|"reader"|"caller"|"agent",phase:number){
 const bob=kind==="caller"&&phase%50<25?1:0;
 const suit=kind==="gamer"?"#5c91b8":kind==="reader"?"#b98d54":kind==="caller"?"#8c78b7":"#68b99b";
 shadow(ctx,x,y+13,9,3);
 // feet and legs have highlights and side shading for volume
 poly(ctx,[[x-5,y+5],[x-1,y+5],[x-2,y+13],[x-6,y+13]],"#29394b");poly(ctx,[[x+1,y+5],[x+5,y+5],[x+6,y+13],[x+2,y+13]],"#29394b");
 box(ctx,x-5,y+12,5,2,"#d8dce0");box(ctx,x+2,y+12,5,2,"#aeb9c5");
 poly(ctx,[[x-6,y-2+bob],[x+4,y-3+bob],[x+7,y+1+bob],[x+5,y+9],[x-5,y+9]],suit);
 poly(ctx,[[x+4,y-3+bob],[x+7,y+1+bob],[x+5,y+9],[x+3,y+8]],"rgba(10,20,30,.34)");
 box(ctx,x-4,y-1+bob,2,8,"rgba(255,255,255,.18)");
 // neck, ears and shaped head
 box(ctx,x-2,y-5+bob,5,5,"#bb8b6d");gradient(ctx,x-6,y-10+bob,12,10,"#f1c8a1","#b77e60");box(ctx,x-7,y-7+bob,2,4,"#c58c6d");box(ctx,x+5,y-7+bob,2,4,"#9c6957");
 poly(ctx,[[x-7,y-9+bob],[x-5,y-13+bob],[x+3,y-13+bob],[x+6,y-9+bob],[x+5,y-6+bob],[x+3,y-9+bob],[x-3,y-8+bob],[x-6,y-6+bob]],kind==="gamer"?"#27334b":kind==="reader"?"#65432c":kind==="caller"?"#4a315c":"#243b38");
 box(ctx,x-3,y-7+bob,2,2,"#20232a");box(ctx,x+2,y-7+bob,2,2,"#20232a");box(ctx,x-1,y-2+bob,3,1,"#9c5f55");
 box(ctx,x-5,y-1+bob,2,6,"#d9ae86");box(ctx,x+4,y-1+bob,2,6,"#d9ae86");
 if(kind==="gamer"){box(ctx,x-9,y+1,4,2,"#d9ae86");box(ctx,x+6,y+1,4,2,"#d9ae86");box(ctx,x-9,y-1,4,3,"#e3c66e");box(ctx,x-8,y-1,2,1,"#fff0ad");}
 if(kind==="reader"){poly(ctx,[[x-8,y-1],[x-1,y-2],[x,y+5],[x-8,y+6]],"#fff1d1");poly(ctx,[[x,y-2],[x+8,y-1],[x+8,y+6],[x,y+5]],"#dfcda8");box(ctx,x-6,y+1,4,1,"#aa9876");box(ctx,x+2,y+1,4,1,"#aa9876");}
 if(kind==="caller"){box(ctx,x+6,y-12,2,8,"#2c3039");box(ctx,x+5,y-13,4,3,"#303b4d");box(ctx,x+7,y-14,2,2,"#e7c77b");}
 if(kind==="agent"){box(ctx,x-5,y-12,10,2,"#d6bd75");}
}
function drawBoss(ctx:CanvasRenderingContext2D,x:number,y:number,phase:number,look:boolean){
 const step=phase%2;
 box(ctx,x-6,y+10,13,3,"#30251f");box(ctx,x-5,y,10,10,"#26364c");box(ctx,x-1,y+1,3,8,"#e0b45f");
 box(ctx,x-7,y+1,2,7,"#d7b18c");box(ctx,x+5,y+1,2,7,"#d7b18c");
 box(ctx,x-4,y-8,8,8,"#d9ae86");box(ctx,x-5,y-10,10,4,"#342a25");box(ctx,x-4,y-12,8,3,"#342a25");
 box(ctx,x-3,y-5,2,2,"#20232a");box(ctx,x+2,y-5,2,2,"#20232a");
 box(ctx,x-4,y+10,3,4,step?"#d8dce0":"#b8c1ce");box(ctx,x+2,y+10,3,4,step?"#b8c1ce":"#d8dce0");
 if(look){box(ctx,x+7,y-12,8,1,"#f3d68b");box(ctx,x+13,y-14,1,5,"#f3d68b");}
}
type Stop={x:number;y:number;pause:number;look?:boolean};
const bossRoute:Stop[]=[
 {x:31,y:119,pause:55},{x:60,y:119,pause:18},{x:83,y:145,pause:55,look:true},
 {x:120,y:145,pause:18},{x:157,y:124,pause:60,look:true},{x:205,y:145,pause:18},
 {x:246,y:145,pause:60,look:true},{x:276,y:119,pause:18},{x:255,y:91,pause:55,look:true},
 {x:208,y:94,pause:18},{x:151,y:112,pause:55,look:true},{x:96,y:111,pause:18}
];
function smooth(t:number){return t*t*(3-2*t)}
function bossPosition(tick:number){
 // Build a continuous timed path. Each segment interpolates to the next waypoint, then pauses at the destination.
 const speed=0.55;const segments=bossRoute.map((p,i)=>{const n=bossRoute[(i+1)%bossRoute.length];const distance=Math.hypot(n.x-p.x,n.y-p.y);return {from:p,to:n,move:Math.max(20,distance/speed),pause:p.pause};});
 const cycle=segments.reduce((s,v)=>s+v.move+v.pause,0);let t=(tick*0.45)%cycle;
 for(const seg of segments){
  if(t<seg.move){const k=smooth(t/seg.move);return {x:seg.from.x+(seg.to.x-seg.from.x)*k,y:seg.from.y+(seg.to.y-seg.from.y)*k,look:false,phase:Math.floor(t/5),walking:true};}
  t-=seg.move;if(t<seg.pause)return {x:seg.to.x,y:seg.to.y,look:Boolean(seg.from.look),phase:Math.floor(t/5),walking:false};
  t-=seg.pause;
 }
 return {x:31,y:119,look:false,phase:0,walking:false};
}
function drawLobby(ctx:CanvasRenderingContext2D,tick:number,clockingOut:boolean){
 // Reception, storage, waiting area, TV lounge and amenities — deliberately no office desks.
 drawElevator(ctx,tick);
 // Reception counter
 box(ctx,57,63,54,19,"#503321");box(ctx,59,65,50,14,"#bd8750");box(ctx,61,67,46,4,"#e0b57a");box(ctx,79,54,12,9,"#27394c");text(ctx,"RECEPTION",59,59,"#f4dcb2",7);
 // Wall cabinets and display shelves
 drawCabinet(ctx,119,40,42,34);drawCabinet(ctx,170,40,43,34);drawCabinet(ctx,222,40,32,34);
 // TV / game corner
 box(ctx,258,76,43,27,"#39271e");box(ctx,261,78,37,21,"#111a27");box(ctx,263,80,33,17,"#355d76");
 box(ctx,266,83,7,3,"#e5c36e");box(ctx,278,85,5,5,"#8bd3b2");box(ctx,287,82,5,9,"#d88a68");box(ctx,274,103,10,3,"#60412c");box(ctx,278,99,3,5,"#8b6545");text(ctx,"ARCADE TV",261,72,"#e7d4ad",6);
 // Sofa and coffee table / lounge
 box(ctx,62,111,54,12,"#47677a");box(ctx,65,107,48,9,"#6e91a0");box(ctx,62,120,6,8,"#354d5b");box(ctx,110,120,6,8,"#354d5b");
 box(ctx,123,123,30,5,"#68452d");box(ctx,126,128,3,5,"#422c20");box(ctx,147,128,3,5,"#422c20");
 // Newspaper stand, water station and plants
 drawPlant(ctx,184,148);drawCooler(ctx,289,147);drawCabinet(ctx,18,151,34,20);
 text(ctx,"NEWS",20,148,"#e7d4ad",6);text(ctx,"WATER",278,169,"#e7d4ad",6);
 // Three lobby colleagues with distinct idle activities
 drawPerson(ctx,88,103,"gamer",tick);drawPerson(ctx,139,113,"reader",tick);drawPerson(ctx,218,119,"caller",tick);
 if(tick%70<36){box(ctx,77,89,23,1,"#b9d7e4");box(ctx,80,87,16,1,"#b9d7e4");}
 if(tick%90<45){box(ctx,132,104,14,1,"#f4e6c9");box(ctx,134,101,10,1,"#f4e6c9");}
 if(tick%100<50){box(ctx,229,98,8,1,"#d7c5ed");box(ctx,234,95,5,1,"#d7c5ed");}
 if(!clockingOut){const b=bossPosition(tick);drawBoss(ctx,Math.round(b.x),Math.round(b.y),b.phase,b.look);if(tick%120<75)text(ctx,"BOSS",Math.round(b.x)-11,Math.round(b.y)-17,"#ffe09a",7);}
 text(ctx,"MAQNA HIVE  /  MAIN LOBBY",57,178,"#f3d9a8",8);
}
function drawScene(ctx:CanvasRenderingContext2D,floor:number,agents:OfficeAgent[],tick:number,clockingOut:boolean){
 const f=floors[floor]||floors[1];box(ctx,0,0,W,H,"#111b2b");
 // Layered walls and a perspective floor plane create a compact isometric / 2.5D room.
 gradient(ctx,9,7,W-18,82,"#344c62","#1b2b40");poly(ctx,[[9,89],[311,89],[311,176],[9,176]],"#6d4a35");
 poly(ctx,[[9,89],[311,89],[311,176],[9,176]],f.floor);
 for(let y=94;y<176;y+=12){poly(ctx,[[9,y],[311,y-7],[311,y-5],[9,y+2]],"rgba(30,24,25,.13)");}
 for(let x=-40;x<360;x+=24)poly(ctx,[[x,89],[x+1,89],[x+52,176],[x+50,176]],"rgba(245,202,142,.10)");
 // Wall trim, recessed panels and warm architectural light
 box(ctx,9,7,W-18,4,"#111827");box(ctx,9,84,W-18,5,"#c18a54");box(ctx,9,89,W-18,2,"#392b28");
 for(let x=58;x<304;x+=53){box(ctx,x,16,1,58,"rgba(202,224,231,.18)");box(ctx,x+2,17,1,56,"rgba(8,16,27,.22)");}
 gradient(ctx,14,12,40,4,"#f3d99a","rgba(243,217,154,0)");box(ctx,14,12,40,1,"#f2d69b");
 box(ctx,9,7,5,H-14,"#101521");box(ctx,W-14,7,5,H-14,"#101521");
 drawElevator(ctx,tick);
 if(floor===1){drawLobby(ctx,tick,clockingOut);}
 else {
  drawCabinet(ctx,58,39,45,38);drawCabinet(ctx,111,39,42,38);drawCabinet(ctx,164,39,43,38);
  if(floor===2){box(ctx,220,42,74,26,"#583d2b");box(ctx,222,44,70,22,"#a77c4e");text(ctx,"TODAY'S QUESTS",227,55);for(let i=0;i<3;i++)box(ctx,229,58+i*3,44,1,"#e9d89a");}
  else if(floor===3){box(ctx,220,42,74,26,"#593a2a");box(ctx,222,44,70,22,"#b68b59");text(ctx,"MEMORY MUSEUM",225,55);box(ctx,228,58,10,7,"#6da6b2");box(ctx,244,58,10,7,"#b68dc7");box(ctx,260,58,10,7,"#d6bd75");}
  else if(floor===4){box(ctx,220,42,74,26,"#4a3025");box(ctx,222,44,70,22,"#171e2a");text(ctx,"BUILD: 0.1.0",228,55,"#8ac7d8");}
  else {box(ctx,220,42,74,26,"#513827");box(ctx,222,44,70,22,"#202a40");text(ctx,"RESEARCH NOTES",226,55,"#d2c0f4");}
  drawDesk(ctx,91,111,f.accent);drawDesk(ctx,163,111,"#73a9df");drawDesk(ctx,91,151,"#7fd0a6");drawDesk(ctx,163,151,"#c49bdd");
  const visible=agents.filter(a=>a.floor===floor||floor===1);
  visible.slice(0,4).forEach((a,i)=>{const positions=[[110,101],[182,101],[110,141],[182,141]];const [x,y]=positions[i];drawPerson(ctx,x,y,"agent",tick+i);if(a.status==="working"&&tick%12<8){box(ctx,x+7,y-10,7,1,"#d8e4e8");box(ctx,x+9,y-12,1,1,"#d8e4e8");}});
 }
 if(clockingOut){box(ctx,264,14,37,10,"#263b38");text(ctx,"CLOCK OUT",266,22,"#9ce0bd",7);}
 text(ctx,f.name,17,181,"#f3d9a8",8);text(ctx,floor===1?"LOBBY LEVEL":"SELECT A CHARACTER",floor===1?205:211,181,"#c4d1df",7);
}
export default function PixelOffice({floor,agents,onSelect,clockingOut=false}:{floor:number;agents:OfficeAgent[];onSelect:(agent:OfficeAgent)=>void;clockingOut?:boolean}){
 const host=useRef<HTMLDivElement>(null);const select=useRef(onSelect);select.current=onSelect;const state=useRef({floor,agents,clockingOut});state.current={floor,agents,clockingOut};
 useEffect(()=>{
  const root=host.current;if(!root)return;
  const renderer=new THREE.WebGLRenderer({antialias:false,alpha:false});renderer.setPixelRatio(1);renderer.setSize(W*SCALE,H*SCALE,false);renderer.outputColorSpace=THREE.SRGBColorSpace;root.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color("#121a2a");
  const camera=new THREE.OrthographicCamera(-W/2,W/2,H/2,-H/2,.1,100);camera.position.z=10;
  const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;const ctx=canvas.getContext("2d")!;
  const texture=new THREE.CanvasTexture(canvas);texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map:texture});const mesh=new THREE.Mesh(new THREE.PlaneGeometry(W,H),material);scene.add(mesh);
  const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();let tick=0,frame=0;
  const animate=()=>{frame=requestAnimationFrame(animate);tick++;if(tick%3===0){drawScene(ctx,state.current.floor,state.current.agents,tick,state.current.clockingOut);texture.needsUpdate=true;}renderer.render(scene,camera);};animate();
  const click=(event:PointerEvent)=>{const rect=renderer.domElement.getBoundingClientRect();pointer.x=((event.clientX-rect.left)/rect.width)*2-1;pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);if(!raycaster.intersectObject(mesh).length)return;const x=(pointer.x+1)*W/2,y=(1-pointer.y)*H/2;
   if(state.current.floor===1){const spots=[[88,103],[139,113],[218,119]];const visible=state.current.agents.filter(a=>a.floor===1||state.current.floor===1).slice(0,3);const index=spots.findIndex(([px,py])=>Math.abs(x-px)<13&&Math.abs(y-py)<18);if(index>=0&&visible[index])select.current(visible[index]);return;}
   const positions=[[110,101],[182,101],[110,141],[182,141]];const visible=state.current.agents.filter(a=>a.floor===state.current.floor).slice(0,4);const index=positions.findIndex(([px,py])=>Math.abs(x-px)<11&&Math.abs(y-py)<15);if(index>=0&&visible[index])select.current(visible[index]);
  };
  renderer.domElement.addEventListener("pointerdown",click);
  return()=>{cancelAnimationFrame(frame);renderer.domElement.removeEventListener("pointerdown",click);texture.dispose();material.dispose();mesh.geometry.dispose();renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <div className="pixel-stage" ref={host} aria-label="Pixel-art multi-floor office. The elevator remains fixed on the left side of every floor. The first floor is a furnished lobby with colleagues playing a game, reading a newspaper, chatting on a phone, and a boss walking a continuous inspection route." />;
}
