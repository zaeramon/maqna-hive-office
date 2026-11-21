import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { OfficeAgent } from "../lib/types";

const W=320,H=190,SCALE=3;
const floors:Record<number,{name:string;wall:string;floor:string;accent:string;objects:string[]}> = {
  1:{name:"LOBBY",wall:"#26384d",floor:"#9b673c",accent:"#77d6be",objects:["RECEPTION","ELEVATOR","PROJECT WALL"]},
  2:{name:"COORDINATION",wall:"#24364a",floor:"#98653a",accent:"#e5c36e",objects:["TASK BOARD","MEETING TABLE","COFFEE"]},
  3:{name:"CHATGPT LAB",wall:"#27384c",floor:"#9a683d",accent:"#65d7a6",objects:["BOOKSHELF","ART GALLERY","KANCIL"]},
  4:{name:"CLAUDE WORKSHOP",wall:"#25354b",floor:"#96643b",accent:"#8ebaff",objects:["CODE DESK","BROKEN PROTOTYPE","BUG BOARD"]},
  5:{name:"DEEPSEEK RESEARCH",wall:"#29344c",floor:"#95633b",accent:"#c5a4ff",objects:["RESEARCH BOARD","CHARTS","SPECIMENS"]},
};
function box(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,c:string){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
function text(ctx:CanvasRenderingContext2D,t:string,x:number,y:number,c="#e9e2ce"){ctx.fillStyle=c;ctx.font="5px monospace";ctx.fillText(t,x,y)}
function drawDesk(ctx:CanvasRenderingContext2D,x:number,y:number,glow:string){
 box(ctx,x,y,37,13,"#302016");box(ctx,x+1,y+1,35,10,"#8c5429");box(ctx,x+3,y+11,3,6,"#49301f");box(ctx,x+31,y+11,3,6,"#49301f");
 box(ctx,x+12,y-8,13,9,"#1b2029");box(ctx,x+13,y-7,11,6,glow);box(ctx,x+17,y+1,3,2,"#d5c9aa");box(ctx,x+8,y+4,7,3,"#d5c9aa");
}
function drawAgent(ctx:CanvasRenderingContext2D,x:number,y:number,color:string,phase:number){
 box(ctx,x-4,y+7,9,3,"#33251e");box(ctx,x-4,y,9,8,color);box(ctx,x-5,y-5,11,7,"#20232a");box(ctx,x-4,y-7,9,5,"#282c34");box(ctx,x-3,y-2,2,2,"#f1dfc1");box(ctx,x+1,y-2,2,2,"#f1dfc1");box(ctx,x-2,y+8+(phase%2),2,3,"#d7d1bd");box(ctx,x+2,y+8+((phase+1)%2),2,3,"#d7d1bd");
}
function drawScene(ctx:CanvasRenderingContext2D,floor:number,agents:OfficeAgent[],tick:number,clockingOut:boolean){
 const f=floors[floor]||floors[1];box(ctx,0,0,W,H,"#121a2a");box(ctx,9,7,W-18,H-14,f.wall);
 box(ctx,14,12,W-28,H-24,f.floor);
 for(let y=14;y<H-15;y+=8)for(let x=15;x<W-15;x+=12)box(ctx,x+(y%16?0:6),y,1,1,"#6f472c");
 box(ctx,9,7,W-18,5,"#101521");box(ctx,9,H-12,W-18,5,"#101521");box(ctx,9,7,5,H-14,"#101521");box(ctx,W-14,7,5,H-14,"#101521");
 box(ctx,20,20,47,15,"#4a3022");box(ctx,21,21,45,12,"#c28a4e");for(let i=0;i<4;i++)box(ctx,23+i*11,23,1,8,"#6c4028");
 box(ctx,252,20,42,14,"#4a3022");box(ctx,253,21,40,12,"#c28a4e");for(let i=0;i<4;i++)box(ctx,255+i*9,23,1,8,"#6c4028");
 if(floor===1){box(ctx,129,10,61,14,"#d8c9ad");text(ctx,"MAQNA HIVE",137,19,"#28364a");box(ctx,137,66,47,22,"#78502f");box(ctx,140,69,41,14,"#b77b43");text(ctx,"WELCOME",148,78);}
 else if(floor===2){box(ctx,22,43,58,21,"#583d2b");box(ctx,24,45,54,17,"#a77c4e");text(ctx,"TODAY'S QUESTS",28,54);for(let i=0;i<3;i++)box(ctx,29,57+i*2,34,1,"#e9d89a");}
 else if(floor===3){box(ctx,20,45,46,26,"#593a2a");box(ctx,22,47,42,21,"#b68b59");text(ctx,"MEMORY MUSEUM",26,56);box(ctx,27,59,10,7,"#6da6b2");box(ctx,41,59,10,7,"#b68dc7");box(ctx,55,59,7,7,"#d6bd75");}
 else if(floor===4){box(ctx,22,44,56,24,"#4a3025");box(ctx,24,46,52,20,"#171e2a");text(ctx,"BUILD: 0.1.0",28,55,"#8ac7d8");box(ctx,26,59,10,3,"#b35a50");box(ctx,40,58,13,4,"#777d86");box(ctx,58,59,12,3,"#8ac7d8");}
 else {box(ctx,22,44,58,24,"#513827");box(ctx,24,46,54,20,"#202a40");text(ctx,"RESEARCH NOTES",28,55,"#d2c0f4");for(let i=0;i<4;i++)box(ctx,28,59+i*2,42-i*3,1,"#9b8cbd");}
 drawDesk(ctx,102,104,f.accent);drawDesk(ctx,179,104,"#73a9df");drawDesk(ctx,102,145,"#7fd0a6");drawDesk(ctx,179,145,"#c49bdd");
 const visible=agents.filter(a=>a.floor===floor||floor===1);
 visible.slice(0,4).forEach((a,i)=>{const positions=[[120,95],[197,95],[120,136],[197,136]];const [baseX,y]=positions[i];const x=clockingOut?Math.min(284,baseX+Math.floor(Math.min(1,tick/150)*72)):baseX;drawAgent(ctx,x,y,a.id==="claude"?"#86b4ed":a.id==="deepseek"?"#b99ae5":a.id==="coordinator"?"#e5c36e":"#74d5a5",tick+i);if(!clockingOut&&a.status==="working"&&tick%12<8){box(ctx,x+7,y-10,7,1,"#d8e4e8");box(ctx,x+9,y-12,1,1,"#d8e4e8");}});
 if(clockingOut){box(ctx,264,14,37,10,"#263b38");text(ctx,"CLOCK OUT",267,21,"#9ce0bd");}
 text(ctx,f.name,17,181,"#f3d9a8");text(ctx,"CLICK A CHARACTER OR EXHIBIT",195,181,"#c4d1df");
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
  const animate=()=>{frame=requestAnimationFrame(animate);tick++;if(tick%7===0){drawScene(ctx,state.current.floor,state.current.agents,tick,state.current.clockingOut);texture.needsUpdate=true;}renderer.render(scene,camera);};animate();
  const click=(event:PointerEvent)=>{const rect=renderer.domElement.getBoundingClientRect();pointer.x=((event.clientX-rect.left)/rect.width)*2-1;pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);if(!raycaster.intersectObject(mesh).length)return;const x=(pointer.x+1)*W/2,y=(1-pointer.y)*H/2;
   const positions=[[120,95],[197,95],[120,136],[197,136]];const visible=state.current.agents.filter(a=>a.floor===state.current.floor||state.current.floor===1).slice(0,4);
   const index=positions.findIndex(([px,py])=>Math.abs(x-px)<11&&Math.abs(y-py)<15);if(index>=0&&visible[index])select.current(visible[index]);
  };
  renderer.domElement.addEventListener("pointerdown",click);
  return()=>{cancelAnimationFrame(frame);renderer.domElement.removeEventListener("pointerdown",click);texture.dispose();material.dispose();mesh.geometry.dispose();renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <div className="pixel-stage" ref={host} aria-label="Interactive pixel-art office. Select a character to inspect its status." />;
}
