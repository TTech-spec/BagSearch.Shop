// shadcn/ui-style Sheet: we own the code, Radix Dialog supplies focus trap,
// Esc-to-close, scroll lock and ARIA. Motion (framer-motion) drives the animation.
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, MotionConfig, motion as Motion } from "framer-motion";
import { createContext, useContext, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import "./sheet.css";

const OpenCtx = createContext(false);
const srOnly = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" };

export function Sheet({ open, onOpenChange, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <OpenCtx.Provider value={open}>{children}</OpenCtx.Provider>
    </Dialog.Root>
  );
}
export const SheetClose = Dialog.Close;

export function SheetContent({ title, description, children, className = "" }) {
  const open = useContext(OpenCtx);
  return (
    <MotionConfig reducedMotion="user"><AnimatePresence>
      {open && (
        <Dialog.Portal forceMount>
          <Dialog.Overlay asChild forceMount>
            <Motion.div className="bs-sheet-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} />
          </Dialog.Overlay>
          <Dialog.Content asChild forceMount>
            <Motion.div
              className={`bs-sheet ${className}`}
              initial={false} exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.4, 0, 1, 1] }}
              drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0.4, right: 0 }}
              onDragEnd={(_, i) => { if (i.offset.x < -80 || i.velocity.x < -500) document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); }}
            >
              <Dialog.Title style={srOnly}>{title}</Dialog.Title>
              <Dialog.Description style={srOnly}>{description || title}</Dialog.Description>
              <GsapEntrance>{children}</GsapEntrance>
            </Motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      )}
    </AnimatePresence></MotionConfig>
  );
}

// GSAP drives how the sheet comes out: the panel glides in with a soft
// overshoot, then each [data-sheet-item] cascades in from the left.
// Framer Motion still handles the exit and swipe-to-close.
function GsapEntrance({ children }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const body = ref.current;
    const panel = body?.parentElement;
    if (!panel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { overwrite: "auto" } })
        .fromTo(panel, { xPercent: -100 }, { xPercent: 0, duration: 0.55, ease: "expo.out", clearProps: "transform" })
        .fromTo(body.querySelectorAll("[data-sheet-item]"),
          { x: -28, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.045, clearProps: "transform,opacity" }, 0.12)
        .fromTo(body.querySelectorAll("[data-sheet-pop]"),
          { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(2)", clearProps: "transform,opacity" }, 0.25);
    }, body);
    return () => ctx.revert();
  }, []);
  return <div ref={ref} style={{ display: "flex", flexDirection: "column", flex: 1 }}>{children}</div>;
}
