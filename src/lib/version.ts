/**
 * Gestione versione applicazione
 * 
 * La versione segue il formato X.Y dove:
 * - X è il numero major (incrementa quando Y raggiunge 9)
 * - Y è il numero minor (incrementa ad ogni deploy, reset a 0 quando X incrementa)
 */

import versionData from '../../version.json';

export const APP_VERSION = versionData.version;
export const VERSION_LAST_UPDATED = versionData.lastUpdated;

/**
 * Incrementa la versione seguendo la logica:
 * - Se minor è 9, incrementa major e resetta minor a 0
 * - Altrimenti incrementa solo minor
 */
export function getNextVersion(currentVersion: string): string {
  const [major, minor] = currentVersion.split('.').map(Number);
  
  if (minor >= 9) {
    return `${major + 1}.0`;
  } else {
    return `${major}.${minor + 1}`;
  }
}
