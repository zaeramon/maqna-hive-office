import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { OfficeAgent } from "../lib/types";

type Rig={root:THREE.Group;leftArm:THREE.Group;rightArm:THREE.Group;leftElbow:THREE.Group;rightElbow:THREE.Group;leftHand:THREE.Group;rightHand:THREE.Group;leftLeg:THREE.Group;rightLeg:THREE.Group;head:THREE.Group;mouth:THREE.Mesh;bubble:THREE.Group;kind:string;phase:number};
const palette=["#5d91b8","#bd915e","#8e78b6","#67b99a","#c57c68"];
function mat(color:string,roughness=.82){return new THREE.MeshStandardMaterial({color,roughness,metalness:.02});}
function block(parent:THREE.Object3D,geometry:THREE.BufferGeometry,material:THREE.Material,x:number,y:number,z:number){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cube(parent:THREE.Object3D,size:[number,number,number],color:string,pos:[number,number,number]){return block(parent,new THREE.BoxGeometry(...size),mat(color),...pos);}
function makeRig(scene:THREE.Scene,x:number,z:number,kind:string,index=0):Rig{
 const root=new THREE.Group();root.position.set(x,0,z);scene.add(root);
 const skin=mat(["#d7a27f","#e2b18e","#bd896d","#d6a17f"][index%4]),shirt=mat(palette[index%palette.length]),pants=mat(index%2?"#303d50":"#29394a"),hair=mat(["#29303a","#563a2b","#30263d","#283b35"][index%4]),shoe=mat("#d5d8d8"),dark=mat("#26303b");
 const limb=(px:number,py:number,material:THREE.Material,len:number,r:number)=>{const p=new THREE.Group();p.position.set(px,py,0);root.add(p);block(p,new THREE.CapsuleGeometry(r,len-r*2,5,10),material,0,-len/2,0);return p;};
 const leftLeg=limb(-.19,.88,pants,.76,.13),rightLeg=limb(.19,.88,pants,.76,.13);
 block(leftLeg,new THREE.BoxGeometry(.3,.16,.42),shoe,0,-.69,.08);block(rightLeg,new THREE.BoxGeometry(.3,.16,.42),shoe,0,-.69,.08);
 const torso=block(root,new THREE.CapsuleGeometry(.34,.57,6,12),shirt,0,1.25,0);torso.scale.set(1,1.12,.72);
 const arm=(px:number,side:number)=>{const shoulder=new THREE.Group();shoulder.position.set(px,1.55,0);root.add(shoulder);block(shoulder,new THREE.SphereGeometry(.13,12,10),shirt,0,-.04,0);block(shoulder,new THREE.CapsuleGeometry(.105,.26,5,10),shirt,0,-.16,0);const elbow=new THREE.Group();elbow.position.set(0,-.31,0);shoulder.add(elbow);block(elbow,new THREE.SphereGeometry(.09,12,10),skin,0,0,0);block(elbow,new THREE.CapsuleGeometry(.085,.24,5,10),shirt,0,-.14,0);const hand=new THREE.Group();hand.position.set(0,-.29,.015);elbow.add(hand);block(hand,new THREE.BoxGeometry(.115,.105,.075),skin,0,-.045,.012);[-.043,-.014,.015,.044].forEach((fx)=>{const f1=new THREE.Group();f1.position.set(fx,-.09,.025);hand.add(f1);block(f1,new THREE.CapsuleGeometry(.014,.052,3,6),skin,0,-.027,0);const f2=new THREE.Group();f2.position.set(0,-.052,0);f1.add(f2);block(f2,new THREE.CapsuleGeometry(.012,.035,3,6),skin,0,-.018,0);});const thumb=new THREE.Group();thumb.position.set(side*.065,-.035,.015);thumb.rotation.z=side*.65;hand.add(thumb);block(thumb,new THREE.CapsuleGeometry(.016,.055,3,6),skin,0,-.03,0);return {shoulder,elbow,hand};};const L=arm(-.43,-1),R=arm(.43,1);const leftArm=L.shoulder,rightArm=R.shoulder,leftElbow=L.elbow,rightElbow=R.elbow,leftHand=L.hand,rightHand=R.hand;
 const head=new THREE.Group();head.position.set(0,1.98,0);root.add(head);
 block(head,new THREE.SphereGeometry(.34,20,16),skin,0,0,0);
 block(head,new THREE.SphereGeometry(.35,18,10,0,Math.PI*2,0,Math.PI*.58),hair,0,.12,-.025);
 block(head,new THREE.SphereGeometry(.09,10,8),skin,-.34,-.04,0);block(head,new THREE.SphereGeometry(.09,10,8),skin,.34,-.04,0);
 block(head,new THREE.SphereGeometry(.045,10,8),dark,-.12,.025,.29);block(head,new THREE.SphereGeometry(.045,10,8),dark,.12,.025,.29);
 const mouth=block(head,new THREE.SphereGeometry(.052,10,8),mat("#713e43"),0,-.14,.3);mouth.scale.set(.8,.35,.3);
 block(head,new THREE.SphereGeometry(.025,8,8),mat("#fff0d8"),0,-.115,.315);
 const bubble=new THREE.Group();bubble.position.set(.1,2.62,.05);root.add(bubble);const bm=new THREE.MeshBasicMaterial({color:"#fff5dc"});
 for(const [i,x] of [-.16,0,.16].entries())block(bubble,new THREE.SphereGeometry(.11,10,8),bm,x,0,0);
 bubble.visible=kind==="caller";
 block(root,new THREE.CylinderGeometry(.2,.25,.09,12),mat("#e4d4b9"),0,1.59,0);
 cube(root,[.035,.48,.018],"#e5c27e",[0,1.28,.25]);
 return {root,leftArm,rightArm,leftElbow,rightElbow,leftHand,rightHand,leftLeg,rightLeg,head,mouth,bubble,kind,phase:index*.8};
}
function furniture(scene:THREE.Scene){
 const wood=mat("#875631"),lightWood=mat("#c08b56"),dark=mat("#302b2a"),glass=new THREE.MeshStandardMaterial({color:"#72a6b3",roughness:.25,metalness:.1}),fabric=mat("#527b8b");
 const add=(x:number,y:number,z:number,w:number,h:number,d:number,m:THREE.Material)=>block(scene,new THREE.BoxGeometry(w,h,d),m,x,y,z);
 // Oversized reception desk with deep counter, brass trim and grounded plinth.
 add(-3.55,.54,-1.35,3.15,.9,.9,wood);add(-3.55,1.03,-.89,3.32,.14,1.02,lightWood);add(-3.55,.61,-.875,2.65,.48,.035,mat("#a87546"));add(-3.55,.19,-1.35,3.0,.12,.82,dark);
 add(-3.55,1.18,-1.52,2.25,.18,.28,wood);add(-3.55,1.28,-1.52,2.34,.06,.32,lightWood);
 for(const x of [-4.65,-3.55,-2.45])add(x,.6,-.84,.025,.56,.025,lightWood);
 add(-4.5,1.12,-1.35,.32,.08,.22,mat("#d9e4e2"));add(-2.65,1.12,-1.35,.18,.08,.18,mat("#d9e4e2"));
 // TV media cabinet with feet, drawers and doors.
 add(4.35,.43,-1.45,2.5,.78,.82,wood);add(4.35,.86,-1.02,2.62,.12,.92,lightWood);add(4.35,.12,-1.45,2.45,.16,.76,dark);
 for(const x of [3.55,4.35,5.15]){add(x,.47,-1.02,.025,.48,.025,lightWood);add(x,.57,-.99,.09,.035,.025,mat("#d7bd83"));}
 add(4.35,1.65,-1.45,2.0,1.24,.16,dark);add(4.35,1.65,-1.34,1.82,1.06,.035,glass);add(4.35,2.29,-1.34,2.0,.07,.035,mat("#4a5966"));
 // Console and controller placed on the cabinet in front of the screen.
 add(4.35,1.01,-.48,.72,.18,.42,mat("#222c39"));add(4.35,1.11,-.48,.52,.025,.28,mat("#8799a6"));add(4.35,1.13,-.27,.22,.035,.1,mat("#d9b66f"));
 add(3.8,1.1,-.32,.3,.07,.18,mat("#303a4b"));add(3.74,1.15,-.32,.07,.04,.07,mat("#d7bd83"));
 // Sofa directly facing the TV, with cushions and visible feet.
 add(4.35,.43,1.45,2.8,.5,.9,fabric);add(4.35,.89,1.8,2.72,.62,.32,mat("#7399a5"));add(3.0,.66,1.45,.32,.78,1.0,wood);add(5.7,.66,1.45,.32,.78,1.0,wood);
 for(const x of [3.25,5.45])for(const z of [1.1,1.8])add(x,.14,z,.12,.28,.12,dark);
 for(const x of [3.75,4.85]){add(x,.72,1.3,.78,.08,.58,mat("#8eafae"));add(x,.88,1.6,.52,.12,.16,mat("#d6c6a5"));}
 // Coffee table, reading material and cup.
 add(4.35,.45,.1,1.55,.12,.7,lightWood);for(const x of [3.72,4.98])for(const z of [-.15,.35])add(x,.22,z,.08,.42,.08,wood);add(4.0,.54,.1,.42,.025,.28,mat("#e5d8bd"));add(4.8,.58,.06,.16,.12,.16,mat("#e9e3d4"));
 // Cabinets are supported by a continuous plinth and feet, not floating.
 for(const x of [-1.45,.55,2.5]){
  add(x,1.25,-3.32,1.48,2.3,.62,wood);add(x,.13,-3.29,1.58,.2,.72,dark);add(x,2.42,-3.29,1.58,.12,.72,lightWood);add(x,1.28,-2.995,1.28,1.95,.035,glass);
  for(const y of [.65,1.28,1.9])add(x,y,-2.94,1.3,.055,.52,lightWood);
  for(let i=0;i<3;i++)add(x-.42+i*.42,.88+i%2*.62,-2.75,.2,.28,.15,[mat("#d4b66d"),mat("#6c9b9c"),mat("#b77b68")][i]);
  for(const dx of [-.56,.56])add(x+dx,.14,-3.32,.12,.28,.16,wood);
 }
 // Tall potted plant beside the lift, with layered foliage.
 add(-5.72,.26,3.18,.78,.5,.78,mat("#9b5d43"));add(-5.72,.52,3.18,.7,.08,.7,mat("#4b3027"));
 for(let i=0;i<11;i++){const a=i*Math.PI*2/11;const leaf=block(scene,new THREE.ConeGeometry(.14,1.05,8),mat(i%2?"#39865e":"#5ca96e"),-5.72+Math.cos(a)*.28,1.12+Math.sin(i*1.7)*.12,3.18+Math.sin(a)*.28);leaf.rotation.z=Math.cos(a)*.58;leaf.rotation.x=Math.sin(a)*.48;}
 // Water dispenser with bottle, taps, tray and cup.
 add(5.7,.72,2.65,.52,1.34,.52,mat("#d9e5df"));add(5.7,1.48,2.65,.43,.52,.43,glass);add(5.7,1.77,2.65,.32,.12,.32,mat("#d9e5df"));add(5.7,.28,2.35,.28,.1,.18,mat("#527d8b"));add(5.55,.9,2.36,.07,.12,.035,mat("#d5a55c"));add(5.82,.9,2.36,.07,.12,.035,mat("#6f9fc0"));
 // Compact fixed lift architecture.
 add(-6.15,1.25,-1.0,.28,2.5,2.0,mat("#26394b"));add(-5.98,1.25,-1.0,.05,2.25,1.7,mat("#142235"));
 const left=add(-5.91,1.25,-1.42,.12,2.12,.78,mat("#8ba4b2")),right=add(-5.91,1.25,-.58,.12,2.12,.78,mat("#718c9e"));const sign=add(-5.78,2.72,-1,.08,.22,.72,mat("#d4b16c"));
 // Floor lamps and framed wall art.
 for(const x of [-.5,2.0]){add(x,.1,2.9,.65,.12,.5,wood);add(x,.85,2.9,.08,1.4,.08,mat("#c59b65"));add(x,1.6,2.9,.42,.2,.42,mat("#e8c88b"));}
 for(let i=0;i<5;i++){const x=-4.6+i*2.3;add(x,2.55,-3.79,.92,.7,.1,wood);add(x,2.55,-3.72,.78,.56,.035,mat(["#456b7c","#8a6a8d","#557f6a","#92704d","#7b9baf"][i]));}
 return {left,right,sign};
}
function createRoom(scene:THREE.Scene){
 scene.background=new THREE.Color("#172438");
 const hemi=new THREE.HemisphereLight("#d8e9ff","#6b4934",2.0);scene.add(hemi);
 const key=new THREE.DirectionalLight("#ffe2b4",2.8);key.position.set(-4,9,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-10;key.shadow.camera.right=10;key.shadow.camera.top=10;key.shadow.camera.bottom=-10;scene.add(key);
 const fill=new THREE.PointLight("#8dbde2",35,18);fill.position.set(4,5,3);scene.add(fill);
 const floor=block(scene,new THREE.BoxGeometry(13, .25, 8),mat("#98704d"),0,-.15,0);floor.receiveShadow=true;
 for(let x=-6;x<=6;x+=1.3){const line=block(scene,new THREE.BoxGeometry(.012,.008,7.8),mat("#b38a62"),x,-.018,0);line.receiveShadow=true;}
 // Rear and side walls, skirting and framed panels
 block(scene,new THREE.BoxGeometry(13,4,.22),mat("#263e55"),0,2,-3.95);
 block(scene,new THREE.BoxGeometry(.22,4,8),mat("#21354a"),-6.45,2,0);
 block(scene,new THREE.BoxGeometry(.22,4,8),mat("#21354a"),6.45,2,0);
 block(scene,new THREE.BoxGeometry(13,.18,.28),mat("#bd8750"),0,.2,-3.8);
 for(let x=-5.5;x<6;x+=2.1){block(scene,new THREE.BoxGeometry(.045,2.8,.04),mat("#547087"),x,2.1,-3.81);block(scene,new THREE.BoxGeometry(1.7,.045,.04),mat("#547087"),x+.85,3.45,-3.81);}
 const ceilingLight=block(scene,new THREE.BoxGeometry(3.2,.08,.45),mat("#ffe4a8"),0,3.85,-1.7);ceilingLight.material=new THREE.MeshBasicMaterial({color:"#ffe5b3"});
 return;
}
function poseRig(r:Rig,t:number,activity:string,moving=false,phaseOverride?:number){const phase=phaseOverride??(t*5.2+r.phase),swing=Math.sin(phase),cs=Math.cos(phase);r.leftLeg.rotation.set(moving?swing*.31:0,0,0);r.rightLeg.rotation.set(moving?-swing*.31:0,0,0);r.leftArm.rotation.set(moving?-swing*.30:0,0,moving?-.07:0);r.rightArm.rotation.set(moving?swing*.30:0,0,moving?.07:0);r.leftElbow.rotation.x=moving?-.16-Math.max(0,swing)*.24:0;r.rightElbow.rotation.x=moving?-.16-Math.max(0,-swing)*.24:0;r.leftHand.rotation.set(0,0,0);r.rightHand.rotation.set(0,0,0);r.root.position.y=moving?Math.max(0,Math.sin(phase*2))*.018:0;r.head.rotation.set(0,Math.sin(t*1.1+r.phase)*.045,0);r.mouth.scale.y=.35;r.bubble.visible=activity==="caller";r.bubble.scale.setScalar(1+Math.sin(t*4+r.phase)*.035);if(activity==="gamer"){r.leftArm.rotation.x=-.72+Math.sin(t*4)*.05;r.rightArm.rotation.x=-.72+Math.cos(t*4)*.05;r.leftElbow.rotation.x=-.45;r.rightElbow.rotation.x=-.45;r.leftLeg.rotation.x=1.18;r.rightLeg.rotation.x=1.18;r.root.position.y=0;r.head.rotation.x=.06+Math.sin(t*2)*.02;}if(activity==="reader"){r.leftArm.rotation.x=-.65;r.rightArm.rotation.x=-.65;r.leftElbow.rotation.x=-.55;r.rightElbow.rotation.x=-.55;r.leftLeg.rotation.x=1.05;r.rightLeg.rotation.x=1.05;r.root.position.y=0;r.head.rotation.x=.16+Math.sin(t*1.4)*.02;}if(activity==="caller"){r.rightArm.rotation.x=-1.05;r.rightArm.rotation.z=-.42+Math.sin(t*2.2)*.08;r.rightElbow.rotation.x=-.9;r.leftArm.rotation.x=-.22+Math.sin(t*3)*.12;r.head.rotation.z=.04+Math.sin(t*2)*.05;r.mouth.scale.y=.32+Math.abs(Math.sin(t*5))*.85;}if(activity==="drink"){r.rightArm.rotation.x=-.9;r.rightArm.rotation.z=-.15;r.rightElbow.rotation.x=-1;r.rightHand.rotation.x=-.25;r.leftArm.rotation.x=-.3;r.head.rotation.x=.3;r.mouth.scale.y=.2;}if(activity==="plant"){r.rightArm.rotation.x=-.62;r.rightArm.rotation.z=-.75;r.rightElbow.rotation.x=-.8;r.leftArm.rotation.x=-.35;r.head.rotation.x=.2;}}
// Physical walkable-space proxies: furniture footprints and actor personal space.
const LOBBY_SOLIDS=[
 {minX:-5.2,maxX:-1.9,minZ:-1.95,maxZ:-.72}, // reception desk
 {minX:-2.25,maxX:3.25,minZ:-3.75,maxZ:-2.85}, // display cabinets
 {minX:3.0,maxX:5.75,minZ:1.0,maxZ:2.05}, // sofa
 {minX:3.45,maxX:5.25,minZ:-.35,maxZ:.48}, // coffee table
 {minX:3.0,maxX:5.7,minZ:-1.95,maxZ:-.95}, // TV cabinet
 {minX:5.35,maxX:6.05,minZ:2.25,maxZ:3.05}, // water dispenser
 {minX:-6.35,maxX:-5.7,minZ:-2.0,maxZ:-.1} // lift housing
];
function overlapsSolid(x:number,z:number,r=.24){return LOBBY_SOLIDS.some(o=>x+r>o.minX&&x-r<o.maxX&&z+r>o.minZ&&z-r<o.maxZ);}
function slideAgainstSolids(current:THREE.Vector3,next:THREE.Vector3,r=.24){
 if(!overlapsSolid(next.x,next.z,r))return next;
 const alongX=new THREE.Vector3(next.x,current.y,current.z),alongZ=new THREE.Vector3(current.x,current.y,next.z);
 if(!overlapsSolid(alongX.x,alongX.z,r))return alongX;
 if(!overlapsSolid(alongZ.x,alongZ.z,r))return alongZ;
 return current.clone();
}
export default function PixelOffice({floor,agents,onSelect,clockingOut=false}:{floor:number;agents:OfficeAgent[];onSelect:(agent:OfficeAgent)=>void;clockingOut?:boolean}){
 const host=useRef<HTMLDivElement>(null);const select=useRef(onSelect);select.current=onSelect;const state=useRef({floor,agents,clockingOut});state.current={floor,agents,clockingOut};
 useEffect(()=>{
  const root=host.current;if(!root)return;
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;root.appendChild(renderer.domElement);
  const scene=new THREE.Scene();createRoom(scene);
  const camera=new THREE.PerspectiveCamera(34,1,.1,100);camera.position.set(9,8.4,12.5);camera.lookAt(0,1,0);
  const lift=furniture(scene);
  const actors:Rig[]=[];
  const lobbyKinds=["gamer","reader","caller"];
  const actorPositions=[[3.35,1.3],[-.55,2.35],[.85,1.1],[-3.8,.6],[1.6,-.15],[3.1,.7]];
  const actorCount=Math.max(3,Math.min(6,state.current.agents.length||3));
  for(let i=0;i<actorCount;i++){const p=actorPositions[i];const actor=makeRig(scene,p[0],p[1],lobbyKinds[i]||"agent",i);actor.root.rotation.y=i===0?Math.PI:i===1?Math.PI*.7:0;if(i<2){actor.root.position.y=.34;actor.leftLeg.rotation.x=1.15;actor.rightLeg.rotation.x=1.15;}actors.push(actor);}
  // Seating for the gamer and reader; visible chair legs and padded backs.
  const seatMat=mat("#654c3d");for(const [x,z] of [[3.35,1.65],[-.55,2.7]]){cube(scene,[.85,.16,.78],"#8c684a",[x,.42,z]);cube(scene,[.82,.65,.14], "#74543f",[x,.78,z+.31]);for(const dx of [-.32,.32])for(const dz of [-.28,.28])cube(scene,[.08,.45,.08],"#493729",[x+dx,.2,z+dz]);}
  const boss=makeRig(scene,-4.7,1.0,"boss",4);boss.root.scale.setScalar(1.08);
  // Decorative details: picture frames, ceiling lamps and wall-mounted signage.
  for(let i=0;i<4;i++){const x=-4.7+i*2.8;const frame=cube(scene,[1.05,.72,.08],"#b88b55",[x,2.45,-3.78]);cube(scene,[.88,.55,.04],["#456b7c","#8a6a8d","#557f6a","#92704d"][i],[x,2.45,-3.72]);}
  const clock=new THREE.Clock();let raf=0,elapsed=0,lastFloor=-1;
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();const actorMeshes:THREE.Object3D[]=[];
  actors.forEach(a=>a.root.traverse(o=>{if((o as THREE.Mesh).isMesh)actorMeshes.push(o);}));
  const resize=()=>{const w=Math.max(320,root.clientWidth),h=Math.max(300,root.clientHeight||w*.58);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(root);resize();
  const animate=()=>{raf=requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);elapsed+=dt;
   if(state.current.floor!==lastFloor){lastFloor=state.current.floor;scene.traverse(o=>{if(o.userData.floorOnly)o.visible=o.userData.floorOnly===lastFloor;});}
   actors.forEach((a,i)=>{const activity=i===0?"gamer":i===1?"reader":i===2?"caller":"idle";poseRig(a,elapsed,activity,false);if(i>=3){a.root.rotation.y=Math.sin(elapsed*.35+i)*.08;}});
   // A perimeter route avoids the reception, display cabinets, sofa and tables.
   const route=[{x:-5.45,z:-1.0,wait:1.2,action:"exit"},{x:-5.25,z:3.25,wait:0,action:"walk"},{x:-5.15,z:3.12,wait:2.0,action:"plant"},{x:-5.15,z:3.25,wait:0,action:"walk"},{x:4.95,z:3.25,wait:0,action:"walk"},{x:5.05,z:3.15,wait:3.0,action:"drink"},{x:4.95,z:3.25,wait:0,action:"walk"},{x:1.9,z:3.25,wait:1.5,action:"inspect"},{x:-5.25,z:3.25,wait:0,action:"walk"},{x:-5.45,z:-1.0,wait:0,action:"walk"}];
   const speed=.95;let cycleDuration=0;for(let i=0;i<route.length;i++){const n=route[i],next=route[(i+1)%route.length];cycleDuration+=n.wait+Math.hypot(next.x-n.x,next.z-n.z)/speed;}
   let cursor=elapsed%cycleDuration,segment=0,progress=0,walking=false,action="idle";
   for(let i=0;i<route.length;i++){const from=route[i],to=route[(i+1)%route.length],duration=Math.hypot(to.x-from.x,to.z-from.z)/speed;if(cursor<from.wait){segment=i;action=from.action;walking=false;break;}cursor-=from.wait;if(cursor<duration){segment=i;progress=duration?cursor/duration:1;walking=true;action="walk";break;}cursor-=duration;if(i===route.length-1){segment=0;action="exit";walking=false;}}
   const from=route[segment],to=route[(segment+1)%route.length];
   if(walking){const eased=THREE.MathUtils.smoothstep(progress,0,1);const desired=new THREE.Vector3(THREE.MathUtils.lerp(from.x,to.x,eased),0,THREE.MathUtils.lerp(from.z,to.z,eased));const safe=slideAgainstSolids(boss.root.position,desired,.25);boss.root.position.x=safe.x;boss.root.position.z=safe.z;boss.root.rotation.y=Math.atan2(to.x-from.x,to.z-from.z);}else{boss.root.position.x=from.x;boss.root.position.z=from.z;if(action==="drink")boss.root.rotation.y=Math.atan2(5.7-from.x,2.65-from.z);else if(action==="plant")boss.root.rotation.y=Math.atan2(-5.72-from.x,3.18-from.z);}
   poseRig(boss,elapsed,action,walking,elapsed*speed*5.2);
   if(action==="drink"&&!walking){boss.rightArm.rotation.x=-.9;boss.rightElbow.rotation.x=-1;boss.head.rotation.x=.28;}
   if(action==="plant"&&!walking){boss.rightArm.rotation.x=-.62;boss.rightArm.rotation.z=-.75;boss.rightElbow.rotation.x=-.8;boss.head.rotation.x=.2;}
   // Lift doors stay shut. A short open/enter/close event occurs only when the boss reaches the lift.
   const liftEvent=(elapsed%cycleDuration)/cycleDuration*52;let open=0;if(liftEvent<.85)open=THREE.MathUtils.smoothstep(liftEvent,0,.85);else if(liftEvent<2.1)open=1;else if(liftEvent<3.0)open=1-THREE.MathUtils.smoothstep(liftEvent,2.1,3.0);else if(liftEvent>48.0&&liftEvent<49.0)open=THREE.MathUtils.smoothstep(liftEvent,48.0,49.0);else if(liftEvent>=49.0&&liftEvent<51.0)open=1;else if(liftEvent>=51.0)open=1-THREE.MathUtils.smoothstep(liftEvent,51.0,52.0);
   lift.left.position.z=-1.42-open*.42;lift.right.position.z=-.58+open*.42;
   if(liftEvent<3.0){boss.root.visible=liftEvent<.8;boss.root.position.x=THREE.MathUtils.lerp(-5.45,-4.8,THREE.MathUtils.smoothstep(liftEvent,.8,2.8));boss.root.position.z=-1.0;}
   else if(liftEvent>=48.0){boss.root.visible=liftEvent<51.5;boss.root.position.x=THREE.MathUtils.lerp(-4.8,-5.45,THREE.MathUtils.smoothstep(liftEvent,48.0,51.2));boss.root.position.z=-1.0;}
   else boss.root.visible=true;
   renderer.render(scene,camera);
  };animate();
  const click=(event:PointerEvent)=>{const rect=renderer.domElement.getBoundingClientRect();pointer.x=(event.clientX-rect.left)/rect.width*2-1;pointer.y=-(event.clientY-rect.top)/rect.height*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(actorMeshes,false);if(!hits.length)return;const picked=actors.find(a=>{let found=false;a.root.traverse(o=>{if(o===hits[0].object)found=true;});return found;});if(picked){const index=actors.indexOf(picked);const agent=state.current.agents[index];if(agent)select.current(agent);}};
  renderer.domElement.addEventListener("pointerdown",click);
  return()=>{cancelAnimationFrame(raf);observer.disconnect();renderer.domElement.removeEventListener("pointerdown",click);scene.traverse(o=>{if((o as THREE.Mesh).isMesh){(o as THREE.Mesh).geometry.dispose();const m=(o as THREE.Mesh).material;if(Array.isArray(m))m.forEach(v=>v.dispose());else m.dispose();}});renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <div className="pixel-stage" ref={host} aria-label="Animated 2.5D three-dimensional isometric Maqna Hive office with articulated characters, walking and activity animations, detailed furniture and a lift that opens only for the boss." />;
}
