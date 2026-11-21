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
function box(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,c:string){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
function text(ctx:CanvasRenderingContext2D,t:string,x:number,y:number,c="#e9e2ce",size=7){ctx.fillStyle=c;ctx.font="bold "+size+"px monospace";ctx.shadowColor="#101725";ctx.shadowBlur=1;ctx.fillText(t,x,y);ctx.shadowBlur=0}
function drawDesk(ctx:CanvasRenderingContext2D,x:number,y:number,glow:string){
 box(ctx,x,y,37,13,"#302016");box(ctx,x+1,y+1,35,10,"#8c5429");box(ctx,x+3,y+11,3,6,"#49301f");box(ctx,x+31,y+11,3,6,"#49301f");
 box(ctx,x+12,y-8,13,9,"#1b2029");box(ctx,x+13,y-7,11,6,glow);box(ctx,x+17,y+1,3,2,"#d5c9aa");box(ctx,x+8,y+4,7,3,"#d5c9aa");
}
function drawAgent(ctx:CanvasRenderingContext2D,x:number,y:number,color:string,phase:number){
 box(ctx,x-4,y+7,9,3,"#33251e");box(ctx,x-4,y,9,8,color);box(ctx,x-5,y-5,11,7,"#20232a");box(ctx,x-4,y-7,9,5,"#282c34");box(ctx,x-3,y-2,2,2,"#f1dfc1");box(ctx,x+1,y-2,2,2,"#f1dfc1");box(ctx,x-2,y+8+(phase%2),2,3,"#d7d1bd");box(ctx,x+2,y+8+((phase+1)%2),2,3,"#d7d1bd");
}
function drawPlant(ctx:CanvasRenderingContext2D,x:number,y:number){
 box(ctx,x-7,y-8,2,9,"#4d9b66");box(ctx,x-2,y-13,3,14,"#63b978");box(ctx,x+3,y-9,3,8,"#4d9b66");box(ctx,x-6,y,14,7,"#b96f43");box(ctx,x-5,y+1,12,2,"#e1a36a");
}
function drawCooler(ctx:CanvasRenderingContext2D,x:number,y:number){
 box(ctx,x-6,y-20,12,20,"#b8d3d9");box(ctx,x-5,y-18,10,8,"#68a9c0");box(ctx,x-5,y-8,10,7,"#e4e4d5");box(ctx,x-2,y-5,4,2,"#577d8c");box(ctx,x-4,y,2,4,"#526273");box(ctx,x+2,y,2,4,"#526273");
}
function drawBoss(ctx:CanvasRenderingContext2D,x:number,y:number,phase:number,look:boolean){
 // A tiny visitor in a dark suit, gold tie and polished shoes.
 const step=phase%2;
 box(ctx,x-5,y+9,11,3,"#30251f");
 box(ctx,x-5,y,10,9,"#26364c");box(ctx,x-1,y+1,3,7,"#e0b45f");
 box(ctx,x-7,y+1,2,7,"#d7b18c");box(ctx,x+5,y+1,2,7,"#d7b18c");
 box(ctx,x-4,y-8,8,8,"#d9ae86");box(ctx,x-5,y-10,10,4,"#342a25");box(ctx,x-4,y-12,8,3,"#342a25");
 box(ctx,x-3,y-5,2,2,"#20232a");box(ctx,x+2,y-5,2,2,"#20232a");
 box(ctx,x-4,y+10,3,4,step?"#d8dce0":"#b8c1ce");box(ctx,x+2,y+10,3,4,step?"#b8c1ce":"#d8dce0");
 if(look){box(ctx,x+7,y-12,8,1,"#f3d68b");box(ctx,x+13,y-14,1,5,"#f3d68b");}
}
function bossPosition(tick:number){
 // A repeating office tour: enter from elevator, inspect the plant, visit the water cooler, then wander near the exhibits.
 const route=[{x:267,y:118,d:65,look:false},{x:245,y:136,d:35,look:true},{x:86,y:137,d:70,look:false},{x:76,y:137,d:42,look:true},{x:148,y:119,d:65,look:false},{x:253,y:119,d:68,look:false},{x:260,y:119,d:45,look:true},{x:198,y:151,d:65,look:false}];
 const cycle=route.reduce((s,p)=>s+p.d,0);let t=(tick/7)%cycle;
 let from=route[0],to=route[1],elapsed=0;
 for(let i=0;i<route.length;i++){const p=route[i];if(t<p.d){from=p;to=route[(i+1)%route.length];elapsed=t;break;}t-=p.d;}
 const moving=!from.look;const k=moving?Math.min(1,elapsed/Math.max(1,from.d)):0;
 return {x:from.x+(to.x-from.x)*k,y:from.y+(to.y-from.y)*k,look:from.look,phase:Math.floor(tick/7)};
}
function drawScene(ctx:CanvasRenderingContext2D,floor:number,agents:OfficeAgent[],tick:number,clockingOut:boolean){
 const f=floors[floor]||floors[1];box(ctx,0,0,W,H,"#121a2a");box(ctx,9,7,W-18,H-14,f.wall);
 box(ctx,14,12,W-28,H-24,f.floor);
 for(let y=14;y<H-15;y+=8)for(let x=15;x<W-15;x+=12)box(ctx,x+(y%16?0:6),y,1,1,"#6f472c");
 box(ctx,9,7,W-18,5,"#101521");box(ctx,9,H-12,W-18,5,"#101521");box(ctx,9,7,5,H-14,"#101521");box(ctx,W-14,7,5,H-14,"#101521");
 box(ctx,20,20,47,15,"#4a3022");box(ctx,21,21,45,12,"#c28a4e");for(let i=0;i<4;i++)box(ctx,23+i*11,23,1,8,"#6c4028");
 box(ctx,252,20,42,14,"#4a3022");box(ctx,253,21,40,12,"#c28a4e");for(let i=0;i<4;i++)box(ctx,255+i*9,23,1,8,"#6c4028");
 if(floor===1){
   box(ctx,129,10,61,14,"#d8c9ad");text(ctx,"MAQNA HIVE",136,20,"#28364a",8);
   box(ctx,257,73,30,42,"#182536");box(ctx,260,76,24,35,"#71889a");box(ctx,263,79,18,29,"#26384d");box(ctx,278,89,2,2,"#f3d68b");text(ctx,"LIFT",263,70,"#f1d7a5",7);
   box(ctx,137,66,47,22,"#78502f");box(ctx,140,69,41,14,"#b77b43");text(ctx,"WELCOME",145,79,"#fff0cb",7);
   drawPlant(ctx,83,147);text(ctx,"PLANT",66,164,"#e5d5b6",7);
   drawCooler(ctx,246,147);text(ctx,"WATER",228,164,"#e5d5b6",7);
 } else if(floor===2){box(ctx,22,43,58,21,"#583d2b");box(ctx,24,45,54,17,"#a77c4e");text(ctx,"TODAY'S QUESTS",27,55);for(let i=0;i<3;i++)box(ctx,29,57+i*2,34,1,"#e9d89a");}
 else if(floor===3){box(ctx,20,45,46,26,"#593a2a");box(ctx,22,47,42,21,"#b68b59");text(ctx,"MEMORY MUSEUM",24,57);box(ctx,27,59,10,7,"#6da6b2");box(ctx,41,59,10,7,"#b68dc7");box(ctx,55,59,7,7,"#d6bd75");}
 else if(floor===4){box(ctx,22,44,56,24,"#4a3025");box(ctx,24,46,52,20,"#171e2a");text(ctx,"BUILD: 0.1.0",27,56,"#8ac7d8");box(ctx,26,59,10,3,"#b35a50");box(ctx,40,58,13,4,"#777d86");box(ctx,58,59,12,3,"#8ac7d8");}
 else {box(ctx,22,44,58,24,"#513827");box(ctx,24,46,54,20,"#202a40");text(ctx,"RESEARCH NOTES",26,56,"#d2c0f4");for(let i=0;i<4;i++)box(ctx,28,59+i*2,42-i*3,1,"#9b8cbd");}
 drawDesk(ctx,102,104,f.accent);drawDesk(ctx,179,104,"#73a9df");drawDesk(ctx,102,145,"#7fd0a6");drawDesk(ctx,179,145,"#c49bdd");
 const visible=agents.filter(a=>a.floor===floor||floor===1);
 visible.slice(0,4).forEach((a,i)=>{const positions=[[120,95],[197,95],[120,136],[197,136]];const [x,y]=positions[i];const shift=clockingOut?Math.min(72,Math.floor(Math.min(1,tick/150)*72)):0;drawAgent(ctx,x+shift,y,a.id==="claude"?"#86b4ed":a.id==="deepseek"?"#b99ae5":a.id==="coordinator"?"#e5c36e":"#74d5a5",tick+i);if(!clockingOut&&a.status==="working"&&tick%12<8){box(ctx,x+7,y-10,7,1,"#d8e4e8");box(ctx,x+9,y-12,1,1,"#d8e4e8");}});
 if(floor===1&&!clockingOut){const b=bossPosition(tick);drawBoss(ctx,Math.round(b.x),Math.round(b.y),b.phase,b.look);if(tick%110<65){text(ctx,"BOSS",Math.round(b.x)-11,Math.round(b.y)-17,"#ffe09a",7);}}
 if(clockingOut){box(ctx,264,14,37,10,"#263b38");text(ctx,"CLOCK OUT",266,22,"#9ce0bd",7);}
 text(ctx,f.name,17,181,"#f3d9a8",8);text(ctx,"SELECT A CHARACTER",211,181,"#c4d1df",7);
}
export default function PixelOffice({floor,agents,onSelect,clockingOut=false}:{floor:number;agents:OfficeAgent[];onSelect:(agent:OfficeAgent)=>void;clockingOut?:boolean}){
 const host=useRef<HTMLDivElement>(null);const select=useRef(onSelect);select.current=onSelect;const state=useRef({floor,agents,clockingOut});
 state.current={floor,agents,clockingOut};
 useEffect(()=>{
  const root=host.current;if(!root)return;
  const renderer=new THREE.WebGLRenderer({antialias:false,alpha:false});renderer.setPixelRatio(1);renderer.setSize(W*SCALE,H*SCALE,false);renderer.outputColorSpace=THREE.SRGBColorSpace;root.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color("#121a2a");
  const camera=new THREE.OrthographicCamera(-W/2,W/2,H/2,-H/2,.1,100);camera.position.z=10;
  const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;const ctx=canvas.getContext("2d")!;
  const texture=new THREE.CanvasTexture(canvas);texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map:texture});const mesh=new THREE.Mesh(new THREE.PlaneGeometry(W,H),material);scene.add(mesh);
  const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();let tick=0,frame=0;
  const animate=()=>{frame=requestAnimationFrame(animate);tick++;if(tick%4===0){drawScene(ctx,state.current.floor,state.current.agents,tick,state.current.clockingOut);texture.needsUpdate=true;}renderer.render(scene,camera);};animate();
  const click=(event:PointerEvent)=>{const rect=renderer.domElement.getBoundingClientRect();pointer.x=((event.clientX-rect.left)/rect.width)*2-1;pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);if(!raycaster.intersectObject(mesh).length)return;const x=(pointer.x+1)*W/2,y=(1-pointer.y)*H/2;
   const positions=[[120,95],[197,95],[120,136],[197,136]];const visible=state.current.agents.filter(a=>a.floor===state.current.floor||state.current.floor===1).slice(0,4);
   const index=positions.findIndex(([px,py])=>Math.abs(x-px)<11&&Math.abs(y-py)<15);if(index>=0&&visible[index])select.current(visible[index]);
  };
  renderer.domElement.addEventListener("pointerdown",click);
  return()=>{cancelAnimationFrame(frame);renderer.domElement.removeEventListener("pointerdown",click);texture.dispose();material.dispose();mesh.geometry.dispose();renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <div className="pixel-stage" ref={host} aria-label="Interactive pixel-art office. On the first floor a small boss character enters from the elevator and walks around inspecting the plant and water cooler. Select an agent to inspect its status." />;
}
