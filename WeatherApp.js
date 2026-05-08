export function getWindSignal(windSpeed) {
  if (windSpeed > 118) return 3;
  if (windSpeed > 89) return 2;
  if (windSpeed > 62) return 1;
  return 0;
}
export async function fetchWeather(lat, lon) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m`,
  );
  if (!res.ok) throw new Error(`Weather API failed: ${res.status}`);
  const data = await res.json();
  const windSpeed = data?.hourly?.wind_speed_10m?.[0];
  if (windSpeed == null) throw new Error("Missing wind speed in API response");
  const signal = getWindSignal(windSpeed);
  const line =
    signal === 0
      ? `Wind: ${windSpeed} km/h - No signal`
      : `Wind: ${windSpeed} km/h - Signal ${signal}`;
  return { windSpeed, signal, line };
}
