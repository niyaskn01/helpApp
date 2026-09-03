import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import TaskMap from "@/components/TaskMap";
import { autocompleteLocation, placeDetails, reverseGeocode, searchLocation, submitTask } from "@/lib/tasks.functions";

export const Route = createFileRoute("/post")({
  head: () => ({
    meta: [
      { title: "Post a task — Need a Hand?" },
      {
        name: "description",
        content:
          "Tell us what you need, drop a pin on your exact location, and set a fair fee. Someone nearby can help.",
      },
      { property: "og:title", content: "Post a task — Need a Hand?" },
      {
        property: "og:description",
        content: "Describe your task, pin your location, set your fee. Posted in under a minute.",
      },
    ],
  }),
  component: PostTaskPage,
});

type Coords = { lat: number; lng: number };
type Step = "form" | "confirm" | "success";
type WhenNeeded = "asap" | "today" | "schedule";
type FormErrors = {
  name?: string;
  phone?: string;
  taskName?: string;
  description?: string;
  location?: string;
  fee?: string;
  helpers?: string;
  when?: string;
  schedule?: string;
};

const feePresets = [50, 100, 150, 250, 500];
const helperOptions = [1, 2, 3, 4] as const;
const whenOptions: { value: WhenNeeded; label: string; sub: string }[] = [
  { value: "asap", label: "ASAP", sub: "Within an hour" },
  { value: "today", label: "Today", sub: "Sometime today" },
  { value: "schedule", label: "Schedule", sub: "Pick a date & time" },
];

function whenLabel(w: WhenNeeded) {
  return w === "asap" ? "ASAP" : w === "today" ? "Today" : "Scheduled";
}

