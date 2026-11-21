import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { OfficeAgent } from "../lib/types";

type Rig={root:THREE.Group;leftArm:THREE.Group;rightArm:THREE.Group;leftLeg:THREE.Group;rightLeg:THREE.Group;head:THREE.Group;kind:string;phase:number};
const palette=["#5d91b8","#bd915e","#8e78b6","#67b99a","#c57c68"];
function mat(color:string,roughness=.82){return new THREE.MeshStandardMaterial({color,roughness,metalness:.02});}
function block(parent:THREE.Object3D,geometry:THREE.BufferGeometry,material:THREE.Material,x:number,y:number,z:number){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cube(parent:THREE.Object3D,size:[number,number,number],color:string,pos:[number,number,number]){return block(parent,new THREE.BoxGeometry(...size),mat(color),...pos);}
function makeRig(scene:THREE.Scene,x:number,z:number,kind:string,index=0):Rig{
 const root=new THREE.Group();root.position.set(x,0,z);scene.add(root);
 const skin=mat(index===0?"#d7a27f":index===1?"#e2b18e":"#bd896d"),shirt=mat(palette[index%palette.length]),pants=mat(index%2?"#303d50":"#29394a"),hair=mat(["#29303a","#563a2b","#30263d","#283b35"][index%4]),shoe=mat("#d5d8d8"),dark=mat("#26303b");
 // Feet, legs and hip pivots; pivot origins sit at hips so the walk cycle articulates naturally.
 const hipY=0.88;
 const makeLimb=(px:number,py:number,material:THREE.Material,len:number,r:number)=>{const pivot=new THREE.Group();pivot.position.set(px,py,0);root.add(pivot);block(pivot,new THREE.CapsuleGeometry(r,len-r*2,4,8),material,0,-len/2,0);return pivot;};
 const leftLeg=makeLimb(-.19,hipY,pants,.76,.13),rightLeg=makeLimb(.19,hipY,pants,.76,.13);
 block(leftLeg,new THREE.BoxGeometry(.3,.16,.42),shoe,0,-.69,.08);block(rightLeg,new THREE.BoxGeometry(.3,.16,.42),shoe,0,-.69,.08);
 const torso=block(root,new THREE.CapsuleGeometry(.34,.57,5,10),shirt,0,1.25,0);torso.scale.set(1,1.12,.72);
 const makeArm=(px:number)=>{const p=new THREE.Group();p.position.set(px,1.55,0);root.add(p);block(p,new THREE.CapsuleGeometry(.115,.55,4,8),shirt,0,-.29,0);block(p,new THREE.SphereGeometry(.12,10,8),skin,0,-.62,.01);return p;};
 const leftArm=makeArm(-.43),rightArm=makeArm(.43);
 const head=new THREE.Group();head.position.set(0,1.98,0);root.add(head);
 block(head,new THREE.SphereGeometry(.34,16,12),skin,0,0,0);
 block(head,new THREE.SphereGeometry(.35,14,8,0,Math.PI*2,0,Math.PI*.58),hair,0,.12,-.025);
 block(head,new THREE.SphereGeometry(.09,8,8),skin,-.34,-.04,0);block(head,new THREE.SphereGeometry(.09,8,8),skin,.34,-.04,0);
 // Face details sit toward the front of the isometric camera.
 block(head,new THREE.SphereGeometry(.035,8,6),dark,-.12,.02,.29);block(head,new THREE.SphereGeometry(.035,8,6),dark,.12,.02,.29);
 block(head,new THREE.BoxGeometry(.12,.025,.035),mat("#8d574e"),0,-.13,.31);
 // Collar and garment detail
 block(root,new THREE.CylinderGeometry(.2,.25,.09,10),mat("#e4d4b9"),0,1.59,0);
 cube(root,[.035,.48,.018],"#e5c27e",[0,1.28,.25]);
 return {root,leftArm,rightArm,leftLeg,rightLeg,head,kind,phase:index*.8};
}
function furniture(scene:THREE.Scene){
 const wood=mat("#875631"),lightWood=mat("#c08b56"),dark=mat("#302b2a"),glass= new THREE.MeshStandardMaterial({color:"#72a6b3",roughness:.25,metalness:.1}),fabric=mat("#527b8b");
 const addBox=(x:number,y:number,z:number,w:number,h:number,d:number,m:THREE.Material)=>block(scene,new THREE.BoxGeometry(w,h,d),m,x,y,z);
 // Reception counter with thick top, front panel and inset brass detail
 addBox(-3.3,.62,-1.2,2.5,1.05,.75,wood);addBox(-3.3,1.18,-1.2,2.7,.12,.88,lightWood);addBox(-3.3,.68,-.79,1.9,.48,.035,mat("#a87546"));
 // Sofa, arms, cushions and feet
 addBox(-1.4,.48,1.5,2.15,.55,.8,fabric);addBox(-1.4,.91,1.5,2.1,.48,.42,mat("#7399a5"));addBox(-2.48,.65,1.5,.28,.7,.85,wood);addBox(-.32,.65,1.5,.28,.7,.85,wood);
 for(const x of [-2.15,-.65])addBox(x,.15,1.5,.12,.3,.12,dark);
 // Coffee table, legs and magazine
 addBox(0,.52,2.35,1.4,.12,.7,lightWood);for(const x of [-.58,.58])for(const z of [2.08,2.62])addBox(x,.25,z,.09,.5,.09,wood);addBox(0,.6,2.32,.5,.025,.32,mat("#e5d8bd"));
 // TV stand and large display
 addBox(4.65,.52,-.25,1.7,.9,.65,wood);addBox(4.65,1.55,-.25,1.9,1.2,.18,dark);addBox(4.65,1.55,-.13,1.72,1.02,.035,glass);
 addBox(4.3,1.55,-.105,.4,.55,.018,mat("#d6b56d"));addBox(4.85,1.55,-.105,.35,.7,.018,mat("#7bc9a5"));addBox(5.25,1.55,-.105,.28,.42,.018,mat("#d68d77"));
 // Display cabinets along back wall, with shelves, glass fronts and brass frames
 for(const x of [-1.3,.65,2.55]){
  addBox(x,1.2,-3.2,1.35,2.2,.5,wood);addBox(x,1.23,-2.92,1.18,1.9,.025,glass);
  for(const y of [.68,1.25,1.82])addBox(x,y,-2.87,1.12,.045,.38,lightWood);
  for(let i=0;i<3;i++){addBox(x-.36+i*.34,.94+i%2*.55,-2.72,.18,.25,.12,[mat("#d4b66d"),mat("#6c9b9c"),mat("#b77b68")][i]);}
 }
 // Reception wall signage, wall sconces, columns
 addBox(0,3.35,-3.78,3.5,.55,.12,mat("#273d50"));addBox(0,3.35,-3.69,3.25,.36,.025,mat("#c59a5d"));
 // Plant leaves, pot
 addBox(3.35,.35,2.25,.55,.65,.55,mat("#a45f42"));
 for(let i=0;i<9;i++){const a=i*Math.PI*2/9;const leaf=block(scene,new THREE.ConeGeometry(.12,.95,7),mat(i%2?"#39865e":"#5ca96e"),3.35+Math.cos(a)*.22,.98+Math.sin(i*1.7)*.15,2.25+Math.sin(a)*.22);leaf.rotation.z=Math.cos(a)*.55;leaf.rotation.x=Math.sin(a)*.45;}
 // Water cooler
 addBox(5.65,.72,2.55,.48,1.35,.48,mat("#d9e5df"));addBox(5.65,1.42,2.55,.42,.52,.42,glass);addBox(5.65,.3,2.3,.12,.08,.025,mat("#527d8b"));
 // Compact lift frame and sliding doors, fixed on left wall
 addBox(-6.15,1.25,-1.0,.28,2.5,2.0,mat("#26394b"));addBox(-5.98,1.25,-1.0,.05,2.25,1.7,mat("#142235"));
 const doorMat=mat("#8ba4b2");const left=addBox(-5.91,1.25,-1.42,.12,2.12,.78,doorMat),right=addBox(-5.91,1.25,-.58,.12,2.12,.78,mat("#718c9e"));
 const sign=addBox(-5.78,2.72,-1,.08,.22,.72,mat("#d4b16c"));
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
function poseRig(r:Rig,t:number,activity:string,moving=false){
 const gait=moving?Math.sin(t*9+r.phase):0;
 r.leftLeg.rotation.set(gait*.62,0,0);r.rightLeg.rotation.set(-gait*.62,0,0);
 r.leftArm.rotation.set(-gait*.42,0,0);r.rightArm.rotation.set(gait*.42,0,0);
 r.root.position.y=moving?Math.abs(Math.sin(t*9+r.phase))*.035:0;
 r.head.rotation.set(0,Math.sin(t*1.1+r.phase)*.045,0);
 r.mouth.scale.y=.35;r.bubble.visible=activity==="caller";r.bubble.scale.setScalar(1+Math.sin(t*4+r.phase)*.035);
 if(activity==="gamer"){r.leftArm.rotation.x=-1.1+Math.sin(t*4)*.08;r.rightArm.rotation.x=-1.1+Math.cos(t*4)*.08;r.leftLeg.rotation.x=1.18;r.rightLeg.rotation.x=1.18;r.root.position.y=0;r.head.rotation.x=.06+Math.sin(t*2)*.02;}
 if(activity==="reader"){r.leftArm.rotation.x=-.9;r.rightArm.rotation.x=-.9;r.leftLeg.rotation.x=1.05;r.rightLeg.rotation.x=1.05;r.root.position.y=0;r.head.rotation.x=.16+Math.sin(t*1.4)*.02;}
 if(activity==="caller"){r.rightArm.rotation.x=-2.25;r.rightArm.rotation.z=-.42+Math.sin(t*2.2)*.08;r.leftArm.rotation.x=-.22+Math.sin(t*3)*.12;r.head.rotation.z=.04+Math.sin(t*2)*.05;r.mouth.scale.y=.32+Math.abs(Math.sin(t*5))*.85;}
 if(activity==="drink"){r.rightArm.rotation.x=-1.85;r.rightArm.rotation.z=-.15;r.leftArm.rotation.x=-.3;r.head.rotation.x=.3;r.mouth.scale.y=.2;}
 if(activity==="plant"){r.rightArm.rotation.x=-1.1;r.rightArm.rotation.z=-.75;r.leftArm.rotation.x=-.55;r.head.rotation.x=.2;}
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
   // Boss patrol uses timed waypoints and explicit pauses. Position, facing and gait share the same path tangent.
   const route=[{x:-4.35,z:1.45,wait:1,action:"idle"},{x:5.0,z:2.1,wait:3.2,action:"drink"},{x:5.0,z:2.1,wait:0,action:"walk"},{x:-4.55,z:.8,wait:3.0,action:"plant"},{x:-4.55,z:.8,wait:0,action:"walk"},{x:-2.8,z:-.2,wait:1.5,action:"inspect"},{x:-4.35,z:1.45,wait:0,action:"walk"}];
   const travel=7.2,cycle=0;let cursor=(elapsed%52),segment=0,progress=0,walking=false,action="idle";
   for(let i=0;i<route.length-1;i++){const from=route[i],to=route[i+1];const pause=from.wait;if(cursor<pause){segment=i;progress=0;action=from.action;walking=false;break;}cursor-=pause;if(cursor<travel){segment=i;progress=cursor/travel;walking=true;action="walk";break;}cursor-=travel;if(i===route.length-2){segment=i+1;progress=0;action="idle";walking=false;}}
   const from=route[segment],to=route[Math.min(segment+1,route.length-1)];
   if(walking){const eased=THREE.MathUtils.smoothstep(progress,0,1);boss.root.position.x=THREE.MathUtils.lerp(from.x,to.x,eased);boss.root.position.z=THREE.MathUtils.lerp(from.z,to.z,eased);boss.root.rotation.y=Math.atan2(to.x-from.x,to.z-from.z);}
   else{boss.root.position.x=from.x;boss.root.position.z=from.z;if(action==="drink")boss.root.rotation.y=Math.PI/2;else if(action==="plant")boss.root.rotation.y=-Math.PI/2;}
   poseRig(boss,elapsed,action,walking);
   if(action==="drink"&& !walking){boss.rightArm.rotation.x=-1.8;boss.head.rotation.x=.28;}
   if(action==="plant"&& !walking){boss.rightArm.rotation.x=-1.2;boss.rightArm.rotation.z=-.8;boss.head.rotation.x=.2;}
   // Lift doors stay shut. A short open/enter/close event occurs only when the boss reaches the lift.
   const liftEvent=elapsed%52;let open=0;if(liftEvent<.85)open=THREE.MathUtils.smoothstep(liftEvent,0,.85);else if(liftEvent<2.1)open=1;else if(liftEvent<3.0)open=1-THREE.MathUtils.smoothstep(liftEvent,2.1,3.0);else if(liftEvent>48.0&&liftEvent<49.0)open=THREE.MathUtils.smoothstep(liftEvent,48.0,49.0);else if(liftEvent>=49.0&&liftEvent<51.0)open=1;else if(liftEvent>=51.0)open=1-THREE.MathUtils.smoothstep(liftEvent,51.0,52.0);
   lift.left.position.z=-1.42-open*.42;lift.right.position.z=-.58+open*.42;
   const entering=liftEvent<3.0,exiting=liftEvent>=48.0;
   if(entering){boss.root.visible=liftEvent<.8;boss.root.position.x=THREE.MathUtils.lerp(-4.7,-5.55,THREE.MathUtils.smoothstep(liftEvent,.8,2.2));boss.root.position.z=-1;}
   else if(exiting){boss.root.visible=liftEvent>48.7&&liftEvent<51.4;boss.root.position.x=THREE.MathUtils.lerp(-5.55,-4.7,THREE.MathUtils.smoothstep(liftEvent,49.0,51.2));boss.root.position.z=-1;}else boss.root.visible=true;
   renderer.render(scene,camera);
  };animate();
  const click=(event:PointerEvent)=>{const rect=renderer.domElement.getBoundingClientRect();pointer.x=(event.clientX-rect.left)/rect.width*2-1;pointer.y=-(event.clientY-rect.top)/rect.height*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(actorMeshes,false);if(!hits.length)return;const picked=actors.find(a=>{let found=false;a.root.traverse(o=>{if(o===hits[0].object)found=true;});return found;});if(picked){const index=actors.indexOf(picked);const agent=state.current.agents[index];if(agent)select.current(agent);}};
  renderer.domElement.addEventListener("pointerdown",click);
  return()=>{cancelAnimationFrame(raf);observer.disconnect();renderer.domElement.removeEventListener("pointerdown",click);scene.traverse(o=>{if((o as THREE.Mesh).isMesh){(o as THREE.Mesh).geometry.dispose();const m=(o as THREE.Mesh).material;if(Array.isArray(m))m.forEach(v=>v.dispose());else m.dispose();}});renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <div className="pixel-stage" ref={host} aria-label="Animated 2.5D three-dimensional isometric Maqna Hive office with articulated characters, walking and activity animations, detailed furniture and a lift that opens only for the boss." />;
}
