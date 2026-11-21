import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { supabase, isSupabaseConfigured, githubGatewayUrl } from "./lib/supabase";
import { heartbeat, logEvent, markSignout, openWorkspace, saveCheckpoint } from "./lib/workspace";
import type { WorkspaceContext } from "./lib/workspace";
import type { OfficeAgent } from "./lib/types";
import PixelOffice from "./components/PixelOffice";

const FLOOR_NAMES:Record<number,string>={1:"Central Lobby",2:"Hive Coordination",3:"ChatGPT Research & Creativity",4:"Claude Development Workshop",5:"DeepSeek Intelligence Lab"};
const DEMO_PROJECTS=[{key:"matchflow",title:"MatchFlow",status:"active"},{key:"maqna-hive",title:"Maqna Hive",status:"active"},{key:"kancil",title:"Perodua Kancil",status:"idea"}];

export default function App(){
 const [authMode,setAuthMode]=useState<"login"|"signup"|"forgot"|"reset">("login");
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");
 const [user,setUser]=useState<any>(null);const [ctx,setCtx]=useState<WorkspaceContext|null>(null);
 const [previous,setPrevious]=useState<any>(null);const [floor,setFloor]=useState(1);
 const [selected,setSelected]=useState<OfficeAgent|null>(null);const [selectedExhibit,setSelectedExhibit]=useState<any|null>(null);const [summary,setSummary]=useState("Continuing from the last saved Maqna Hive workspace.");
 const [task,setTask]=useState("Build the GBA-style multi-floor pixel office.");
 const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 const [checkpoint,setCheckpoint]=useState("Cloud sync waiting");const [signoutStep,setSignoutStep]=useState("");
 const [showRecall,setShowRecall]=useState(false);const opening=useRef(false);const restoredUserId=useRef<string|null>(null);
 const projects=useMemo(()=>ctx?.projects?.length?ctx.projects:DEMO_PROJECTS,[ctx]);
 const restore=useCallback(async(currentUser:any)=>{
   if(opening.current||restoredUserId.current===currentUser.id)return;opening.current=true;setBusy(true);setMessage("Opening your cloud workspace…");
   try{const result=await openWorkspace(currentUser.id);setCtx(result.context);setPrevious(result.previous);setFloor(Number(result.context.officeState?.floor||1));setSummary(result.previous?.resume_summary||"Continuing from the last saved Maqna Hive workspace.");setTask(result.previous?.active_task||"Continue the last active Maqna Hive task.");setUser(currentUser);restoredUserId.current=currentUser.id;
     setShowRecall(true);setCheckpoint("Connected to Supabase cloud");setMessage("");
   }catch(e:any){setMessage(e.message||"Workspace recall failed.");}finally{setBusy(false);opening.current=false;}
 },[]);
 useEffect(()=>{if(!isSupabaseConfigured){setMessage("Add your Supabase URL and publishable key to .env.local to enable cloud login.");return;}
   supabase.auth.getSession().then(({data})=>{if(data.session&&!window.location.hash.includes("type=recovery"))restore(data.session.user);});
   const {data:listener}=supabase.auth.onAuthStateChange((event,session)=>{
     if(event==="PASSWORD_RECOVERY"){setAuthMode("reset");setMessage("Choose a new password for your Maqna Hive account.");return;}
     if(session?.user&&!ctx)restore(session.user);
     if(event==="SIGNED_OUT"){setCtx(null);setUser(null);setPrevious(null);setShowRecall(false);restoredUserId.current=null;}
   });
   return()=>listener.subscription.unsubscribe();
 },[restore]);
 useEffect(()=>{if(!ctx)return;const id=window.setInterval(()=>{heartbeat(ctx).catch(()=>setCheckpoint("Cloud heartbeat failed"));},25000);return()=>window.clearInterval(id);},[ctx]);
 useEffect(()=>{if(!ctx)return;const id=window.setInterval(()=>{saveCheckpoint(ctx,"autosave",floor,summary,task).then(()=>setCheckpoint("Autosaved to Supabase")).catch(()=>setCheckpoint("Autosave failed — check connection"));},60000);return()=>window.clearInterval(id);},[ctx,floor,summary,task]);
 const publishSnapshot=async(saved:any)=>{
   if(!githubGatewayUrl)throw new Error("GitHub checkpoint gateway is not configured. Sign-out is blocked until both cloud destinations are ready.");
   const {data:auth}=await supabase.auth.getSession();
   const token=auth.session?.access_token;if(!token)throw new Error("Your authentication session expired before GitHub backup.");
   const response=await fetch(githubGatewayUrl,{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({operation:"checkpoint.publish",snapshot:saved.snapshot,checksum:saved.checksum,checkpointId:saved.checkpoint.id})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok||!result.uploaded||!result.commitSha||!result.path)throw new Error(result.error||"GitHub checkpoint was not verified.");
   const {error}=await supabase.from("hive_workspace_checkpoints").update({github_status:"uploaded",github_path:result.path,github_commit_sha:result.commitSha,verified_at:new Date().toISOString()}).eq("id",saved.checkpoint.id);
   if(error)throw error;
   const {data:confirmed,error:verifyError}=await supabase.from("hive_workspace_checkpoints").select("github_status,github_commit_sha").eq("id",saved.checkpoint.id).single();
   if(verifyError||confirmed?.github_status!=="uploaded"||confirmed?.github_commit_sha!==result.commitSha)throw new Error("GitHub upload acknowledgement was not persisted to Supabase.");
   return result;
 };
 const signIn=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setMessage("");try{
   if(authMode==="forgot"){
     const redirectTo=window.location.origin+window.location.pathname;
     const result=await supabase.auth.resetPasswordForEmail(email,{redirectTo});
     if(result.error)throw result.error;
     setMessage("Password reset email sent. Check your inbox (and spam folder), then open the link on this device to set a new password.");
     return;
   }
   if(authMode==="reset"){
     const result=await supabase.auth.updateUser({password});
     if(result.error)throw result.error;
     setPassword("");setAuthMode("login");setMessage("Your password has been updated. You can now sign in with your new password.");
     await supabase.auth.signOut({scope:"local"});
     return;
   }
   const result=authMode==="login"?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password});
   if(result.error)throw result.error;
   if(!result.data.session){setMessage("Account created. Check your email for confirmation, then sign in.");return;}
   await restore(result.data.user);
 }catch(err:any){setMessage(err.message||"Authentication failed.");}finally{setBusy(false);}};
 const doSignout=async()=>{
   if(!ctx)return;setBusy(true);setSignoutStep("Pausing new work and recording the closing state…");
   try{
     await markSignout(ctx,"signing_out");
     await logEvent(ctx,"office.clockout.started",{floor}, "human","owner");
     setSignoutStep("Agents are tidying their desks…");await new Promise(r=>setTimeout(r,900));
     setSignoutStep("Saving workspace checkpoint to Supabase…");
     const saved=await saveCheckpoint(ctx,"signout",floor,summary,task);
     setSignoutStep("Verifying Supabase checkpoint…");
     const {data:verified,error}=await supabase.from("hive_workspace_checkpoints").select("id,checksum_sha256").eq("id",saved.checkpoint.id).single();
     if(error||!verified||verified.checksum_sha256!==saved.checksum)throw new Error("Supabase checkpoint verification failed.");
     setSignoutStep("Uploading versioned checkpoint to GitHub…");
     const github=await publishSnapshot(saved);
     setSignoutStep("Both cloud copies verified. Turning off the office lights…");
     await logEvent(ctx,"office.clockout.completed",{checkpointId:saved.checkpoint.id,githubCommitSha:github.commitSha,githubPath:github.path},"human","owner");
     await markSignout(ctx,"signed_out");
     const {error:logoutError}=await supabase.auth.signOut({scope:"local"});
     if(logoutError)throw logoutError;
     setCheckpoint("Supabase + GitHub checkpoint verified");
     setCtx(null);setUser(null);setPrevious(null);setShowRecall(false);restoredUserId.current=null;setSignoutStep("");setMessage("Signed out safely. Supabase and GitHub checkpoints are verified.");
   }catch(err:any){await markSignout(ctx,"signout_failed").catch(()=>{});setSignoutStep("");setMessage("Sign-out incomplete. Your browser session remains open. "+(err.message||"Could not safely sign out."));}
   finally{setBusy(false);}
 };
 const publishGithub=async()=>{
   if(!ctx){return;}setBusy(true);try{
     const saved=await saveCheckpoint(ctx,"manual",floor,summary,task);
     const result=await publishSnapshot(saved);
     setCheckpoint("Supabase + GitHub checkpoint verified");setMessage("Cloud checkpoint saved and verified in both systems. Commit: "+result.commitSha.slice(0,10));
   }catch(err:any){setMessage(err.message||"GitHub backup failed.");}finally{setBusy(false);}
 };
 const selectAgent=(agent:OfficeAgent)=>{setSelected(agent);};
 const uploadArtwork=async(event:ChangeEvent<HTMLInputElement>)=>{
   const file=event.target.files?.[0];if(!file||!ctx||!user)return;
   if(!["image/png","image/jpeg","image/webp","image/gif"].includes(file.type)){setMessage("Please choose a PNG, JPG, WEBP or GIF image.");event.target.value="";return;}
   if(file.size>20*1024*1024){setMessage("This image is larger than the 20 MB upload limit.");event.target.value="";return;}
   setBusy(true);setMessage("Uploading artwork to private cloud storage…");
   const id=crypto.randomUUID();const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,100)||"artwork.png";
   const path=user.id+"/"+id+"-"+safeName;
   try{
     const {error:uploadError}=await supabase.storage.from("maqna-hive-uploads").upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type});
     if(uploadError)throw uploadError;
     const exhibitKey="art-"+id.replace(/-/g,"");
     const title=file.name.length>=3?file.name.slice(0,160):"Artwork - "+file.name;
     const {data:row,error:insertError}=await supabase.from("hive_office_exhibits").insert({
       workspace_id:ctx.workspaceId,owner_user_id:ctx.userId,exhibit_key:exhibitKey,floor_number:floor,
       exhibit_type:"artwork",title,caption:"Uploaded from this browser and stored in Maqna Hive private cloud storage.",
       asset_path:path,status:"published",display_order:Date.now()%100000
     }).select("exhibit_key,floor_number,exhibit_type,title,caption,asset_path").single();
     if(insertError){await supabase.storage.from("maqna-hive-uploads").remove([path]);throw insertError;}
     const {data:signed}=await supabase.storage.from("maqna-hive-uploads").createSignedUrl(path,86400);
     const exhibit={key:row.exhibit_key,floor:row.floor_number,type:row.exhibit_type,title:row.title,caption:row.caption,assetPath:path,assetUrl:signed?.signedUrl||null};
     setCtx({...ctx,exhibits:[...ctx.exhibits,exhibit]});setSelectedExhibit(exhibit);
     await logEvent(ctx,"office.exhibit.uploaded",{exhibitKey,filename:safeName,size:file.size},"human","owner").catch(()=>{});
     setMessage("Artwork uploaded and saved to Supabase. It will be available from your other PC after login.");
   }catch(error:any){setMessage(error.message||"Artwork upload failed.");}
   finally{setBusy(false);event.target.value="";}
 };

 if(!ctx)return <main className="login-screen"><section className="login-panel"><div className="pixel-logo">MH</div><p className="eyebrow">MAQNA TOWER · CLOUD HEADQUARTERS</p><h1>{authMode==="login"?"Welcome back, Administrator":authMode==="signup"?"Create your Hive account":authMode==="forgot"?"Reset your password":"Choose a new password"}</h1><p className="muted">{authMode==="forgot"?"Enter your account email and we’ll send you a secure reset link.":authMode==="reset"?"Your reset link is verified. Set a new password below.":"Your office, colleagues and project history live in the cloud."}</p>
   <form onSubmit={signIn}>{authMode!=="reset"&&<label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" required /></label>}{authMode!=="forgot"&&<label>{authMode==="reset"?"New password":"Password"}<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={authMode==="login"?"current-password":"new-password"} minLength={8} required /></label>}<button className="primary-button" disabled={busy||!isSupabaseConfigured}>{busy?"Please wait…":authMode==="forgot"?"Send reset link":authMode==="reset"?"Update password":authMode==="login"?"Enter Maqna Hive":"Create account"}</button></form>
   {authMode==="login"&&<button className="link-button" onClick={()=>{setMessage("");setAuthMode("forgot");}}>Forgot password?</button>}
   {authMode==="forgot"&&<button className="link-button" onClick={()=>{setMessage("");setAuthMode("login");}}>Back to sign in</button>}
   {authMode==="reset"&&<button className="link-button" onClick={()=>{setMessage("");setAuthMode("login");}}>Back to sign in</button>}
   {authMode==="login"||authMode==="signup"?<button className="link-button" onClick={()=>{setMessage("");setAuthMode(authMode==="login"?"signup":"login");}}>{authMode==="login"?"Create account":"Back to sign in"}</button>:null}
   {message&&<p className="notice" role="status">{message}</p>}{!isSupabaseConfigured&&<p className="notice">Cloud login is not configured in this build. Copy .env.example to .env.local and set the public Supabase values.</p>}
   <p className="fine-print">Private access is controlled by Supabase Auth and the Hive Mind administrator role.</p>
 </section></main>;
 return <main className="office-shell"><header className="topbar"><div className="brand-lockup"><div className="pixel-logo small-logo">MH</div><div><strong>MAQNA HIVE</strong><small>16-BIT CLOUD HEADQUARTERS</small></div></div><div className="top-actions"><span className="sync-state">{checkpoint}</span><span className="user-email">{user?.email}</span><button className="clockout-button" onClick={doSignout} disabled={busy}>Clock out</button></div></header>
   <section className="welcome-strip"><div><p className="eyebrow">MAQNA TOWER · LIVE WORKSPACE</p><h1>Welcome back to the Hive.</h1><p>Last known task: {previous?.active_task||task}</p></div><div className="cloud-lights"><i/> CLOUD LINK ACTIVE</div></section>
   {showRecall&&<section className="recall-banner"><div><strong>Workspace recalled</strong><p>{previous?.resume_summary||"Your cloud workspace is ready. This is the first recorded session on this device or no previous session summary was available."}</p></div><button onClick={()=>setShowRecall(false)}>Dismiss</button></section>}
   <div className="workspace-grid"><section className="office-card"><div className="office-card-head"><div><p className="eyebrow">FLOOR {floor}</p><h2>{FLOOR_NAMES[floor]}</h2></div><div className="floor-tabs">{[1,2,3,4,5].map(n=><button key={n} className={floor===n?"active":""} onClick={()=>{setFloor(n);setSelected(null);}}>{n}F</button>)}</div></div><PixelOffice floor={floor} agents={ctx.agents} onSelect={selectAgent} clockingOut={Boolean(signoutStep)}/><div className="floor-caption"><span>MAQNA TOWER · PIXEL OFFICE</span><span>CLICK AN AGENT TO INSPECT</span></div></section>
   <aside className="side-column"><section className="panel"><p className="eyebrow">AGENT STATUS</p><h3>{selected?selected.name:"Your AI colleagues"}</h3>{selected?<><p className="agent-task">{selected.task}</p><div className="agent-meta"><span>{selected.model}</span><span>{selected.status.toUpperCase()}</span></div><button className="secondary-button" onClick={()=>setSelected(null)}>All agents</button></>:ctx.agents.map(a=><button className="agent-row" key={a.id} onClick={()=>setSelected(a)}><span className={"agent-dot "+a.status}/><span><strong>{a.name}</strong><small>{a.task}</small></span><em>{a.status}</em></button>)}</section>
   <section className="panel"><p className="eyebrow">RESUME NOTES</p><label>What were we working on?<textarea value={summary} onChange={e=>setSummary(e.target.value)} /></label><label>Current task<input value={task} onChange={e=>setTask(e.target.value)} /></label><button className="secondary-button" disabled={busy} onClick={()=>ctx&&saveCheckpoint(ctx,"manual",floor,summary,task).then(()=>setCheckpoint("Manual checkpoint saved to Supabase")).catch(e=>setMessage(e.message))}>Save checkpoint</button><button className="secondary-button" disabled={busy} onClick={publishGithub}>Save GitHub snapshot</button></section>
   <section className="panel"><p className="eyebrow">PROJECT REGISTER</p>{projects.map(p=><div className="project-row" key={p.project_key||p.key}><strong>{p.title}</strong><small>{p.status}</small></div>)}</section>
   <section className="panel"><p className="eyebrow">MEMORY MUSEUM</p><h3>Artifacts from our history</h3><label className="upload-control">Upload an image to this floor<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={uploadArtwork} disabled={busy}/></label>{ctx.exhibits.map(ex=><button className="exhibit-row" key={ex.key} onClick={()=>{setSelectedExhibit(ex);setFloor(ex.floor);}}><span className="exhibit-icon">{ex.type==="question"?"?":ex.type==="artwork"?"▧":ex.type==="project"?"⚑":"▣"}</span><span><strong>{ex.title}</strong><small>FLOOR {ex.floor} · {ex.type.toUpperCase()}</small></span></button>)}{selectedExhibit&&<div className="exhibit-detail"><strong>{selectedExhibit.title}</strong>{selectedExhibit.assetUrl&&<img src={selectedExhibit.assetUrl} alt={selectedExhibit.title}/>}<p>{selectedExhibit.caption}</p><small>EXHIBIT KEY: {selectedExhibit.key}</small></div>}</section></aside></div>
   <footer className="bottom-bar"><span>SUPABASE CLOUD MEMORY</span><span>{checkpoint}</span><span>LOCAL DEVICE = TERMINAL ONLY</span></footer>
   {signoutStep&&<div className="clockout-overlay"><div className="clockout-modal"><div className="pixel-moon">☾</div><p className="eyebrow">END OF DAY PROTOCOL</p><h2>Closing Maqna Tower</h2><p>{signoutStep}</p><div className="loading-track"><i/></div><small>Please keep this tab open until the save is verified.</small></div></div>}
   {message&&<div className="toast" role="status">{message}<button onClick={()=>setMessage("")}>×</button></div>}
 </main>;
}
