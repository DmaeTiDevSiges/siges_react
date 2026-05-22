/**
 * updateAppVersionReminder.ts
 *
 * Manages update attempt tracking using localStorage.
 * After 3 optional dismissals the 4th prompt becomes mandatory (unclosable).
 */

const ATTEMPT_COUNT_KEY = 'siges_update_attempt_count';
const LAST_VERSION_KEY  = 'siges_update_last_remote_version';

/**
 * Return the number of times the user has dismissed the update reminder.
 */
export const getUpdateAttemptCount = (): number => {
  const val = localStorage.getItem(ATTEMPT_COUNT_KEY);
  return val ? parseInt(val, 10) : 0;
};

/**
 * Record one more dismissal and store the remote version that was dismissed.
 */
export const recordUpdateAttempt = (remoteVersion: string): void => {
  const current = getUpdateAttemptCount();
  localStorage.setItem(ATTEMPT_COUNT_KEY, String(current + 1));
  localStorage.setItem(LAST_VERSION_KEY, remoteVersion);
};

/**
 * Reset counters after a successful update (app reloaded with the new version).
 */
export const resetUpdateAttempts = (): void => {
  localStorage.removeItem(ATTEMPT_COUNT_KEY);
  localStorage.removeItem(LAST_VERSION_KEY);
};

/**
 * Returns the remote version that was last dismissed, or null.
 */
export const getLastDismissedVersion = (): string | null => {
  return localStorage.getItem(LAST_VERSION_KEY);
};

/**
 * Should the update modal be shown right now?
 *
 * Returns `{ show: true, mandatory: boolean }` when an update is pending.
 * - mandatory = false → first 3 dismissals (shows "Depois" button)
 * - mandatory = true  → 4th+ encounter (no "Depois", cannot close)
 */
export const getUpdateModalState = (
  remoteVersion: string,
  localVersion: string,
): { show: boolean; mandatory: boolean } => {
  const remote = remoteVersion?.trim() || '';
  const local = localVersion?.trim() || '';

  // Check if they are numeric (like timestamps used in __BUILD_ID__)
  const remoteNum = Number(remote);
  const localNum = Number(local);
  const isNumeric = !isNaN(remoteNum) && !isNaN(localNum) && remote !== '' && local !== '';

  if (!remote || remote === local || (isNumeric && remoteNum <= localNum)) {
    // Versions match, or local is newer — reset counters if there was a pending update
    if (getLastDismissedVersion()) resetUpdateAttempts();
    return { show: false, mandatory: false };
  }

  const lastDismissed = getLastDismissedVersion();
  // If we have a new remote version that we haven't dismissed yet, reset the attempts!
  if (lastDismissed && lastDismissed !== remote) {
    resetUpdateAttempts();
  }

  const attempts = getUpdateAttemptCount();
  return { show: true, mandatory: attempts >= 3 };
};
