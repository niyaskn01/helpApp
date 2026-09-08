import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How HELPBE Works" },
      {
        name: "description",
        content:
          "Post a task, find a nearby Helper, and get it done — here's how HELPBE works in three simple steps.",
      },
      { property: "og:title", content: "How HELPBE Works" },
      {
        property: "og:description",
        content: "Post a task, find a nearby Helper, and get it done.",
      },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  { n: "1", t: "Post a Task", d: "Tell us what you need and where you need it." },
  { n: "2", t: "Find a Helper", d: "A nearby Helper can choose to help." },
  { n: "3", t: "Get It Done", d: "Connect, complete the task, and you're done." },
];

function HowItWorks() {
  return (
    <main className="hero-gradient min-h-screen">
      <div className="mx-auto max-w-lg px-5 pb-16 pt-14">
        <h1 className="rise-in text-3xl font-semibold tracking-tight sm:text-4xl">
          How HELPBE Works 
        </h1>
        <p className="rise-in mt-4 text-lg text-muted-foreground">
          Need something done? Post a task, find a nearby Helper, and get it done.
        </p>

        <section className="mt-10 grid gap-3">
          {steps.map((step) => (
            <div
              key={step.n}
              className="rise-in flex gap-4 rounded-2xl border border-border bg-card/60 p-4"
            >
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

        <Link
          to="/post"
          className="mt-10 flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-[var(--shadow-float)] transition-transform active:scale-[0.98]"
        >
          Post a Task
        </Link>
      </div>
    </main>
  );
}
