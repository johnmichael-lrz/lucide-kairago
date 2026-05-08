import("./WeatherApp.js")
  .then(async ({ fetchWeather }) => {
    const lineEl = document.getElementById("weatherLineMain");
    const timeEl = document.getElementById("bulletinTimePHT");
    if (lineEl) lineEl.textContent = "Fetching weather...";
    const result = await fetchWeather(14.5995, 120.9842);
    if (lineEl) lineEl.textContent = result.line;
    if (timeEl)
      timeEl.textContent = `${formatPHT(new Date())} - Philippine Standard Time`;
    // Apply same latest signal to all timeline blocks for now
    for (let i = 1; i <= 6; i++) {
      const badge = document.getElementById(`signalBadge${i}`);
      if (badge) applySignalBadge(badge, result.signal);
    }
  })
  .catch((err) => {
    const lineEl = document.getElementById("weatherLineMain");
    if (lineEl) lineEl.textContent = `Import/Run error: ${err.message}`;
  });
function formatPHT(date) {
  return (
    new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date) + " PHT"
  );
}
function applySignalBadge(el, signal) {
  const base =
    "inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold border";
  if (signal >= 3) {
    el.className = `${base} bg-red-500/20 text-red-300 border-red-400/50`;
    el.textContent = "SIGNAL 3";
  } else if (signal === 2) {
    el.className = `${base} bg-orange-500/20 text-orange-300 border-orange-400/50`;
    el.textContent = "SIGNAL 2";
  } else if (signal === 1) {
    el.className = `${base} bg-yellow-500/20 text-yellow-200 border-yellow-300/50`;
    el.textContent = "SIGNAL 1";
  } else {
    el.className = `${base} bg-white/10 text-text-muted border-white/20`;
    el.textContent = "NO SIGNAL";
  }
}
