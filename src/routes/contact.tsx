import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact HELPBE" },
      {
        name: "description",
        content:
          "Have a question or ran into a problem? Get in touch with the HELPBE team.",
      },
      { property: "og:title", content: "Contact HELPBE" },
      {
        property: "og:description",
        content: "Questions or problems? Get in touch with the HELPBE team.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    toast.success("Thanks! We'll get back to you soon.");
    setName("");
    setContact("");
    setMessage("");
  };

  return (
    <main className="hero-gradient min-h-screen">
      <div className="mx-auto max-w-lg px-5 pb-16 pt-14">
        <h1 className="rise-in text-3xl font-semibold tracking-tight sm:text-4xl">
          Need Help?
        </h1>
        <p className="rise-in mt-4 text-lg text-muted-foreground">
          Have a question or ran into a problem? Get in touch with us.
        </p>

        <section className="surface-card rise-in mt-10 grid gap-4 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              WhatsApp
            </p>
            <p className="mt-1 text-sm text-foreground">+91 7902352660</p>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </p>
            <p className="mt-1 text-sm text-foreground">[ADD YOUR SUPPORT EMAIL]</p>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="surface-card rise-in mt-6 grid gap-4 p-6">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-ring"
              placeholder="Your name"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Phone or Email</span>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="h-12 rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-ring"
              placeholder="How can we reach you?"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring"
              placeholder="Tell us what's going on"
            />
          </label>
          <button
            type="submit"
            className="mt-1 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            Send Message
          </button>
        </form>
      </div>
    </main>
  );
}
