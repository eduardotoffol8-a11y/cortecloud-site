"use client";
import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function sessionId(){
 const key="orcamovel.analytics.session.v1";
 let value=sessionStorage.getItem(key);
 if(!value){value=crypto.randomUUID();sessionStorage.setItem(key,value);}
 return value;
}
export function LandingAnalytics(){
 useEffect(()=>{
  const supabase=getSupabaseBrowserClient(); if(!supabase)return;
  const sid=sessionId();
  void supabase.rpc("track_orcamovel_event",{p_event_type:"site_view",p_session_id:sid,p_metadata:{path:location.pathname}});
  const click=(event:MouseEvent)=>{
   const target=(event.target as HTMLElement).closest<HTMLElement>("[data-track]");
   if(!target)return;
   const name=target.dataset.track;
   if(name==="plans_open")void supabase.rpc("track_orcamovel_event",{p_event_type:"plans_open",p_session_id:sid,p_metadata:{source:"site"}});
  };
  document.addEventListener("click",click);
  return()=>document.removeEventListener("click",click);
 },[]);
 return null;
}