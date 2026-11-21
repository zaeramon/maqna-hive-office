import { supabase } from "./supabase";
import type { OfficeAgent, WorkspaceSnapshot } from "./types";

const FALLBACK_AGENTS: OfficeAgent[] = [
  { id:"chatgpt",name:"ChatGPT",model:"GPT",floor:3,desk:0,status:"working",task:"Planning the next Hive milestone" },
  { id:"claude",name:"Claude",model:"Claude",floor:4,desk:0,status:"thinking",task:"Reviewing the application architecture" },
  { id:"deepseek",name:"DeepSeek",model:"DeepSeek",floor:5,desk:0,status:"idle",task:"Waiting for a research assignment" },
  { id:"coordinator",name:"Hive Coordinator",model:"Hive",floor:2,desk:0,status:"working",task:"Keeping the workspace in sync" },
];

export type WorkspaceContext = {
  userId: string; workspaceId: string; sessionId: string;
  displayName: string; activeProjectKey: string | null; officeState: any;
  agents: OfficeAgent[]; projects: any[]; exhibits: any[]; recentEvents: any[];
};

export async function openWorkspace(userId: string): Promise<{context:WorkspaceContext; previous:any|null}> {
  const { data: found, error: findError } = await supabase.from("hive_workspaces")
    .select("*").eq("owner_user_id",userId).eq("workspace_key","main").maybeSingle();
  if (findError) throw findError;
  let workspace = found;
  if (!workspace) {
    const {data,error}=await supabase.from("hive_workspaces").insert({owner_user_id:userId,workspace_key:"main",display_name:"Maqna Hive",office_state:{floor:1,layoutVersion:1}}).select("*").single();
    if(error) throw error; workspace=data;
  }
  const {data: sessions,error:sessionError}=await supabase.from("hive_workspace_sessions")
    .select("*").eq("workspace_id",workspace.id)
    .order("last_seen_at",{ascending:false}).limit(1);
  if(sessionError) throw sessionError;
  const previous=sessions?.[0] || null;
  const {data: checkpoints,error:checkpointError}=await supabase.from("hive_workspace_checkpoints")
    .select("*").eq("workspace_id",workspace.id).order("created_at",{ascending:false}).limit(1);
  if(checkpointError) throw checkpointError;
  const last=checkpoints?.[0] || null;
  const {data: session,error:createError}=await supabase.from("hive_workspace_sessions")
    .insert({workspace_id:workspace.id,owner_user_id:userId,device_label:deviceLabel(),status:"active",
      resume_summary:last?.snapshot?.session?.resumeSummary || previous?.resume_summary || "",
      active_task:last?.snapshot?.session?.activeTask || previous?.active_task || ""})
    .select("*").single();
  if(createError) throw createError;
  const [projectResult,exhibitResult,eventResult]=await Promise.all([
    supabase.from("hive_projects").select("project_key,title,status").order("updated_at",{ascending:false}).limit(100),
    supabase.from("hive_office_exhibits").select("exhibit_key,floor_number,exhibit_type,title,caption,asset_path").eq("workspace_id",workspace.id).eq("status","published").order("display_order"),
    supabase.from("hive_workspace_events").select("event_type,actor_id,payload,created_at").eq("workspace_id",workspace.id).order("created_at",{ascending:false}).limit(12)
  ]);
  if(projectResult.error) throw projectResult.error;
  if(exhibitResult.error) throw exhibitResult.error;
  if(eventResult.error) throw eventResult.error;
  let exhibitRows:any[]=exhibitResult.data||[];
  if(exhibitRows.length===0){
    const starter=[
      {exhibit_key:"matchflow-pitch",floor_number:3,exhibit_type:"project",title:"MatchFlow — The Neon Pitch",caption:"A sports platform prototype, represented by a tiny football pitch and a neon-green terminal.",project_key:"matchflow",status:"published",display_order:10,metadata:{theme:"sports",seeded:true}},
      {exhibit_key:"kancil-garage",floor_number:3,exhibit_type:"artifact",title:"The Kancil Garage",caption:"A small second-hand Perodua Kancil project, with future repairs and upgrades on the workshop board.",project_key:"kancil",status:"published",display_order:20,metadata:{theme:"garage",seeded:true}},
      {exhibit_key:"kimchi-lab",floor_number:5,exhibit_type:"artifact",title:"The Fermentation Experiment",caption:"A little kimchi jar remembers an early homemade food-video experiment.",project_key:null,status:"published",display_order:30,metadata:{theme:"food",seeded:true}},
      {exhibit_key:"hero-art-gallery",floor_number:3,exhibit_type:"artwork",title:"Hero Reference Gallery",caption:"A gallery reserved for pixel-art character sheets and visual design experiments.",project_key:null,status:"published",display_order:40,metadata:{theme:"art",seeded:true}},
      {exhibit_key:"question-wall",floor_number:2,exhibit_type:"question",title:"The Question Wall",caption:"A place to pin memorable questions after they are deliberately selected for the museum.",project_key:null,status:"published",display_order:50,metadata:{theme:"questions",seeded:true}}
    ].map(x=>({...x,workspace_id:workspace.id,owner_user_id:userId}));
    const {data:seeded,error:seedError}=await supabase.from("hive_office_exhibits").insert(starter).select("exhibit_key,floor_number,exhibit_type,title,caption,asset_path").order("display_order");
    if(seedError)throw seedError;exhibitRows=seeded||[];
  }
  const agents:OfficeAgent[]=last?.snapshot?.agents?.length ? last.snapshot.agents : FALLBACK_AGENTS;
  const context:WorkspaceContext={userId,workspaceId:workspace.id,sessionId:session.id,
    displayName:workspace.display_name,activeProjectKey:workspace.active_project_key,
    officeState:last?.snapshot?.workspace?.officeState || workspace.office_state || {floor:1,layoutVersion:1},
    agents,projects:projectResult.data||[],recentEvents:(eventResult.data||[]).map((x:any)=>({type:x.event_type,actor:x.actor_id,summary:x.payload?.summary||x.payload?.task||x.event_type,at:x.created_at})),exhibits:await Promise.all(exhibitRows.map(async(x:any)=>{
      let assetPath:string|null=null;
      if(x.asset_path){const {data:signed}=await supabase.storage.from("maqna-hive-uploads").createSignedUrl(x.asset_path,86400);assetPath=signed?.signedUrl||null;}
      return {key:x.exhibit_key,floor:x.floor_number,type:x.exhibit_type,title:x.title,caption:x.caption,assetPath:x.asset_path||null,assetUrl:assetPath};
    })),
  };
  await supabase.from("hive_workspaces").update({last_recalled_at:new Date().toISOString()}).eq("id",workspace.id);
  await logEvent(context,"session.recalled",{previousSessionId:previous?.id||null,checkpointId:last?.id||null});
  return {context,previous};
}

