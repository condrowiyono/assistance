import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModalStore, type ModalSize } from "@/store/useModalStore";

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
};

export function ModalHost() {
  const modal = useModalStore((s) => s.modal);
  const close = useModalStore((s) => s.close);

  const dismissible = modal?.dismissible ?? true;

  return (
    <Dialog
      open={!!modal}
      onOpenChange={(open) => {
        if (!open && modal && dismissible) close(modal.id);
      }}
    >
      <DialogContent
        showCloseButton={dismissible}
        className={SIZE_CLASS[modal?.size ?? "md"]}
        onEscapeKeyDown={(e) => {
          if (!dismissible) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (!dismissible) e.preventDefault();
        }}
      >
        {(modal?.title || modal?.description) && (
          <DialogHeader>
            {modal?.title && <DialogTitle>{modal.title}</DialogTitle>}
            {modal?.description && <DialogDescription>{modal.description}</DialogDescription>}
          </DialogHeader>
        )}
        {modal?.content}
      </DialogContent>
    </Dialog>
  );
}
