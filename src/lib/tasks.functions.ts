import { createServerFn } from "@tanstack/react-start";
import {
  autocompleteQuerySchema,
  coordsSchema,
  locationQuerySchema,
  makeFallbackTaskId,
  placeIdSchema,
  taskSchema,
} from "./tasks.shared";

/**
 * ============================================================
 * GOOGLE MAPS CONFIG
 * ============================================================
 *
 * Use YOUR Google Maps Platform API key here through the
 * environment variable:
 *
 * GOOGLE_MAPS_API_KEY
 *
 * This key is used ONLY on the server for:
 * - Geocoding API
 * - Places API (New)
 *
 * Do NOT put this key directly in client-side React code.
 */

const GOOGLE_MAPS_API_KEY = process.env["GOOGLE_MAPS_API_KEY"];

/**
 * Google APIs
 */
const GEOCODING_URL =
  "https://maps.googleapis.com/maps/api/geocode/json";

const PLACES_AUTOCOMPLETE_URL =
  "https://places.googleapis.com/v1/places:autocomplete";

const PLACES_BASE_URL =
  "https://places.googleapis.com/v1/places";


/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function mapsNotConfigured() {
  return !GOOGLE_MAPS_API_KEY;
}

async function readGoogleError(res: Response): Promise<string> {
  try {
    const json = (await res.json()) as {
      error?: {
        message?: string;
        status?: string;
      };
      status?: string;
      error_message?: string;
    };

    return (
      json.error?.message ??
      json.error_message ??
      json.error?.status ??
      json.status ??
      `HTTP ${res.status}`
    );
  } catch {
    try {
      return await res.text();
    } catch {
      return `HTTP ${res.status}`;
    }
  }
}


/**
 * ============================================================
 * REVERSE GEOCODING
 * Coordinates -> readable address
 * ============================================================
 */

export const reverseGeocode = createServerFn({ method: "POST" })
  .validator((data: unknown) => coordsSchema.parse(data))
  .handler(async ({ data }) => {
    if (mapsNotConfigured()) {
      console.error("GOOGLE_MAPS_API_KEY is not configured");

      return {
        formattedAddress: "",
        error: "Maps are not configured",
      };
    }

    try {
      const url =
        `${GEOCODING_URL}` +
        `?latlng=${encodeURIComponent(`${data.latitude},${data.longitude}`)}` +
        `&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY!)}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const error = await readGoogleError(res);

        console.error(
          `Reverse geocode failed [${res.status}]: ${error}`,
        );

        return {
          formattedAddress: "",
          error: "Could not look up that address",
        };
      }

      const json = (await res.json()) as {
        status?: string;
        error_message?: string;
        results?: Array<{
          formatted_address?: string;
        }>;
      };

      if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
        console.error(
          `Reverse geocode Google error: ${
            json.error_message ?? json.status ?? "Unknown error"
          }`,
        );

        return {
          formattedAddress: "",
          error: "Could not look up that address",
        };
      }

      const formattedAddress =
        json.results?.[0]?.formatted_address ?? "";

      return {
        formattedAddress,
        error: formattedAddress
          ? null
          : ("Could not find an address for this location" as string | null),
      };
    } catch (error) {
      console.error("Reverse geocode request failed:", error);

      return {
        formattedAddress: "",
        error: "Could not look up that address",
      };
    }
  });


/**
 * ============================================================
 * LOCATION SEARCH
 * Address/text -> coordinates
 *
 * This uses Google's Geocoding API.
 * ============================================================
 */

export const searchLocation = createServerFn({ method: "POST" })
  .validator((data: unknown) => locationQuerySchema.parse(data))
  .handler(async ({ data }) => {
    if (mapsNotConfigured()) {
      console.error("GOOGLE_MAPS_API_KEY is not configured");

      return {
        results: [],
        error: "Maps are not configured",
      };
    }

    try {
      const url =
        `${GEOCODING_URL}` +
        `?address=${encodeURIComponent(data.query)}` +
        `&region=in` +
        `&components=country:IN` +
        `&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY!)}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const error = await readGoogleError(res);

        console.error(
          `Location search failed [${res.status}]: ${error}`,
        );

        return {
          results: [],
          error: "Could not search that place",
        };
      }

      const json = (await res.json()) as {
        status?: string;
        error_message?: string;
        results?: Array<{
          formatted_address?: string;
          geometry?: {
            location?: {
              lat?: number;
              lng?: number;
            };
          };
        }>;
      };

      if (json.status !== "OK") {
        console.error(
          `Location search Google error: ${
            json.error_message ?? json.status ?? "Unknown error"
          }`,
        );

        return {
          results: [],
          error:
            json.status === "ZERO_RESULTS"
              ? "No places found"
              : "Could not search that place",
        };
      }

      const results = (json.results ?? [])
        .slice(0, 5)
        .map((r) => ({
          formattedAddress: r.formatted_address ?? "",
          latitude: r.geometry?.location?.lat ?? 0,
          longitude: r.geometry?.location?.lng ?? 0,
        }))
        .filter(
          (r) =>
            r.formattedAddress &&
            Number.isFinite(r.latitude) &&
            Number.isFinite(r.longitude) &&
            (r.latitude !== 0 || r.longitude !== 0),
        );

      return {
        results,
        error: results.length
          ? null
          : ("No places found" as string | null),
      };
    } catch (error) {
      console.error("Location search request failed:", error);

      return {
        results: [],
        error: "Could not search that place",
      };
    }
  });


