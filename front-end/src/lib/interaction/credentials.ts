const lsKey = '__yourcasino.credentials';
const _cache: { credentials: string | null } = {
  credentials: localStorage.getItem(lsKey) ?? null,
};

export function updateCredentials(credentials: string | null) {
  if (credentials) {
    localStorage.setItem(lsKey, credentials);
  } else {
    localStorage.removeItem(lsKey);
  }

  _cache.credentials = credentials;
}

export function getCredentials(): string | null {
  return _cache.credentials;
}
