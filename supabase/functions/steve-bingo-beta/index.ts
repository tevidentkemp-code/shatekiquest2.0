
import { HTML } from "./page.ts";
const SB_URL=Deno.env.get("SUPABASE_URL");const SB_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PHRASES=["“Jessica”","“Defrosting a chicken”","“No, no, no”","“My mate Pete”","“Rose of Denmark”","“Going home after this”","“Been round my mums”","“Got something out of the loft”","TAPS BELLY \"I need to lose this\"","“Ann Summers Email”","“Sparrow Legs”","Pole Dance","Flappy Hands","Salmon Shorts","“Sitting with all my mates”","“Where’s the teenager?”","“M&S”","“Woke up on my sofa”","“Fridge isn’t working”","“Pooping to the Vanbrugh”","“Peto”","Impression of a dog","Salmon Polo Shirt","“Nipped Into Sainsburys”","“Not coming out this week”","“My mum and sister”","Doesn’t stop talking for 5 mins","Hello","You're just short","I'm 6ft 2"];
const BONUS_INDICES=[11,12,13,21,22,26];const BONUS_SET=new Set(BONUS_INDICES);const MAIN_INDICES=[...Array(PHRASES.length).keys()].filter(i=>!BONUS_SET.has(i));

const LINES=[[0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15],[0,4,8,12],[1,5,9,13],[2,6,10,14],[3,7,11,15],[0,5,10,15],[3,6,9,12]];
const CORS={"access-control-allow-origin":"*","access-control-allow-headers":"authorization,x-client-info,apikey,content-type"};
function J(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{...CORS,"content-type":"application/json","cache-control":"no-store"}})}
function LI(){const p={};for(const x of new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(new Date()))if(x.type!=="literal")p[x.type]=x.value;return{date:p.year+"-"+p.month+"-"+p.day,hour:+p.hour,time:p.hour+":"+p.minute+":"+p.second}}
async function DB(path,method="GET",body){const r=await fetch(SB_URL+"/rest/v1/"+path,{method,headers:{apikey:SB_KEY,authorization:"Bearer "+SB_KEY,"content-type":"application/json",prefer:"return=representation"},body:body===undefined?undefined:JSON.stringify(body)});const t=await r.text();if(!r.ok)throw new Error(t||("DB "+r.status));return t?JSON.parse(t):null}
async function one(path){const x=await DB(path);return x&&x[0]||null}async function H(s){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}function tok(n=32){const a=new Uint8Array(n);crypto.getRandomValues(a);return btoa(String.fromCharCode(...a)).replace(/[+/=]/g,"").slice(0,n)}function code5(){const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",a=new Uint8Array(5);crypto.getRandomValues(a);return [...a].map(x=>c[x%c.length]).join("")}function shuffle(a){const r=new Uint32Array(a.length);crypto.getRandomValues(r);for(let i=a.length-1;i>0;i--){const k=r[i]%(i+1);[a[i],a[k]]=[a[k],a[i]]}return a}function pickBonus(){return shuffle([...BONUS_INDICES]).slice(0,3)}function board(g){return shuffle(MAIN_INDICES.filter(x=>x!==g.phrase_of_day)).slice(0,16)}function curve(n,p){const a=p?[20,6,3,1,1]:[10,4,2,1,1];return a.slice(0,Math.min(n,5)).reduce((x,y)=>x+y,0)}function w90(t){t=t.filter(Boolean).sort((a,b)=>a-b);let best=0;for(let i=0;i<t.length;i++){let k=i;while(k+1<t.length&&t[k+1]-t[i]<=90000)k++;best=Math.max(best,k-i+1)}return best}
async function vp(id,t){const x=await one("sb_player_tokens?player_id=eq."+id+"&select=token_hash");return!!x&&x.token_hash===await H(t||"")}async function vh(id,t){const x=await one("sb_game_tokens?game_id=eq."+id+"&select=host_token_hash");return!!x&&x.host_token_hash===await H(t||"")}async function note(g,p,k,m,pts=0){await DB("sb_notifications","POST",{game_id:g,player_id:p,kind:k,message:m,points:pts})}
async function closePrev(date){const g=await one("sb_games?mode=eq.daily&game_date=lt."+date+"&status=neq.complete&order=game_date.desc&limit=1&select=*");if(!g)return;const top=await one("sb_players?game_id=eq."+g.id+"&order=score.desc,updated_at.asc&limit=1&select=id");await DB("sb_games?id=eq."+g.id,"PATCH",{status:"complete",winner_player_id:top&&top.id||null,ended_at:new Date().toISOString(),updated_at:new Date().toISOString()})}
async function daily(){
  const li=LI();await closePrev(li.date);
  let g=await one("sb_games?mode=eq.daily&game_date=eq."+li.date+"&select=*");
  if(!g){
    let h=0;for(const c of li.date)h=((h*31)+c.charCodeAt(0))>>>0;
    const potd=MAIN_INDICES[h%MAIN_INDICES.length];
    g=(await DB("sb_games","POST",{mode:"daily",game_date:li.date,status:li.hour>=18?"live":"lobby",phrase_of_day:potd,bonus_indices:pickBonus(),started_at:li.hour>=18?new Date().toISOString():null}))[0]
  }else if(li.hour>=18&&g.status==="lobby"){
    g=(await DB("sb_games?id=eq."+g.id,"PATCH",{status:"live",started_at:g.started_at||new Date().toISOString(),updated_at:new Date().toISOString()}))[0]
  }
  return g
}
async function cp(g,pid,name){
  const device=String(pid||"").trim(),display=String(name||"").trim().slice(0,24);
  if(!device)throw new Error("Missing player profile");
  const existing=await one("sb_players?game_id=eq."+g.id+"&device_id=eq."+encodeURIComponent(device)+"&select=*");
  const raw=tok(),hash=await H(raw);
  if(existing){
    const updated=(await DB("sb_players?id=eq."+existing.id,"PATCH",{name:display||existing.name,last_seen:new Date().toISOString(),updated_at:new Date().toISOString()}))[0]||existing;
    const tr=await one("sb_player_tokens?player_id=eq."+existing.id+"&select=player_id");
    if(tr)await DB("sb_player_tokens?player_id=eq."+existing.id,"PATCH",{token_hash:hash});
    else await DB("sb_player_tokens","POST",{player_id:existing.id,token_hash:hash});
    return{player:updated,token:raw,reused:true}
  }
  const p=(await DB("sb_players","POST",{game_id:g.id,device_id:device,name:display,board:board(g),extras:g.bonus_indices||[],counts:Array(PHRASES.length).fill(0)}))[0];
  await DB("sb_player_tokens","POST",{player_id:p.id,token_hash:hash});
  return{player:p,token:raw,reused:false}
}
async function active(pid){const e=await DB("sb_events?player_id=eq."+pid+"&order=created_at.asc&select=*"),rm=new Set(e.filter(x=>x.kind==="remove"&&x.target_event_id).map(x=>x.target_event_id));return e.filter(x=>x.kind==="hit"&&!rm.has(x.id))}
async function refresh(pid){
  const p=await one("sb_players?id=eq."+pid+"&select=*"),g=p&&await one("sb_games?id=eq."+p.game_id+"&select=*");
  if(!p||!g)return null;

  const hs=await active(pid),cnt=Array(PHRASES.length).fill(0),first=Array(PHRASES.length).fill(0);
  for(const e of hs){cnt[e.phrase_index]++;const t=Date.parse(e.created_at);if(!first[e.phrase_index]||t<first[e.phrase_index])first[e.phrase_index]=t}

  const mainSet=new Set(p.board||[]),extraSet=new Set(g.bonus_indices||[]);
  let regularPoints=0,potdPoints=0,extraPoints=0;
  for(const i of mainSet)regularPoints+=curve(cnt[i],false);
  potdPoints=curve(cnt[g.phrase_of_day],true);
  for(const i of extraSet)extraPoints+=curve(cnt[i],false);

  const b=p.board||[],m=b.map(ph=>cnt[ph]>0),done=LINES.map(l=>l.every(pos=>m[pos])),lc=done.filter(Boolean).length;
  const corners=[0,3,12,15].every(pos=>m[pos]);
  const x=[0,5,10,15,3,6,9,12].every(pos=>m[pos]);
  const boardComplete=b.length===16&&m.every(Boolean);
  const jackpot=boardComplete&&cnt[g.phrase_of_day]>0&&(g.bonus_indices||[]).length===3&&(g.bonus_indices||[]).every(i=>cnt[i]>0);

  // Lines / corners / X / combos are bonus points only. 4x4 completion is the actual Bingo/game completion.
  const patternPoints=(lc>=1?25:0)+(lc>=2?25:0)+(corners?25:0)+(x?40:0);
  const completionPoints=boardComplete?75:0;
  const jackpotPoints=jackpot?75:0;

  let comboSum=0,best=0;
  for(const l of LINES){const n=w90(l.map(pos=>first[b[pos]])),v=n>=4?20:n>=3?10:0;comboSum+=v;best=Math.max(best,n)}
  const comboPoints=Math.min(60,comboSum);

  const old=p.achievements||{},now=new Date().toISOString(),
    vals={line1:lc>=1,line2:lc>=2,corners,x,house:boardComplete,jackpot},
    ach={},
    meta={
      line1:["1 LINE BONUS",25],
      line2:["2 LINES BONUS",25],
      corners:["4 CORNERS BONUS",25],
      x:["X BONUS",40],
      house:["BINGO — 4×4 COMPLETE",75],
      jackpot:["JACKPOT — 20/20",75]
    },
    ns=[];

  for(const k of Object.keys(vals)){
    ach[k]=vals[k];
    ach[k+"At"]=vals[k]?(old[k]?old[k+"At"]||now:now):null;
    if(vals[k]&&!old[k])ns.push([k,p.name+" — "+meta[k][0]+" +"+meta[k][1],meta[k][1]])
  }

  const oc=+(p.combo_state&&p.combo_state.score||0);
  if(comboPoints>oc){
    const d=comboPoints-oc,t=best>=4?"FULL STEVE":"STEVE HAT-TRICK";
    ns.push(["combo",p.name+" — "+t+" +"+d,d])
  }

  const total=regularPoints+potdPoints+extraPoints+patternPoints+completionPoints+comboPoints+jackpotPoints;
  const breakdown={
    regular:regularPoints,
    potd:potdPoints,
    bonus:extraPoints,
    bingo:patternPoints+completionPoints,
    combo:comboPoints,
    jackpot:jackpotPoints,
    total
  };

  const row=(await DB("sb_players?id=eq."+p.id,"PATCH",{
    counts:cnt,
    score:total,
    score_breakdown:breakdown,
    line_count:lc,
    total_hits:hs.length,
    potd_count:cnt[g.phrase_of_day],
    achievements:ach,
    combo_state:{score:comboPoints,best},
    full_house_at:boardComplete?(p.full_house_at||now):null,
    jackpot_at:jackpot?(p.jackpot_at||now):null,
    updated_at:now
  }))[0];

  for(const n of ns)await note(g.id,p.id,n[0],n[1],n[2]);

  // Winner: first player to complete the 4x4 main board in any live game.
  // Word of the Day + the 3 Actions/Clothes cells are bonus-only; Jackpot may occur on the same final hit.
  if(boardComplete&&g.status==="live"&&!g.winner_player_id){
    const won=await DB("sb_games?id=eq."+g.id+"&status=eq.live&winner_player_id=is.null","PATCH",{
      status:"complete",winner_player_id:p.id,ended_at:now,updated_at:now
    });
    if(won.length)await note(g.id,p.id,"winner","🏆 "+p.name+" GOT BINGO — 4×4 COMPLETE"+(jackpot?" + JACKPOT!":""),0)
  }
  return row
}
async function state(gid,pid){let g=await one("sb_games?id=eq."+gid+"&select=*");if(!g)throw new Error("Game not found");if(g.mode==="daily"){const li=LI();if(g.game_date===li.date&&li.hour>=18&&g.status==="lobby")g=(await DB("sb_games?id=eq."+g.id,"PATCH",{status:"live",started_at:g.started_at||new Date().toISOString(),updated_at:new Date().toISOString()}))[0]}const ps=await DB("sb_players?game_id=eq."+g.id+"&order=score.desc,joined_at.asc&select=id,name,score,score_breakdown,line_count,total_hits,potd_count,last_seen,achievements,full_house_at,joined_at"),notes=await DB("sb_notifications?game_id=eq."+g.id+"&order=id.desc&limit=12&select=*"),me=pid?await one("sb_players?id=eq."+pid+"&game_id=eq."+g.id+"&select=*"):null,w=g.winner_player_id?ps.find(p=>p.id===g.winner_player_id)||null:null;return{game:g,players:ps,notifications:notes.reverse(),me,phrases:PHRASES,winner:w,london:LI()}}
async function pbs(id){
  const ps=await DB("sb_players?device_id=eq."+encodeURIComponent(id)+"&select=*");if(!ps.length)return{};
  const ids=[...new Set(ps.map(p=>p.game_id))],gs=await DB("sb_games?id=in.("+ids.join(",")+")&select=*"),gm=new Map(gs.map(g=>[g.id,g]));
  const o={fastestLine1:null,fastestLine2:null,fastestCorners:null,fastestX:null,fastestHouse:null,fastestJackpot:null,highestDaily:null,highestPrivate:null,mostHits:null};
  const ks=[["line1","fastestLine1"],["line2","fastestLine2"],["corners","fastestCorners"],["x","fastestX"],["house","fastestHouse"],["jackpot","fastestJackpot"]];
  for(const p of ps){
    const g=gm.get(p.game_id);if(!g)continue;
    for(const [ak,ok] of ks){const at=p.achievements&&p.achievements[ak+"At"];if(at&&g.started_at){const s=Math.max(0,(Date.parse(at)-Date.parse(g.started_at))/1000);if(o[ok]===null||s<o[ok])o[ok]=s}}
    if(g.mode==="daily"&&(o.highestDaily===null||p.score>o.highestDaily))o.highestDaily=p.score;
    if(g.mode==="private"&&(o.highestPrivate===null||p.score>o.highestPrivate))o.highestPrivate=p.score;
    if(o.mostHits===null||p.total_hits>o.mostHits)o.mostHits=p.total_hits
  }
  return o
}
async function API(b){const a=b.action;if(a==="daily"){const g=await daily();return{ok:true,...await state(g.id)}}if(a==="create_private"){let c="";for(let i=0;i<8;i++){c=code5();if(!await one("sb_games?code=eq."+c+"&select=id"))break}const potd=MAIN_INDICES[crypto.getRandomValues(new Uint8Array(1))[0]%MAIN_INDICES.length],g=(await DB("sb_games","POST",{mode:"private",code:c,status:"lobby",phrase_of_day:potd,bonus_indices:pickBonus()}))[0],ht=tok();await DB("sb_game_tokens","POST",{game_id:g.id,host_token_hash:await H(ht)});const z=await cp(g,b.profileId,b.name);await DB("sb_games?id=eq."+g.id,"PATCH",{host_player_id:z.player.id,updated_at:new Date().toISOString()});return{ok:true,auth:{gameId:g.id,playerId:z.player.id,token:z.token,hostToken:ht,mode:"private",code:c},...await state(g.id,z.player.id)}}if(a==="join_private"){const g=await one("sb_games?code=eq."+String(b.code||"").toUpperCase()+"&select=*");if(!g)return{ok:false,error:"Game code not found"};if(g.status==="complete")return{ok:true,complete:true,...await state(g.id)};const z=await cp(g,b.profileId,b.name);return{ok:true,auth:{gameId:g.id,playerId:z.player.id,token:z.token,mode:"private",code:g.code},...await state(g.id,z.player.id)}}if(a==="join_daily"){
  const g=await daily();
  if(g.status==="complete"){
    const existing=await one("sb_players?game_id=eq."+g.id+"&device_id=eq."+encodeURIComponent(String(b.profileId||""))+"&select=*");
    if(!existing)return{ok:true,complete:true,...await state(g.id)};
    const z=await cp(g,b.profileId,b.name);
    return{ok:true,complete:true,auth:{gameId:g.id,playerId:z.player.id,token:z.token,mode:"daily"},...await state(g.id,z.player.id)}
  }
  const z=await cp(g,b.profileId,b.name);
  return{ok:true,auth:{gameId:g.id,playerId:z.player.id,token:z.token,mode:"daily"},reused:!!z.reused,...await state(g.id,z.player.id)}
}if(a==="rejoin"){if(!await vp(b.playerId,b.token))return{ok:false,error:"Session expired"};await DB("sb_players?id=eq."+b.playerId,"PATCH",{last_seen:new Date().toISOString()});return{ok:true,...await state(b.gameId,b.playerId)}}if(a==="state"){if(b.playerId&&b.token&&await vp(b.playerId,b.token))await DB("sb_players?id=eq."+b.playerId,"PATCH",{last_seen:new Date().toISOString()});return{ok:true,...await state(b.gameId,b.playerId)}}if(a==="start_private"){if(!await vh(b.gameId,b.hostToken))return{ok:false,error:"Host permission required"};await DB("sb_games?id=eq."+b.gameId+"&status=eq.lobby","PATCH",{status:"live",started_at:new Date().toISOString(),updated_at:new Date().toISOString()});return{ok:true,...await state(b.gameId,b.playerId)}}if(a==="end_private"){if(!await vh(b.gameId,b.hostToken))return{ok:false,error:"Host permission required"};const top=await one("sb_players?game_id=eq."+b.gameId+"&order=score.desc,updated_at.asc&limit=1&select=id");await DB("sb_games?id=eq."+b.gameId+"&status=neq.complete","PATCH",{status:"complete",winner_player_id:top&&top.id||null,ended_at:new Date().toISOString(),updated_at:new Date().toISOString()});return{ok:true,...await state(b.gameId,b.playerId)}}if(a==="hit"||a==="remove"){
  if(!await vp(b.playerId,b.token))return{ok:false,error:"Player session invalid"};
  const idx=+b.phraseIndex,clientEventId=String(b.clientEventId||"");
  // A lost response may be retried after removal or the winning hit completed.
  // Match the original command before checking whether the room is still live.
  if(clientEventId){
    const prior=await one("sb_events?client_event_id=eq."+encodeURIComponent(clientEventId)+"&select=game_id,player_id,kind,phrase_index");
    if(prior){
      if(prior.game_id===b.gameId&&prior.player_id===b.playerId&&prior.kind===a&&+prior.phrase_index===idx)
        return{ok:true,...await state(b.gameId,b.playerId)};
      return{ok:false,error:"Tap ID already used for another action"};
    }
  }
  const g=await one("sb_games?id=eq."+b.gameId+"&select=*");if(!g||g.status!=="live")return{ok:false,error:"Game is not live"};if(g.mode==="daily"&&LI().hour<18)return{ok:false,error:"Daily game is closed"};const p=await one("sb_players?id=eq."+b.playerId+"&game_id=eq."+g.id+"&select=board");if(!p||idx<0||idx>=PHRASES.length)return{ok:false,error:"Invalid phrase"};const allowed=new Set([...(p.board||[]),g.phrase_of_day,...(g.bonus_indices||[])]);if(!allowed.has(idx))return{ok:false,error:"Phrase not active in this game"};if(a==="hit"){try{await DB("sb_events","POST",{game_id:g.id,player_id:b.playerId,phrase_index:idx,kind:"hit",client_event_id:String(b.clientEventId||crypto.randomUUID())})}catch(e){if(!String(e).includes("duplicate"))throw e}}else{const ev=await DB("sb_events?player_id=eq."+b.playerId+"&phrase_index=eq."+idx+"&kind=eq.hit&order=created_at.desc&select=id"),rm=await DB("sb_events?player_id=eq."+b.playerId+"&kind=eq.remove&select=target_event_id"),rs=new Set(rm.map(x=>x.target_event_id)),t=ev.find(x=>!rs.has(x.id));if(t)await DB("sb_events","POST",{game_id:g.id,player_id:b.playerId,phrase_index:idx,kind:"remove",target_event_id:t.id,client_event_id:String(b.clientEventId||crypto.randomUUID())})}await refresh(b.playerId);return{ok:true,...await state(g.id,b.playerId)}}if(a==="pbs")return{ok:true,pbs:await pbs(b.profileId)};return{ok:false,error:"Unknown action"}}
Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:CORS});if(req.method==="GET")return new Response(HTML,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}});try{return J(await API(await req.json()))}catch(e){console.error(e);const m=String(e&&e.message||e);const friendly=m.includes("duplicate key")?"You're already in this game — rejoining your existing player.":"Game sync failed. Please try again.";return J({ok:false,error:friendly},500)}});
