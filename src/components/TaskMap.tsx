import { useEffect, useRef, useState } from "react";

type Coords = { lat: number; lng: number };

declare global {
  interface Window {
    google?: any;
    __initTaskMap__?: () => void;
    __taskMapLoading__?: Promise<void>;
  }
}

function loadMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (window.__taskMapLoading__) return window.__taskMapLoading__;

  const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
  const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"];

  window.__taskMapLoading__ = new Promise<void>((resolve, reject) => {
    if (!key) {
      reject(new Error("Maps key missing"));
      return;
    }
    window.__initTaskMap__ = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__initTaskMap__${
      channel ? `&channel=${channel}` : ""
    }`;
    script.async = true;
    script.onerror = () => reject(new Error("Maps failed to load"));
    document.head.appendChild(script);
  });

  return window.__taskMapLoading__;
}

export default function TaskMap({
  value,
  onChange,
}: {
  value: Coords | null;
  onChange: (coords: Coords) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [error, setError] = useState<string | null>(null);

  const [ready, setReady] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  function syncMarkerToValue(v: Coords | null) {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    if (v) {
      marker.setPosition(v);
      map.panTo(v);
      if (map.getZoom() < 15) map.setZoom(16);
      if (containerRef.current) {
        containerRef.current.dataset["markerLat"] = String(v.lat);
        containerRef.current.dataset["markerLng"] = String(v.lng);
      }
    }
  }

  useEffect(() => {
    let cancelled = false;

    loadMaps()
      .then(() => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const center = valueRef.current ?? { lat: 10.0159, lng: 76.3419 }; // Kakkanad, Kochi
        const map = new window.google.maps.Map(containerRef.current, {
          center,
          zoom: valueRef.current ? 16 : 13,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        });
        const marker = new window.google.maps.Marker({
          position: center,
          map,
          draggable: true,
        });
        marker.addListener("dragend", () => {
          const p = marker.getPosition();
          if (p) onChangeRef.current({ lat: p.lat(), lng: p.lng() });
        });
        map.addListener("click", (e: any) => {
          if (!e.latLng) return;
          marker.setPosition(e.latLng);
          onChangeRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });
        mapRef.current = map;
        markerRef.current = marker;
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError("Map could not be loaded. Try again in a moment.");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move the pin whenever the selected coords change — or once the map
  // finishes loading if coords were already set before it was ready.
  useEffect(() => {
    if (!ready) return;
    syncMarkerToValue(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, ready]);

  if (error) {
    return (
      <div className="flex h-56 items-center justify-center rounded-2xl bg-muted px-6 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-56 w-full overflow-hidden rounded-2xl bg-muted ring-1 ring-border"
      aria-label="Task location map"
    />
  );
}
