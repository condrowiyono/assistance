import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { useModalStore } from "@/store/useModalStore";

interface ConfirmModalActionsProps {
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModalActions({
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmModalActionsProps) {
  return (
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button variant={variant === "destructive" ? "destructive" : "default"} onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </DialogFooter>
  );
}

export interface ConfirmModalOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

export function confirmModal(opts: ConfirmModalOptions): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (result: boolean) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      resolve(result);
    };

    const id = useModalStore.getState().open({
      title: opts.title,
      description: opts.description,
      dismissible: true,
      content: (
        <ConfirmModalActions
          confirmLabel={opts.confirmLabel}
          cancelLabel={opts.cancelLabel}
          variant={opts.variant}
          onConfirm={() => {
            settle(true);
            useModalStore.getState().close(id);
          }}
          onCancel={() => {
            settle(false);
            useModalStore.getState().close(id);
          }}
        />
      ),
    });

    // Resolve `false` if the user dismisses via ESC / backdrop click / close button.
    const unsubscribe = useModalStore.subscribe((state) => {
      if (state.modal?.id !== id) settle(false);
    });
  });
}
