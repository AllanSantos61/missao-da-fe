const APP_STORAGE_PREFIXES = [
  "missionFaith",
  "missaoDaFe",
  "missao-da-fe",
  "bible-api",
  "mf_"
];

const APP_STORAGE_KEYS = [
  "missionFaithUser",
  "missaoDaFeProgress",
  "missaoDaFeBibleJourney365",
  "missionFaithVisits",
  "missionFaithPublicResults",
  "missionFaithReminder"
];

export type ClientSyncDiagnostics = {
  source: "Banco" | "Local" | "Desconhecida";
  lastSyncAt: string | null;
  status: "ok" | "syncing" | "error" | "offline" | "unknown";
  localVersion: string;
  remoteVersion: string;
};

const DIAGNOSTICS_KEY = "missaoDaFeSyncDiagnostics";

function isAppStorageKey(key: string) {
  return APP_STORAGE_KEYS.includes(key) || APP_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export function saveSyncDiagnostics(diagnostics: ClientSyncDiagnostics) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DIAGNOSTICS_KEY, JSON.stringify(diagnostics));
  } catch {
    // Diagnostics are optional and should never affect the product.
  }
}

export function getSyncDiagnostics(): ClientSyncDiagnostics {
  if (typeof window === "undefined") {
    return {
      source: "Desconhecida",
      lastSyncAt: null,
      status: "unknown",
      localVersion: "indisponível",
      remoteVersion: "indisponível"
    };
  }

  try {
    const stored = window.localStorage.getItem(DIAGNOSTICS_KEY);
    if (stored) return JSON.parse(stored) as ClientSyncDiagnostics;
  } catch {
    // Fall through to default diagnostics.
  }

  return {
    source: "Desconhecida",
    lastSyncAt: null,
    status: navigator.onLine ? "unknown" : "offline",
    localVersion: "não calculada",
    remoteVersion: "não calculada"
  };
}

async function clearIndexedDB() {
  if (typeof indexedDB === "undefined") return;

  const databaseApi = indexedDB as IDBFactory & {
    databases?: () => Promise<Array<{ name?: string }>>;
  };

  if (!databaseApi.databases) return;
  const databases = await databaseApi.databases();
  await Promise.all(
    databases
      .map((database) => database.name)
      .filter((name): name is string => Boolean(name && isAppStorageKey(name)))
      .map(
        (name) =>
          new Promise<void>((resolve) => {
            const request = indexedDB.deleteDatabase(name);
            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
            request.onblocked = () => resolve();
          })
      )
  );
}

async function clearCaches() {
  if (typeof caches === "undefined") return;
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.filter(isAppStorageKey).map((cacheName) => caches.delete(cacheName)));
}

export async function clearMissionFaithLocalData() {
  if (typeof window === "undefined") return;

  const localKeys = Object.keys(window.localStorage).filter(isAppStorageKey);
  const sessionKeys = Object.keys(window.sessionStorage).filter(isAppStorageKey);
  for (const key of localKeys) window.localStorage.removeItem(key);
  for (const key of sessionKeys) window.sessionStorage.removeItem(key);

  await Promise.allSettled([clearIndexedDB(), clearCaches()]);
  saveSyncDiagnostics({
    source: "Desconhecida",
    lastSyncAt: null,
    status: "unknown",
    localVersion: "limpa",
    remoteVersion: "pendente"
  });
}
