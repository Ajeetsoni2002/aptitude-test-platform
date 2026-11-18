// backend/src/utils/keepAlive.ts
// ─────────────────────────────────────────────────────────────
// Self keep-alive: Render free tier 15 min idle ke baad server sula deta hai.
// Server har 5 min apne PUBLIC URL ka /health ping karta hai — request Render ke
// proxy se aati hai, isliye idle timer reset hota rehta hai aur server jaagta rehta hai.
//
// URL: KEEP_ALIVE_URL (agar set ho) warna RENDER_EXTERNAL_URL (Render khud set karta hai).
// Koi URL na mile (local dev) to kuch nahi hota. KEEP_ALIVE_DISABLED=true se band kar sakte ho.
// ─────────────────────────────────────────────────────────────

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const TIMEOUT_MS = 30 * 1000;

export const startKeepAlive = (): NodeJS.Timeout | null => {
  if (process.env.KEEP_ALIVE_DISABLED === 'true') return null;

  const baseUrl = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL;
  if (!baseUrl) return null;

  const healthUrl = `${baseUrl.replace(/\/+$/, '')}/health`;

  const ping = async () => {
    try {
      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) console.warn(`⚠️  Keep-alive ping: HTTP ${res.status}`);
    } catch (error) {
      console.warn('⚠️  Keep-alive ping failed:', (error as Error).message);
    }
  };

  const timer = setInterval(ping, INTERVAL_MS);
  console.log(`💓 Keep-alive enabled: pinging ${healthUrl} every 5 min`);
  return timer;
};