function deviceLabel(){return /Windows/i.test(navigator.userAgent)?"Windows browser":/Mac/i.test(navigator.userAgent)?"Mac browser":"Web browser";}
export async function logEvent(ctx:WorkspaceContext,eventType:string,payload:any,actorType:"human"|"agent"|"system"="system",actorId="system"){
  const {error}=await supabase.from("hive_workspace_events").insert({workspace_id:ctx.workspaceId,session_id:ctx.sessionId,owner_user_id:ctx.userId,event_type:eventType,actor_type:actorType,actor_id:actorId,payload});
  if(error) throw error;
}
export async function saveCheckpoint(ctx:WorkspaceContext,kind:"autosave"|"manual"|"signout"|"recovery",floor:number,summary:string,activeTask:string){
  const snapshot:WorkspaceSnapshot={schemaVersion:1,capturedAt:new Date().toISOString(),
    workspace:{id:ctx.workspaceId,displayName:ctx.displayName,activeProjectKey:ctx.activeProjectKey,officeState:{...ctx.officeState,floor}},
    session:{id:ctx.sessionId,resumeSummary:summary,activeTask},agents:ctx.agents,projects:ctx.projects.map((p:any)=>({key:p.project_key||p.key,title:p.title,status:p.status})),
    exhibits:ctx.exhibits.map((x:any)=>({key:x.key,floor:x.floor,type:x.type,title:x.title,caption:x.caption,assetPath:x.assetPath||null})),recentEvents:ctx.recentEvents};
  const encoded=new TextEncoder().encode(JSON.stringify(snapshot));
  const digest=await crypto.subtle.digest("SHA-256",encoded);
  const checksum=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
  const {data,error}=await supabase.from("hive_workspace_checkpoints").insert({
    workspace_id:ctx.workspaceId,session_id:ctx.sessionId,owner_user_id:ctx.userId,checkpoint_kind:kind,
    snapshot,checksum_sha256:checksum,github_status:"pending"
  }).select("*").single();
  if(error) throw error;
  const [workspaceUpdate,sessionUpdate]=await Promise.all([
    supabase.from("hive_workspaces").update({office_state:snapshot.workspace.officeState,active_project_key:ctx.activeProjectKey}).eq("id",ctx.workspaceId),
    supabase.from("hive_workspace_sessions").update({last_seen_at:new Date().toISOString(),resume_summary:summary,active_task:activeTask}).eq("id",ctx.sessionId)
  ]);
  if(workspaceUpdate.error) throw workspaceUpdate.error;
  if(sessionUpdate.error) throw sessionUpdate.error;
  return {checkpoint:data,snapshot,checksum};
}
export async function heartbeat(ctx:WorkspaceContext){
  const {error}=await supabase.from("hive_workspace_sessions").update({last_seen_at:new Date().toISOString()}).eq("id",ctx.sessionId).eq("status","active");
  if(error) throw error;
}
export async function markSignout(ctx:WorkspaceContext,status:"signing_out"|"signed_out"|"signout_failed"){
  const {error}=await supabase.from("hive_workspace_sessions").update({
    status,last_seen_at:new Date().toISOString(),
    ...(status==="signing_out"?{signout_started_at:new Date().toISOString()}:{}),
    ...(status==="signed_out"?{signed_out_at:new Date().toISOString()}: {})
  }).eq("id",ctx.sessionId);
  if(error) throw error;
}
