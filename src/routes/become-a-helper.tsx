import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/become-a-helper")({
  head: () => ({
    meta: [
      { title: "Become a Helper with HELPBE" },
      {
        name: "description",  
        content:
          "Help someone nearby and earn along the way. Choose tasks that work for you on HELPBE.",
      },
      { property: "og:title", content: "Become a Helper with HELPBE" },
      {
        property: "og:description",
        content: "Help someone nearby and earn along the way.",
      },
    ],
  }),
  component: BecomeAHelper,
});

const points = [
  "Choose when you help",
  "Find nearby tasks",
  "Earn from your spare time",
];

function BecomeAHelper() {
  return (
    <main className="hero-gradient min-h-screen">
      <div className="mx-auto max-w-lg px-5 pb-16 pt-14">
        <h1 className="rise-in text-3xl font-semibold tracking-tight sm:text-4xl">
          Have Some Free Time?
        </h1>
        <p className="rise-in mt-4 text-lg text-muted-foreground">
          Help someone nearby and earn along the way.
        </p>

        <p className="rise-in mt-8 text-sm leading-relaxed text-foreground/80">
          HELPBE connects people who need a little help with people who are
          willing to help. Choose tasks that work for you, help someone nearby,
          and earn from your spare time.
        </p>

        <ul className="mt-8 grid gap-3">
          {points.map((point) => (
            <li
              key={point}
              className="rise-in flex items-center gap-3 rounded-2xl border border-border bg-card/60 px-4 py-3.5 text-sm font-medium text-foreground"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground">
                ✓
              </span>
              {point}
            </li>
          ))}
        </ul>

        <Link
          to="/post"
          className="mt-10 flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-[var(--shadow-float)] transition-transform active:scale-[0.98]"
        >
          Become a Helper
        </Link>
      </div>
    </main>
  );
}
