
import { createClient } from "npm:@supabase/supabase-js@2";
import { HTML } from "./page.ts";
const url=Deno.env.get("SUPABASE_URL")!;
const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(async ()=>{
  const bucket="steve-bingo-public";
  const {data:buckets,error:listErr}=await supabase.storage.listBuckets();
  if(listErr)return new Response(JSON.stringify({ok:false,step:"listBuckets",error:listErr.message}),{status:500,headers:{"content-type":"application/json"}});
  if(!buckets?.some(b=>b.id===bucket)){
    const {error:createErr}=await supabase.storage.createBucket(bucket,{public:true,allowedMimeTypes:["text/html"],fileSizeLimit:1048576});
    if(createErr)return new Response(JSON.stringify({ok:false,step:"createBucket",error:createErr.message}),{status:500,headers:{"content-type":"application/json"}});
  }
  const path="index-v1.html";
  const blob=new Blob([HTML],{type:"text/html; charset=utf-8"});
  const {error:uploadErr}=await supabase.storage.from(bucket).upload(path,blob,{contentType:"text/html; charset=utf-8",upsert:true,cacheControl:"60"});
  if(uploadErr)return new Response(JSON.stringify({ok:false,step:"upload",error:uploadErr.message}),{status:500,headers:{"content-type":"application/json"}});
  const {data}=supabase.storage.from(bucket).getPublicUrl(path);
  return new Response(JSON.stringify({ok:true,url:data.publicUrl}),{headers:{"content-type":"application/json","cache-control":"no-store"}});
});
