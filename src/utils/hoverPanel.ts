/**
 * Timing for a panel that opens when the pointer rests on its trigger and
 * closes shortly after the pointer leaves it. UI-framework free so the rules
 * can be tested on their own.
 *
 * - Opening waits `openDelay` so a pointer merely passing the trigger does not
 *   open it, and is cancelled if the pointer leaves the trigger first.
 * - Closing waits `closeDelay` so a pointer that briefly strays outside does
 *   not close it, and is cancelled if the pointer comes back.
 * - `canClose` lets the panel stay open while the person is using it.
 */
export interface HoverPanelOptions {
  open: () => void;
  close: () => void;
  canClose?: () => boolean;
  openDelay?: number;
  closeDelay?: number;
}

export function createHoverPanel({
  open,
  close,
  canClose = () => true,
  openDelay = 150,
  closeDelay = 250,
}: HoverPanelOptions) {
  let openTimer: ReturnType<typeof setTimeout> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;

  const clearOpen = () => {
    clearTimeout(openTimer);
    openTimer = undefined;
  };
  const clearClose = () => {
    clearTimeout(closeTimer);
    closeTimer = undefined;
  };

  return {
    /** Pointer entered the trigger. */
    enterTrigger() {
      clearClose();
      if (openTimer === undefined) {
        openTimer = setTimeout(() => {
          openTimer = undefined;
          open();
        }, openDelay);
      }
    },
    /** Pointer left the trigger before the panel opened. */
    leaveTrigger() {
      clearOpen();
    },
    /** Pointer is over the open panel. */
    overPanel() {
      clearClose();
    },
    /** Pointer is somewhere else while the panel is open. */
    outsidePanel() {
      if (closeTimer === undefined) {
        closeTimer = setTimeout(() => {
          closeTimer = undefined;
          if (canClose()) close();
        }, closeDelay);
      }
    },
    /** Drop anything pending (unmount, or the feature was switched off). */
    cancel() {
      clearOpen();
      clearClose();
    },
  };
}
