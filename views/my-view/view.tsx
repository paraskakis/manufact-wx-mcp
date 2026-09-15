import { ModelContext, ThemeProvider, useToolContext } from "mcp-use/react";
import "./view.css";

type Quantity = { value: number | null; unit: string };
type Weather = { stationId: string; stationName: string; timestamp: string; textDescription: string; temperature: Quantity; dewpoint: Quantity; windDirection: Quantity; windSpeed: Quantity; windGust: Quantity; visibility: Quantity; relativeHumidity: Quantity; barometricPressure: Quantity; rawMessage: string };
const display = (q: Quantity, digits = 0) => q.value === null ? "—" : `${q.value.toFixed(digits)} ${q.unit.replace(/^wmoUnit:/, "")}`;
const labelUnit = (unit: string) => unit.includes("degC") ? "°C" : unit.includes("degF") ? "°F" : unit.includes("km_h-1") ? "km/h" : unit.includes("m_s-1") ? "m/s" : unit.includes("percent") ? "%" : unit.includes("m") ? "m" : unit.replace(/^wmoUnit:/, "");
const short = (q: Quantity, digits = 0) => q.value === null ? "—" : `${q.value.toFixed(digits)} ${labelUnit(q.unit)}`;
export default function AirportWeather() {
  const view = useToolContext<"get-airport-weather">();
  if (view.status === "pending") return <ThemeProvider><main className="card loading"><div className="eyebrow">NATIONAL WEATHER SERVICE</div><div className="skeleton title" /><div className="skeleton temp" /><div className="skeleton line" /><div className="skeleton grid" /></main></ThemeProvider>;
  if (view.status === "error") return <ThemeProvider><main className="card error"><div className="eyebrow">AIRPORT WEATHER</div><h1>Unable to load conditions</h1><p>{view.error.message}</p></main></ThemeProvider>;
  const data = view.toolOutput as Weather;
  const observed = data.timestamp ? new Date(data.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Time unavailable";
  return <ThemeProvider><main className="card"><ModelContext content={`Current weather at ${data.stationName} (${data.stationId}): ${data.textDescription}, temperature ${short(data.temperature)}.`} /><header><div><div className="eyebrow">NATIONAL WEATHER SERVICE</div><h1>{data.stationName}</h1><div className="station">{data.stationId} · Observed {observed}</div></div><div className="badge">LIVE</div></header><section className="hero"><div className="temp">{short(data.temperature, 1)}</div><div className="conditions">{data.textDescription}</div></section><dl className="metrics"><div><dt>Wind</dt><dd>{short(data.windSpeed)}{data.windDirection.value !== null ? ` · ${data.windDirection.value}°` : ""}</dd></div><div><dt>Gusts</dt><dd>{short(data.windGust)}</dd></div><div><dt>Visibility</dt><dd>{short(data.visibility)}</dd></div><div><dt>Humidity</dt><dd>{short(data.relativeHumidity, 0)}</dd></div><div><dt>Dew point</dt><dd>{short(data.dewpoint, 1)}</dd></div><div><dt>Pressure</dt><dd>{short(data.barometricPressure)}</dd></div></dl>{data.rawMessage && <footer>{data.rawMessage}</footer>}</main></ThemeProvider>;
}