/**
 * ============================================================
 * PLACES AUTOCOMPLETE (NEW)
 *
 * Search box typing -> suggestions
 *
 * Google endpoint:
 * https://places.googleapis.com/v1/places:autocomplete
 * ============================================================
 */

export const autocompleteLocation = createServerFn({ method: "POST" })
  .validator((data: unknown) => autocompleteQuerySchema.parse(data))
  .handler(async ({ data }) => {
    if (mapsNotConfigured()) {
      console.error("GOOGLE_MAPS_API_KEY is not configured");

      return {
        suggestions: [],
        error: "Maps are not configured" as string | null,
      };
    }

    try {
      const res = await fetch(PLACES_AUTOCOMPLETE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY!,
          "X-Goog-FieldMask":
            "suggestions.placePrediction.placeId," +
            "suggestions.placePrediction.text.text," +
            "suggestions.placePrediction.structuredFormat.mainText.text," +
            "suggestions.placePrediction.structuredFormat.secondaryText.text",
        },
        body: JSON.stringify({
          input: data.query,

          // Restrict suggestions to India
          includedRegionCodes: ["in"],
        }),
      });

      if (!res.ok) {
        const error = await readGoogleError(res);

        console.error(
          `Autocomplete failed [${res.status}]: ${error}`,
        );

        return {
          suggestions: [],
          error: "Could not fetch suggestions" as string | null,
        };
      }

      const json = (await res.json()) as {
        suggestions?: Array<{
          placePrediction?: {
            placeId?: string;

            text?: {
              text?: string;
            };

            structuredFormat?: {
              mainText?: {
                text?: string;
              };

              secondaryText?: {
                text?: string;
              };
            };
          };
        }>;
      };

      const suggestions = (json.suggestions ?? [])
        .map((s) => s.placePrediction)
        .filter(
          (
            p,
          ): p is NonNullable<typeof p> =>
            Boolean(p?.placeId),
        )
        .slice(0, 6)
        .map((p) => ({
          placeId: p.placeId as string,

          primary:
            p.structuredFormat?.mainText?.text ??
            p.text?.text ??
            "",

          secondary:
            p.structuredFormat?.secondaryText?.text ??
            "",

          description:
            p.text?.text ??
            "",
        }))
        .filter((p) => p.primary || p.description);

      return {
        suggestions,
        error: null as string | null,
      };
    } catch (error) {
      console.error(
        "Autocomplete request failed:",
        error,
      );

      return {
        suggestions: [],
        error: "Could not fetch suggestions" as string | null,
      };
    }
  });


/**
 * ============================================================
 * PLACE DETAILS (NEW)
 *
 * Place ID -> exact latitude/longitude/address
 *
 * Google endpoint:
 * https://places.googleapis.com/v1/places/{PLACE_ID}
 * ============================================================
 */

