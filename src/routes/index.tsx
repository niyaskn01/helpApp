import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Need a Hand? — Post a small task, get local help" },
      {
        name: "description",
        content:
          "Out of petrol, need a pick & drop, or help moving something? Post a task and someone nearby can help — you set the fee.",
      },
      { property: "og:title", content: "Need a Hand? — Post a small task, get local help" },
      {
        property: "og:description",
        content: "Post a task. Someone nearby can help. You decide the fee.",
      },
    ],
  }),
  component: Landing,
});

const examples = [
  { icon: "⛽", label: "Emergency fuel help" },
  { icon: "📦", label: "Pick & drop" },
  { icon: "💪", label: "Loading & unloading" },
  { icon: "🛵", label: "Local errands" },
  { icon: "🪑", label: "Moving & carrying" },
  { icon: "🏪", label: "Business help" },
  { icon: "✨", label: "And more" },
];

function Landing() {
  return (
    <main className="hero-gradient min-h-screen">
      <div className="mx-auto flex max-w-lg flex-col px-5 pb-16 pt-10">
        <span className="text-sm font-semibold tracking-tight text-primary">Need a Hand?</span>

        <section className="rise-in mt-14">
          <h1 className="text-[2.75rem] leading-[1.05] font-semibold text-foreground">
            Need a hand?
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Post a task. Someone nearby can help.
          </p>

          <Link
            to="/post"
            className="mt-8 flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-[var(--shadow-float)] transition-transform active:scale-[0.98]"
          >
            Post a Task
          </Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Takes under a minute. No account needed.
          </p>
        </section>

        <section className="surface-card rise-in mt-12 p-6">
          <h2 className="text-lg font-semibold">What can you ask for?</h2>
          <ul className="mt-4 grid gap-2">
            {examples.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3 text-sm font-medium text-foreground"
              >
                <span aria-hidden className="text-lg">
                  {item.icon}
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 grid gap-3">
          {[
            { n: "1", t: "Describe the task", d: "What you need and where you are." },
            { n: "2", t: "Set your fee", d: "You decide what feels fair." },
            { n: "3", t: "Get help nearby", d: "Someone close by picks it up." },
          ].map((step) => (
            <div key={step.n} className="flex gap-4 rounded-2xl border border-border bg-card/60 p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                {step.n}
              </span>
              <div>
                <p className="font-semibold">{step.t}</p>
                <p className="text-sm text-muted-foreground">{step.d}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
