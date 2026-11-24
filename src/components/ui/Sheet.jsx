// shadcn/ui-style Sheet: we own the code, Radix Dialog supplies focus trap,
// Esc-to-close, scroll lock and ARIA. Styling lives in sheet.css tokens.
import * as Dialog from "@radix-ui/react-dialog";
import "./sheet.css";

export const Sheet = Dialog.Root;
export const SheetClose = Dialog.Close;

export function SheetContent({ title, description, children, className = "", ...props }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="bs-sheet-overlay" />
      <Dialog.Content className={`bs-sheet ${className}`} {...props}>
        <Dialog.Title style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{title}</Dialog.Title>
        <Dialog.Description style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{description || title}</Dialog.Description>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
