// Runtime configuration. A `config.json` next to index.html switches the game
// into cloud mode; without it the game stores everything on the device.

export async function loadCloudConfig() {
  try {
    const res = await fetch('config.json', { cache: 'no-cache' });
    if (!res.ok) return null;
    const cfg = await res.json();
    if (!cfg || cfg.mode !== 'cloud' || !cfg.apiUrl) return null;
    return cfg;
  } catch {
    return null;
  }
}
