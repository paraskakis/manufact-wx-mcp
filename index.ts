import { MCPServer } from "mcp-use";
import { z } from "zod";

const server = new MCPServer({
  name: "airport-weather", title: "Airport Weather", version: "1.0.0",
  description: "Current weather conditions for US airports from the National Weather Service.",
  instructions: "Use get-airport-weather with a four-letter ICAO airport code such as KJFK or KLAX.",
  cors: { origin: "*" }, icons: [{ src: "icon.svg", mimeType: "image/svg+xml", sizes: ["512x512"] }],
});
const valueSchema = z.object({ value: z.number().nullable().describe("Numeric value in the supplied unit, or null when unavailable"), unit: z.string().describe("Unit code supplied by the NWS, or empty when unavailable") });
const airportWeatherOutputSchema = z.object({
  stationId: z.string().describe("Four-letter ICAO station identifier"), stationName: z.string().describe("Weather station name"), timestamp: z.string().describe("ISO observation timestamp"), textDescription: z.string().describe("Current weather description"),
  temperature: valueSchema.describe("Air temperature"), dewpoint: valueSchema.describe("Dew point"), windDirection: valueSchema.describe("Wind direction"), windSpeed: valueSchema.describe("Wind speed"), windGust: valueSchema.describe("Wind gust"), visibility: valueSchema.describe("Visibility"), relativeHumidity: valueSchema.describe("Relative humidity"), barometricPressure: valueSchema.describe("Barometric pressure"), rawMessage: z.string().describe("Raw METAR"),
});
type NwsValue = { value?: number | null; unitCode?: string | null };
const quantity = (input: NwsValue | null | undefined) => ({ value: typeof input?.value === "number" ? input.value : null, unit: input?.unitCode ?? "" });
export const getAirportWeather = server.tool({
  name: "get-airport-weather", title: "Get Airport Weather", description: "Get the latest observed weather at a US airport using its four-letter ICAO code.",
  inputSchema: z.object({ stationId: z.string().trim().regex(/^[A-Za-z]{4}$/, "Use a four-letter ICAO code, for example KJFK").describe("Four-letter ICAO airport code, such as KJFK, KLAX, or KSEA") }),
  outputSchema: airportWeatherOutputSchema,
  view: { name: "my-view", description: "Compact current airport weather card", prefersBorder: false, csp: { connectDomains: ["https://api.weather.gov"] } },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
}, async ({ stationId }) => {
  const id = stationId.toUpperCase();
  const response = await fetch(`https://api.weather.gov/stations/${id}/observations/latest`, { headers: { Accept: "application/geo+json, application/json", "User-Agent": "airport-weather-mcp-app (mcp-use)" } });
  if (!response.ok) return { isError: true, content: [{ type: "text", text: response.status === 404 ? `No NWS station was found for ${id}. Check the ICAO code.` : `The NWS returned ${response.status} for ${id}.` }] };
  const payload = await response.json() as { properties?: { stationId?: string; stationName?: string; timestamp?: string; textDescription?: string | null; temperature?: NwsValue | null; dewpoint?: NwsValue | null; windDirection?: NwsValue | null; windSpeed?: NwsValue | null; windGust?: NwsValue | null; visibility?: NwsValue | null; relativeHumidity?: NwsValue | null; barometricPressure?: NwsValue | null; rawMessage?: string | null } };
  // The NWS endpoint returns a GeoJSON Feature; observation fields are under `properties`.
  const o = payload.properties ?? {};
  const data = { stationId: o.stationId ?? id, stationName: o.stationName ?? id, timestamp: o.timestamp ?? "", textDescription: o.textDescription || "Current conditions", temperature: quantity(o.temperature), dewpoint: quantity(o.dewpoint), windDirection: quantity(o.windDirection), windSpeed: quantity(o.windSpeed), windGust: quantity(o.windGust), visibility: quantity(o.visibility), relativeHumidity: quantity(o.relativeHumidity), barometricPressure: quantity(o.barometricPressure), rawMessage: o.rawMessage ?? "" };
  return { content: [{ type: "text", text: `${data.stationName}: ${data.textDescription}` }], structuredContent: data };
});
export default server;
