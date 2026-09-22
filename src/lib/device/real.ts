/**
 * Real device client for the Skinergy hardware at 192.168.4.1.
 *
 * No firmware source or API docs were available — only "it's a device that
 * reads body temperature and returns it." So this probes a short list of
 * endpoint paths that are the most common patterns for simple ESP32/Arduino
 * sensor projects (a JSON endpoint, or a plain page with the number in it),
 * and extracts a temperature reading from whichever responds first.
 *
 * Once someone can actually reach the device (same Wi-Fi network), use
 * testDeviceConnection() from the Devices page — it returns the raw
 * response too, which is what's needed to replace the guesswork here with
 * the device's real response shape.
 */

// "/data" confirmed as the real endpoint; the rest stay as fallbacks in
// case the device also serves other pages.
const CANDIDATE_PATHS = ["/data", "/", "/temperature", "/temp", "/api/temperature", "/status"];
const FETCH_TIMEOUT_MS = 1500;

export interface DeviceProbeResult {
  reachable: boolean;
  path?: string;
  rawResponse?: string;
  contentType?: string;
  temperatureC?: number;
  error?: string;
}

function extractTemperature(text: string): number | null {
  // Try JSON first: common field names for a temperature reading.
  try {
    const json = JSON.parse(text);
    const candidates = [
      json.temperature,
      json.temp,
      json.temperatureC,
      json.body_temp,
      json.celsius,
      json.value,
    ];
    for (const c of candidates) {
      if (typeof c === "number" && c > 20 && c < 45) return c;
    }
  } catch {
    // Not JSON — fall through to plain text / HTML.
  }

  // Fall back to scanning the raw text for a plausible body-temperature
  // number (avoids matching unrelated numbers like IP octets or timestamps
  // by constraining to a physiologically plausible range).
  const matches = text.match(/\d{2}\.\d{1,2}/g);
  if (matches) {
    for (const m of matches) {
      const n = parseFloat(m);
      if (n > 20 && n < 45) return n;
    }
  }

  return null;
}

export async function testDeviceConnection(ipAddress: string): Promise<DeviceProbeResult> {
  for (const path of CANDIDATE_PATHS) {
    try {
      const res = await fetch(`http://${ipAddress}${path}`, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) continue;

      const contentType = res.headers.get("content-type") ?? undefined;
      const text = await res.text();
      const temperatureC = extractTemperature(text) ?? undefined;

      return {
        reachable: true,
        path,
        rawResponse: text.slice(0, 500),
        contentType,
        temperatureC,
      };
    } catch {
      continue;
    }
  }

  return {
    reachable: false,
    error: `Could not reach ${ipAddress} on any of the tried paths. Make sure this machine is connected to the device's Wi-Fi network.`,
  };
}

/**
 * Used by the scan flow: attempts a real reading, returns null if the
 * device can't be reached (caller falls back to mockDeviceReading).
 */
export async function fetchRealTemperature(ipAddress: string): Promise<number | null> {
  const result = await testDeviceConnection(ipAddress);
  return result.reachable ? result.temperatureC ?? null : null;
}
