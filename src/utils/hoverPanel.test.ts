import { createHoverPanel } from "./hoverPanel";

describe("createHoverPanel", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const setup = (canClose?: () => boolean) => {
    const open = jest.fn();
    const close = jest.fn();
    const panel = createHoverPanel({ open, close, canClose });
    return { open, close, panel };
  };

  it("opens only after the pointer has rested on the trigger", () => {
    const { open, panel } = setup();
    panel.enterTrigger();
    jest.advanceTimersByTime(149);
    expect(open).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("does not open if the pointer leaves the trigger first", () => {
    const { open, panel } = setup();
    panel.enterTrigger();
    jest.advanceTimersByTime(100);
    panel.leaveTrigger();
    jest.advanceTimersByTime(500);
    expect(open).not.toHaveBeenCalled();
  });

  it("opens once even if the trigger is entered repeatedly", () => {
    const { open, panel } = setup();
    panel.enterTrigger();
    panel.enterTrigger();
    jest.advanceTimersByTime(500);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("closes a little after the pointer is outside", () => {
    const { close, panel } = setup();
    panel.outsidePanel();
    jest.advanceTimersByTime(249);
    expect(close).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("keeps the panel open when the pointer comes back in time", () => {
    const { close, panel } = setup();
    panel.outsidePanel();
    jest.advanceTimersByTime(200);
    panel.overPanel();
    jest.advanceTimersByTime(1000);
    expect(close).not.toHaveBeenCalled();
  });

  it("keeps the panel open when the pointer re-enters the trigger", () => {
    const { close, panel } = setup();
    panel.outsidePanel();
    jest.advanceTimersByTime(200);
    panel.enterTrigger();
    jest.advanceTimersByTime(1000);
    expect(close).not.toHaveBeenCalled();
  });

  it("repeated outside moves do not push the close back", () => {
    const { close, panel } = setup();
    panel.outsidePanel();
    jest.advanceTimersByTime(200);
    panel.outsidePanel();
    jest.advanceTimersByTime(50);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("does not close while canClose says no, and closes later if asked again", () => {
    let allowed = false;
    const { close, panel } = setup(() => allowed);
    panel.outsidePanel();
    jest.advanceTimersByTime(300);
    expect(close).not.toHaveBeenCalled();
    allowed = true;
    panel.outsidePanel();
    jest.advanceTimersByTime(250);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("cancel drops anything pending", () => {
    const { open, close, panel } = setup();
    panel.enterTrigger();
    panel.outsidePanel();
    panel.cancel();
    jest.advanceTimersByTime(1000);
    expect(open).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });

  it("can be used again after cancel", () => {
    const { open, panel } = setup();
    panel.enterTrigger();
    panel.cancel();
    panel.enterTrigger();
    jest.advanceTimersByTime(150);
    expect(open).toHaveBeenCalledTimes(1);
  });
});
