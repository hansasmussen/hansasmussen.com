"use client";

import { useEffect } from "react";

export function MobileHomeRedirect() {
  useEffect(() => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      window.location.replace("/work");
    }
  }, []);

  return null;
}
