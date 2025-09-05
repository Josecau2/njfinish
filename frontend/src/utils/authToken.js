// Centralized token installation helper
export function installTokenEverywhere(newToken) {
  try {
    // Remove stale copies first
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    // Write fresh token redundantly
    if (newToken) {
      localStorage.setItem('token', newToken);
      sessionStorage.setItem('token', newToken);
    }
  } catch {}
}

export function detoxAuthStorage() {
  try {
    const pickExp = (tok) => {
      if (!tok) return -1;
      try {
        const p = JSON.parse(atob(tok.split('.')[1] || ''));
        return Number(p.exp || 0);
      } catch { return -1; }
    };
    const ls = localStorage.getItem('token');
    const ss = sessionStorage.getItem('token');
    const winner = (pickExp(ls) >= pickExp(ss)) ? ls : ss;
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    if (winner && pickExp(winner) > Math.floor(Date.now()/1000)) {
      localStorage.setItem('token', winner);
      sessionStorage.setItem('token', winner);
    }
    // Clear redux-persist shards that might resurrect stale auth
    Object.keys(localStorage).forEach(k => { if (k.startsWith('persist:')) localStorage.removeItem(k); });
  } catch {}
}