export const placeDetails = createServerFn({ method: "POST" })
  .validator((data: unknown) => placeIdSchema.parse(data))
  .handler(async ({ data }) => {
    if (mapsNotConfigured()) {
      console.error("GOOGLE_MAPS_API_KEY is not configured");

      return {
        place: null,
        error: "Maps are not configured" as string | null,
      };
    }

    try {
      const url =
        `${PLACES_BASE_URL}/${encodeURIComponent(data.placeId)}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",

          "X-Goog-Api-Key":
            GOOGLE_MAPS_API_KEY!,

          "X-Goog-FieldMask":
            "location,formattedAddress,displayName",
        },
      });

      if (!res.ok) {
        const error = await readGoogleError(res);

        console.error(
          `Place details failed [${res.status}]: ${error}`,
        );

        return {
          place: null,
          error: "Could not load that place" as string | null,
        };
      }

      const json = (await res.json()) as {
        formattedAddress?: string;

        displayName?: {
          text?: string;
        };

        location?: {
          latitude?: number;
          longitude?: number;
        };
      };

      const latitude = json.location?.latitude;
      const longitude = json.location?.longitude;

      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number"
      ) {
        console.error(
          "Place details returned no valid coordinates",
        );

        return {
          place: null,
          error:
            "Could not load that place" as string | null,
        };
      }

      return {
        place: {
          formattedAddress:
            json.formattedAddress ??
            json.displayName?.text ??
            "",

          latitude,
          longitude,
        },

        error: null as string | null,
      };
    } catch (error) {
      console.error(
        "Place details request failed:",
        error,
      );

      return {
        place: null,
        error:
          "Could not load that place" as string | null,
      };
    }
  });


/**
 * ============================================================
 * SUBMIT TASK
 *
 * This part is kept essentially the same because it is already
 * working with your Google Sheets webhook.
 * ============================================================
 */

export const submitTask = createServerFn({ method: "POST" })
  .validator((data: unknown) => taskSchema.parse(data))
  .handler(async ({ data }) => {
    const webhookUrl =
      process.env["GOOGLE_SHEETS_WEBHOOK_URL"];

    const payload = {
      taskId: makeFallbackTaskId(),
      requestId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),

      ...data,

      status: "Looking for a helper",
    };

    if (!webhookUrl) {
      console.error(
        "GOOGLE_SHEETS_WEBHOOK_URL is not configured",
      );

      return {
        ok: false as const,
        taskId: payload.taskId,
        error:
          "Task storage is not configured yet.",
      };
    }

    /**
     * Send fields in query parameters as well as JSON body.
     *
     * This maintains compatibility with the Apps Script
     * versions you have been using.
     */
    const target = new URL(webhookUrl);

    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined) {
        target.searchParams.set(
          key,
          String(value),
        );
      }
    }

    /**
     * Apps Script may respond through a redirect.
     * text/plain avoids a browser preflight and allows
     * the JSON body to reach the script.
     */
    const res = await fetch(
      target.toString(),
      {
        method: "POST",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8",
        },

        body: JSON.stringify(payload),

        redirect: "follow",
      },
    );

    const text = await res.text();

    if (!res.ok) {
      console.error(
        `Sheets webhook failed [${res.status}]: ${text}`,
      );

      return {
        ok: false as const,
        taskId: payload.taskId,
        error:
          "Could not save your task. Please try again.",
      };
    }

    let taskId = payload.taskId;

    try {
      const parsed = JSON.parse(text) as {
        success?: boolean;
        status?: string;
        taskId?: string;
        requestId?: string;
        error?: string;
        message?: string;
      };

      if (parsed.taskId) {
        taskId = parsed.taskId;
      }

      const rejected =
        parsed.success === false ||
        (
          typeof parsed.status === "string" &&
          parsed.status.toLowerCase() === "error"
        );

      if (rejected) {
        console.error(
          `Sheets webhook rejected task: ${
            parsed.error ??
            parsed.message ??
            "unknown error"
          }`,
        );

        return {
          ok: false as const,
          taskId,
          error:
            "Could not save your task. Please try again.",
        };
      }

      const appendConfirmed =
        parsed.success === true &&
        typeof parsed.taskId === "string" &&
        /^TASK-\d{6}$/.test(parsed.taskId) &&
        parsed.requestId === payload.requestId;

      if (!appendConfirmed) {
        console.error(
          `Sheets webhook did not confirm append [${res.status}]: ${text.slice(
            0,
            300,
          )}`,
        );

        return {
          ok: false as const,
          taskId: payload.taskId,
          error:
            "The sheet did not confirm that your task was saved. Please update the Apps Script deployment.",
        };
      }
    } catch {
      console.error(
        `Sheets webhook returned non-JSON: ${text.slice(
          0,
          300,
        )}`,
      );

      return {
        ok: false as const,
        taskId: payload.taskId,
        error:
          "Could not save your task. Please try again.",
      };
    }

    return {
      ok: true as const,
      taskId,
      error: null as string | null,
    };
  });