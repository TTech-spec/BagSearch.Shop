// shadcn/ui-style Sheet: we own the code, Radix Dialog supplies focus trap,
// Esc-to-close, scroll lock and ARIA. Motion (framer-motion) drives the animation.
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, MotionConfig, motion as Motion } from "framer-motion";
import { sheetList } from "./sheetMotion.js";
import { createContext, useContext } from "react";
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
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0.4, right: 0 }}
              onDragEnd={(_, i) => { if (i.offset.x < -80 || i.velocity.x < -500) document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); }}
            >
              <Dialog.Title style={srOnly}>{title}</Dialog.Title>
              <Dialog.Description style={srOnly}>{description || title}</Dialog.Description>
              <Motion.div variants={sheetList} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                {children}
              </Motion.div>
            </Motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      )}
    </AnimatePresence></MotionConfig>
  );
}
