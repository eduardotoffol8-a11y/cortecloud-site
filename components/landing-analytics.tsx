"use client";

import { useEffect } from "react";
import { trackOrcamovelEvent } from "@/lib/analytics-client";

export function LandingAnalytics(){
 useEffect(()=>{
  void trackOrcamovelEvent("site_view",{path:location.pathname,source:"site"});
  const click=(event:MouseEvent)=>{
   const target=(event.target as HTMLElement).closest<HTMLElement>("[data-track]");
   if(!target)return;
   const name=target.dataset.track;
   if(name==="plans_open")void trackOrcamovelEvent("site_plans_interest",{source:"site",path:location.pathname});
  };
  document.addEventListener("click",click);
  return()=>document.removeEventListener("click",click);
 },[]);
 return null;
}
