import { createServerFn } from "@tanstack/react-start";
import { coordsSchema, makeFallbackTaskId, taskSchema } from "./tasks.shared";

// export const reverseGeocode = createServerFn({ method: "POST" })
//   .validator((data: unknown) => coordsSchema.parse(data))
//   .handler(async ({ data }) => {
//     const lovableKey = process.env["LOVABLE_API_KEY"];
//     const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
//     if (!lovableKey || !mapsKey) {
//       return { formattedAddress: "", error: "Maps not configured" };
//     }

//     const url = `https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json?latlng=${data.latitude},${data.longitude}`;
//     const res = await fetch(url, {
//       headers: {
//         Authorization: `Bearer ${lovableKey}`,
//         "X-Connection-Api-Key": mapsKey,
//       },
//     });

//     if (!res.ok) {
//       const body = await res.text();
//       console.error(`Reverse geocode failed [${res.status}]: ${body}`);
//       return { formattedAddress: "", error: "Could not look up that address" };
//     }

//     const json = (await res.json()) as {
//       results?: Array<{ formatted_address?: string }>;
//     };
//     return {
//       formattedAddress: json.results?.[0]?.formatted_address ?? "",
//       error: null as string | null,
//     };
//   });

//chatgpt code without lovable secret key
export const reverseGeocode = createServerFn({ method: "POST" })
  .validator((data: unknown) => coordsSchema.parse(data))
  .handler(async ({ data }) => {
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];

    if (!mapsKey) {
      return {
        formattedAddress: "",
        error: "Google Maps API key is not configured",
      };
    }

    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?latlng=${data.latitude},${data.longitude}` +
      `&key=${mapsKey}`;

    const res = await fetch(url);

    if (!res.ok) {
      const body = await res.text();
      console.error(`Reverse geocode failed [${res.status}]: ${body}`);

      return {
        formattedAddress: "",
        error: "Could not look up that address",
      };
    }

    const json = await res.json();

    if (json.status !== "OK" || !json.results?.length) {
      console.error("Google Geocoding error:", json.status, json.error_message);

      return {
        formattedAddress: "",
        error: "Could not find an address for this location",
      };
    }

    return {
      formattedAddress: json.results[0].formatted_address,
      error: null,
    };
  });

export const submitTask = createServerFn({ method: "POST" })
  .validator((data: unknown) => taskSchema.parse(data))
  .handler(async ({ data }) => {
    const webhookUrl = process.env["GOOGLE_SHEETS_WEBHOOK_URL"];
    const payload = {
      taskId: makeFallbackTaskId(),
      createdAt: new Date().toISOString(),
      ...data,
      status: "Looking for a helper",
    };

    if (!webhookUrl) {
      console.error("GOOGLE_SHEETS_WEBHOOK_URL is not configured");
      return { ok: false as const, taskId: payload.taskId, error: "Task storage is not configured yet." };
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`Sheets webhook failed [${res.status}]: ${text}`);
      return { ok: false as const, taskId: payload.taskId, error: "Could not save your task. Please try again." };
    }

    let taskId = payload.taskId;
    try {
      const parsed = JSON.parse(text) as { success?: boolean; taskId?: string; error?: string };
      if (parsed.taskId) taskId = parsed.taskId;
      if (parsed.success === false) {
        console.error(`Sheets webhook rejected task: ${parsed.error ?? "unknown error"}`);
        return { ok: false as const, taskId, error: "Could not save your task. Please try again." };
      }
    } catch {
      // Apps Script may return non-JSON; treat 2xx as success.
    }

    return { ok: true as const, taskId, error: null as string | null };
  });
