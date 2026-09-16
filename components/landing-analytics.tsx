"use client";

import { useEffect } from "react";
import { trackOrcaEvent, type AnalyticsProduct } from "@/lib/analytics-client";

export function LandingAnalytics({ product = "moveis" }: { product?: AnalyticsProduct }){
 useEffect(()=>{
  void trackOrcaEvent("site_view",product,{path:location.pathname,source:"site"});
  const click=(event:MouseEvent)=>{
   const target=(event.target as HTMLElement).closest<HTMLElement>("[data-track]");
   if(!target)return;
   const name=target.dataset.track;
   if(name==="plans_open")void trackOrcaEvent("site_plans_interest",product,{source:"site",path:location.pathname});
  };
  document.addEventListener("click",click);
  return()=>document.removeEventListener("click",click);
 },[product]);
 return null;
}
