"use client";

import { useEffect } from "react";

export function TapFeedback() {
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest("button, a");
      if (!(control instanceof HTMLElement) || control.ariaDisabled === "true") return;
      if (control instanceof HTMLButtonElement && control.disabled) return;
      control.classList.remove("tap-pop");
      void control.offsetWidth;
      control.classList.add("tap-pop");
      if ("vibrate" in navigator) navigator.vibrate(15);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return null;
}
