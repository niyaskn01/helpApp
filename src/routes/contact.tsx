import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { submitContactMessage } from "@/lib/contact.functions";
import { contactMessageSchema } from "@/lib/contact.shared";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact HELPBE" },
      {
        name: "description",
        content: "Have a question or ran into a problem? Get in touch with the HELPBE team.",
      },
      { property: "og:title", content: "Contact HELPBE" },
      {
        property: "og:description",
        content: "Questions or problems? Get in touch with the HELPBE team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const sendMessage = useServerFn(submitContactMessage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactMessageSchema.safeParse({ name, contact, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await sendMessage({ data: parsed.data });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Thanks! We'll get back to you soon.");
      setName("");
      setContact("");
      setMessage("");
    } catch {
      toast.error("We couldn't send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="hero-gradient min-h-screen">
      <div className="mx-auto max-w-lg px-5 pb-16 pt-14">
        <h1 className="rise-in text-3xl font-semibold tracking-tight sm:text-4xl">Need Help?</h1>
        <p className="rise-in mt-4 text-lg text-muted-foreground">
          Have a question or ran into a problem? Get in touch with us.
        </p>

        <section className="surface-card rise-in mt-10 grid gap-4 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              WhatsApp
            </p>
            {/* <p className="mt-1 text-sm text-foreground">+91 9702352660</p> */}
            <a
  href="https://wa.me/919702352660"
  target="_blank"
  rel="noopener noreferrer"
  className="mt-1 block text-sm text-foreground hover:underline"
>
  +91 7902352660
</a>
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
              name="name"
              autoComplete="name"
              maxLength={80}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-ring"
              placeholder="Your name"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Phone or Email</span>
            <input
              name="contact"
              autoComplete="email"
              maxLength={255}
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="h-12 rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-ring"
              placeholder="How can we reach you?"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Message</span>
            <textarea
              name="message"
              maxLength={1000}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring"
              placeholder="Tell us what's going on"
            />
          </label>
          <Button
            type="submit"
            disabled={submitting}
            className="mt-1 h-12 w-full rounded-2xl text-base font-semibold transition-transform active:scale-[0.98]"
          >
            {submitting ? "Sending…" : "Send Message"}
          </Button>
        </form>
      </div>
    </main>
  );
}
