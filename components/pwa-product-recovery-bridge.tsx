"use client";

import { useEffect } from "react";

const LAST_PRODUCT_KEY = "orcamento.pwa-last-product";
const MOVEL_INSTALLED_KEY = "orcamovel.pwa-installed.v1";
const OBRA_INSTALLED_KEY = "orcaobra.pwa-installed.v1";

function isStandalone() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

export function PwaProductRecoveryBridge() {
  useEffect(() => {
    if (!isStandalone() || window.location.pathname !== "/") return;

    const lastProduct = window.localStorage.getItem(LAST_PRODUCT_KEY);
    const obraInstalled = window.localStorage.getItem(OBRA_INSTALLED_KEY) === "true";
    const movelInstalled = window.localStorage.getItem(MOVEL_INSTALLED_KEY) === "true";

    const destination = lastProduct === "obra"
      ? "/apps/obra-civil"
      : lastProduct === "moveis"
        ? "/apps/moveis"
        : obraInstalled && !movelInstalled
          ? "/apps/obra-civil"
          : movelInstalled && !obraInstalled
            ? "/apps/moveis"
            : "";

    if (destination) window.location.replace(destination);
  }, []);

  return null;
}
