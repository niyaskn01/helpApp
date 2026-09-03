import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>) => ({
    taskId: typeof search["taskId"] === "string" ? (search["taskId"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Track your task — Need a Hand?" },
      {
        name: "description",
        content: "Check the status of the task you posted and how nearby helpers respond.",
      },
      { property: "og:title", content: "Track your task — Need a Hand?" },
      { property: "og:description", content: "See the live status of your posted task." },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { taskId } = Route.useSearch();

  return (
    <main className="hero-gradient min-h-screen">
      <div className="mx-auto max-w-lg px-5 pb-16 pt-10">
        <Link to="/" className="text-sm font-semibold text-primary">
          ← Need a Hand?
        </Link>

        <div className="surface-card rise-in mt-8 p-6">
          <h1 className="text-2xl font-semibold">Track my task</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {taskId
              ? "Here's the latest status for your task."
              : "Open this page from your task confirmation to see its status."}
          </p>

          {taskId && (
            <div className="mt-6 space-y-3">
              <Row label="Task ID" value={taskId} />
              <Row label="Status" value="Looking for a helper" />
            </div>
          )}

          <p className="mt-6 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
            A helper nearby will call you on the number you provided. Keep your phone handy. If
            nobody accepts, you can post again with a higher fee.
          </p>

          <Link
            to="/post"
            className="mt-6 flex h-13 w-full items-center justify-center rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground"
          >
            Post another task
          </Link>
        </div>
      </div>
    </main>
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
