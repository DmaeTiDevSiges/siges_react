type IdleDeadline = {
    didTimeout: boolean;
    timeRemaining: () => number;
};

type IdleCallbackWindow = Window & {
    requestIdleCallback?: (
        callback: (deadline: IdleDeadline) => void,
        options?: { timeout: number }
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
};

export function scheduleIdleTask(task: () => void): () => void {
    const idleWindow = window as IdleCallbackWindow;

    if (idleWindow.requestIdleCallback) {
        const handle = idleWindow.requestIdleCallback(() => task(), { timeout: 1000 });
        return () => idleWindow.cancelIdleCallback?.(handle);
    }

    const handle = window.setTimeout(task, 0);
    return () => window.clearTimeout(handle);
}