function PostTaskPage() {
  const navigate = useNavigate();
  const geocode = useServerFn(reverseGeocode);
  const searchPlaces = useServerFn(searchLocation);
  const post = useServerFn(submitTask);

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [fee, setFee] = useState("100");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [helpers, setHelpers] = useState<number>(1);
  const [whenNeeded, setWhenNeeded] = useState<WhenNeeded>("asap");
  const [scheduledFor, setScheduledFor] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<
    { formattedAddress: string; latitude: number; longitude: number }[]
  >([]);
  const suggest = useServerFn(autocompleteLocation);
  const getPlace = useServerFn(placeDetails);
  const [suggestions, setSuggestions] = useState<
    { placeId: string; primary: string; secondary: string; description: string }[]
  >([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const justPickedRef = useRef(false);

  useEffect(() => {
    const q = searchQuery.trim();
    if (justPickedRef.current) {
      justPickedRef.current = false;
      return;
    }
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void suggest({ data: { query: q } })
        .then((res) => {
          if (cancelled) return;
          setSuggestions(res.suggestions);
          setSuggestOpen(true);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, suggest]);

  async function pickSuggestion(s: { placeId: string; description: string }) {
    justPickedRef.current = true;
    setSuggestOpen(false);
    setSuggestions([]);
    setSearchQuery(s.description);
    setAddress("Finding address…");
    try {
      const res = await getPlace({ data: { placeId: s.placeId } });
      if (!res.place) {
        toast.error(res.error ?? "Could not load that place.");
        setAddress("");
        return;
      }
      pickResult(res.place);
    } catch {
      toast.error("Could not load that place.");
      setAddress("");
    }
  }

  async function resolveAddress(next: Coords) {
    setCoords(next);
    setAddress("Finding address…");
    const res = await geocode({ data: { latitude: next.lat, longitude: next.lng } });
    setAddress(res.formattedAddress || `${next.lat.toFixed(5)}, ${next.lng.toFixed(5)}`);
  }

  async function runSearch() {
    const q = searchQuery.trim();
    if (q.length < 3) {
      toast.error("Type at least 3 characters to search.");
      return;
    }
    setSearching(true);
    setSuggestOpen(false);
    try {
      // If suggestions are showing, jump straight to the top one.
      const top = suggestions[0];
      if (top) {
        await pickSuggestion(top);
        return;
      }
      const res = await searchPlaces({ data: { query: q } });
      if (res.results[0]) pickResult(res.results[0]);
      setSearchResults(res.results);
      if (!res.results.length) toast.error(res.error ?? "No places found.");
    } catch {
      toast.error("Could not search that place. Try again.");
    } finally {
      setSearching(false);
    }
  }

  function pickResult(r: { formattedAddress: string; latitude: number; longitude: number }) {
    justPickedRef.current = true;
    setCoords({ lat: r.latitude, lng: r.longitude });
    setAddress(r.formattedAddress);
    setSearchResults([]);
    setSuggestions([]);
    setSuggestOpen(false);
    setSearchQuery(r.formattedAddress);
    setErrors((prev) => {
      const { location: _omit, ...rest } = prev;
      return rest;
    });
  }

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      toast.error("Your browser doesn't support location access.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        void resolveAddress({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        toast.error("Location permission denied. Drop a pin on the map instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function validate() {
    const next: FormErrors = {};
    if (name.trim().length < 2) next.name = "Please enter your name";
    if (!/^[6-9]\d{9}$/.test(phone.trim())) next.phone = "Enter a valid 10-digit Indian mobile number";
    if (taskName.trim().length < 3) next.taskName = "Give your task a short name";
    if (description.trim().length < 10) next.description = "Add a few more details";
    if (!coords) next.location = "Select your task location";
    if (!Number(fee) || Number(fee) < 10) next.fee = "Enter a fee of ₹10 or more";
    if (whenNeeded === "schedule" && !scheduledFor) {
      next.schedule = "Pick a date and time";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handlePost() {
    if (!coords) return;
    setSubmitting(true);
    try {
      const res = await post({
        data: {
          customerName: name.trim(),
          contactNumber: phone.trim(),
          taskName: taskName.trim(),
          taskDescription: description.trim(),
          latitude: coords.lat,
          longitude: coords.lng,
          formattedAddress: address || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
          fee: Math.round(Number(fee)),
          helpersNeeded: helpers,
          whenNeeded,
          scheduledFor: whenNeeded === "schedule" ? scheduledFor : undefined,
        },
      });
      if (!res.ok) {
        toast.error(res.error ?? "Something went wrong. Please try again.");
        return;
      }
      setTaskId(res.taskId);
      setStep("success");
    } catch {
      toast.error("Could not post your task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setStep("form");
    setTaskName("");
    setDescription("");
    setFee("100");
    setTaskId("");
    setHelpers(1);
    setWhenNeeded("asap");
    setScheduledFor("");
    setErrors({});
  }

  if (step === "success") {
    return (
      <main className="hero-gradient min-h-screen">
        <div className="mx-auto max-w-lg px-5 pb-16 pt-12">
          <div className="surface-card rise-in p-6">
            <h1 className="text-2xl font-semibold">Task Posted Successfully 🎉</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your task has been shared with nearby helpers.</p>

            <div className="mt-6 space-y-3">
              <Row label="Task ID" value={taskId} />
              <Row label="Task" value={taskName} />
              <Row label="Helpers needed" value={helpers === 4 ? "4 or more" : String(helpers)} />
              <Row
                label="When"
                value={whenNeeded === "schedule" ? `Scheduled: ${scheduledFor}` : whenLabel(whenNeeded)}
              />
              <Row label="Fee" value={`₹${Math.round(Number(fee))} per helper`} />
              <Row label="Location" value={address} />
              <Row label="Status" value="Looking for a helper" />
            </div>

            <button
              onClick={() => navigate({ to: "/track", search: { taskId } })}
              className="mt-7 h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-[var(--shadow-float)] transition-transform active:scale-[0.98]"
            >
              Track My Task
            </button>
            <button
              onClick={resetForm}
              className="mt-3 h-13 w-full rounded-2xl border border-border py-3.5 text-base font-semibold text-foreground"
            >
              Post Another Task
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="hero-gradient min-h-screen">
      <div className="mx-auto max-w-lg px-5 pb-16 pt-8">
        <Link to="/" className="text-sm font-semibold text-primary">
          ← Need a Hand?
        </Link>
        <h1 className="mt-6 text-3xl font-semibold">Post a task</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tell us what you need and where. Someone nearby can help.</p>

        {step === "form" ? (
          <div className="surface-card rise-in mt-7 space-y-6 p-5">
            <Field label="Your name" error={errors.name}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Niyas"
                maxLength={80}
                className={inputClass}
              />
            </Field>

            <Field
              label="Contact number"
              hint="We'll share this number only with the helper who contacts you about this task."
              error={errors.phone}
            >
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 focus-within:ring-2 focus-within:ring-ring">
                <span className="text-base font-semibold text-muted-foreground">+91</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  inputMode="numeric"
                  placeholder="9876543210"
                  className="h-14 flex-1 bg-transparent text-base outline-none"
                />
              </div>
            </Field>

            <Field label="Task name" error={errors.taskName}>
              <input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Petrol ran out"
                maxLength={100}
                className={inputClass}
              />
            </Field>

            <Field label="Task description" error={errors.description}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you need help with..."
                rows={4}
                maxLength={1000}
                className="w-full rounded-2xl bg-muted p-4 text-base outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>

            <Field label="How many helpers do you need?" error={errors.helpers}>
              <div className="grid grid-cols-4 gap-2">
                {helperOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setHelpers(opt)}
                    className={`h-14 rounded-2xl text-base font-bold transition-colors ${
                      helpers === opt
                        ? "bg-primary text-primary-foreground shadow-[var(--shadow-float)]"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {opt === 4 ? "4+" : String(opt)}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {helpers === 4
                  ? "4 or more helpers will be assigned"
                  : `${helpers} helper${helpers > 1 ? "s" : ""} will be assigned`}
              </p>
            </Field>

            <Field label="When do you need help?" error={errors.when}>
              <div className="grid grid-cols-3 gap-2">
                {whenOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setWhenNeeded(opt.value)}
                    className={`flex h-16 flex-col items-center justify-center rounded-2xl transition-colors ${
                      whenNeeded === opt.value
                        ? "bg-primary text-primary-foreground shadow-[var(--shadow-float)]"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <span className="text-sm font-bold">{opt.label}</span>
                    <span
                      className={`mt-0.5 text-[10px] ${whenNeeded === opt.value ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                    >
                      {opt.sub}
                    </span>
                  </button>
                ))}
              </div>
              {whenNeeded === "schedule" && (
                <div className="mt-3">
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="h-14 w-full rounded-2xl bg-muted px-4 text-base outline-none focus:ring-2 focus:ring-ring [color-scheme:light]"
                  />
                  {errors.schedule && <p className="mt-2 text-xs font-medium text-destructive">{errors.schedule}</p>}
                </div>
              )}
            </Field>

            <Field label="Task location" error={errors.location}>
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setSuggestOpen(true)}
                    onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void runSearch();
                      }
                      if (e.key === "Escape") setSuggestOpen(false);
                    }}
                    placeholder="Search a place or landmark"
                    maxLength={200}
                    autoComplete="off"
                    className="h-12 flex-1 rounded-2xl bg-muted px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => void runSearch()}
                    disabled={searching}
                    className="h-12 shrink-0 rounded-2xl bg-secondary px-4 text-sm font-semibold text-secondary-foreground disabled:opacity-60"
                  >
                    {searching ? "Searching…" : "Search"}
                  </button>
                </div>
                {suggestOpen && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-14 z-30 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-float)]">
                    {suggestions.map((s) => (
                      <button
                        key={s.placeId}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => void pickSuggestion(s)}
                        className="block w-full border-b border-border px-4 py-3 text-left last:border-0 hover:bg-muted"
                      >
                        <span className="block text-sm font-semibold">{s.primary}</span>
                        {s.secondary && <span className="block text-xs text-muted-foreground">{s.secondary}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 overflow-hidden rounded-2xl border border-border">
                  {searchResults.map((r) => (
                    <button
                      key={r.formattedAddress}
                      type="button"
                      onClick={() => pickResult(r)}
                      className="block w-full border-b border-border px-4 py-3 text-left text-sm last:border-0 hover:bg-muted"
                    >
                      {r.formattedAddress}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={locating}
                  className="h-12 flex-1 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {locating ? "Locating…" : "Use current location"}
                </button>
                <span className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-border text-sm font-semibold text-muted-foreground">
                  Or tap the map
                </span>
              </div>
              <div className="mt-3">
                <TaskMap value={coords} onChange={(c) => void resolveAddress(c)} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {coords ? address || "Finding address…" : "Tap or drag the pin to set your exact location."}
              </p>
            </Field>

            <Field
              label="How much are you offering?"
              hint="Set an amount per helper. If nobody accepts, you can increase the offer later."
              error={errors.fee}
            >
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 focus-within:ring-2 focus-within:ring-ring">
                <span className="text-lg font-semibold">₹</span>
                <input
                  value={fee}
                  onChange={(e) => setFee(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  className="h-14 flex-1 bg-transparent text-base outline-none"
                />
                <span className="whitespace-nowrap text-sm font-semibold text-muted-foreground">per helper</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {feePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFee(String(preset))}
                    className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
                      Number(fee) === preset
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Total: ₹{Math.round(Number(fee) * helpers)} for {helpers === 4 ? "4+" : helpers} helper
                {helpers > 1 ? "s" : ""}
              </p>
            </Field>

            <button
              type="button"
              onClick={() => {
                if (validate()) setStep("confirm");
                else toast.error("Please check the highlighted fields.");
              }}
              className="h-14 w-full rounded-2xl bg-primary text-base font-semibold tracking-wide text-primary-foreground shadow-[var(--shadow-float)] transition-transform active:scale-[0.98]"
            >
              POST TASK
            </button>
          </div>
        ) : (
          <div className="surface-card rise-in mt-7 p-6">
            <h2 className="text-lg font-semibold">Confirm your task</h2>
            <div className="mt-5 space-y-3">
              <Row label="Task" value={taskName} />
              <Row label="Helpers" value={helpers === 4 ? "4 or more" : String(helpers)} />
              <Row
                label="When"
                value={whenNeeded === "schedule" ? `Scheduled: ${scheduledFor}` : whenLabel(whenNeeded)}
              />
              <Row label="Location" value={address} />
              <Row label="Fee" value={`₹${Math.round(Number(fee))} per helper`} />
              <Row label="Total" value={`₹${Math.round(Number(fee) * helpers)}`} />
              <Row label="Contact" value={`+91 ${phone}`} />
            </div>

            <button
              onClick={() => void handlePost()}
              disabled={submitting}
              className="mt-7 h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-[var(--shadow-float)] disabled:opacity-70"
            >
              {submitting ? "Posting…" : "Post Task"}
            </button>
            <button
              onClick={() => setStep("form")}
              disabled={submitting}
              className="mt-3 h-13 w-full rounded-2xl border border-border py-3.5 text-base font-semibold"
            >
              Edit details
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

const inputClass = "h-14 w-full rounded-2xl bg-muted px-4 text-base outline-none focus:ring-2 focus:ring-ring";

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-foreground">{label}</label>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-2">{children}</div>
      {error && <p className="mt-2 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-semibold">{value}</span>
    </div>
  );
}
