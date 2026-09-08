import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "HELPBE Terms & Conditions" },
      {
        name: "description",
        content:
          "The terms that govern the use of HELPBE for customers and Helpers.",
      },
      { property: "og:title", content: "HELPBE Terms & Conditions" },
      {
        property: "og:description",
        content: "The terms that govern the use of HELPBE.",
      },
    ],
  }),
  component: Terms,
});

const sections = [
  {
    title: "Using HELPBE",
    body: "HELPBE is a platform that connects people who need help with small, everyday tasks (\"Customers\") with people nearby who are willing to help (\"Helpers\"). By using HELPBE, you agree to these terms. You must provide accurate information when posting or responding to a task.",
  },
  {
    title: "Customers",
    body: "Customers are responsible for describing tasks clearly and honestly, being available at the agreed location and time, and paying the fee they offered. Do not post tasks that are illegal, dangerous, or misleading.",
  },
  {
    title: "Helpers",
    body: "Helpers choose which tasks to accept and are responsible for completing them as described. HELPBE is not an employer; Helpers act independently and are free to choose when and what they help with.",
  },
  {
    title: "Tasks",
    body: "Tasks must be lawful, reasonable, and safe. HELPBE may remove tasks that violate these terms or are reported as inappropriate.",
  },
  {
    title: "Payments",
    body: "The fee shown on a task is agreed between the Customer and the Helper. Unless stated otherwise, payments are arranged directly between them. HELPBE does not currently process or hold payments.",
  },
  {
    title: "Cancellations",
    body: "Either party may cancel a task before work begins. Please cancel as early as possible and let the other person know. Repeated last-minute cancellations may lead to account restrictions.",
  },
  {
    title: "User conduct",
    body: "Treat others with respect. Harassment, fraud, discrimination, or abusive behaviour of any kind is not allowed and may result in removal from the platform.",
  },
  {
    title: "Prohibited activities",
    body: "You may not use HELPBE for illegal activities, spam, scraping, impersonation, or to arrange services that require licensed professionals (such as medical, legal, or regulated transport services).",
  },
  {
    title: "Disputes",
    body: "HELPBE connects people but is not a party to the agreement between Customers and Helpers. If a disagreement arises, both parties should first try to resolve it directly. You may contact us for assistance, but final responsibility rests with the parties involved.",
  },
  {
    title: "Platform limitations",
    body: "HELPBE is provided \"as is\". We do not guarantee that a Helper will accept a task, or that a task will be completed to your satisfaction. To the extent permitted by law, HELPBE is not liable for loss or damage arising from tasks arranged through the platform.",
  },
  {
    title: "Contact",
    body: "Questions about these terms? Reach out through the Contact page.",
  },
];

function Terms() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 pb-16 pt-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Terms &amp; Conditions
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated: 2026
        </p>

        <div className="mt-10 grid gap-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-12 rounded-2xl border border-border bg-muted p-4 text-xs leading-relaxed text-muted-foreground">
          These terms are provided as an initial version for the HELPBE platform
          and should be reviewed with appropriate legal advice before full
          commercial launch.
        </p>
      </div>
    </main>
  );
}

