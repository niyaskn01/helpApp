import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "HELPBE Privacy Policy" },
      {
        name: "description",
        content:
          "How HELPBE collects and uses your information to connect people who need help with nearby Helpers.",
      },
      { property: "og:title", content: "HELPBE Privacy Policy" },
      {
        property: "og:description",
        content: "How HELPBE collects and uses your information.",
      },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 pb-16 pt-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: 2026</p>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">What we collect</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            When you use HELPBE, we may collect information such as:
          </p>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {[
              "Your name",
              "Your phone number",
              "Task information you provide",
              "Task location",
              "Location coordinates, when you choose to share your current location",
              "Contact or support information you send us",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-primary">•</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">How we use it</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            We use this information to:
          </p>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {[
              "Create and manage tasks",
              "Connect Customers and Helpers",
              "Provide location features",
              "Provide customer support",
              "Improve the platform",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-primary">•</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Sharing</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            We share task details with nearby Helpers so they can respond. We do
            not sell your personal information. We may share information if
            required by law.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Your choices</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You can choose not to share your precise location and drop a pin
            manually instead. To ask about or delete your information, contact us
            through the Contact page.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Contact</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Questions about this policy? Reach out through the Contact page.
          </p>
        </section>
      </div>
    </main>
  );
}
