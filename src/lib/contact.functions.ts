import { createServerFn } from "@tanstack/react-start";
import { contactMessageSchema } from "./contact.shared";

export const submitContactMessage = createServerFn({ method: "POST" })
  .validator((data: unknown) => contactMessageSchema.parse(data))
  .handler(async ({ data }) => {
    const webhookUrl = process.env["CONTACT_SHEETS_WEBHOOK_URL"];
    if (!webhookUrl) {
      console.error("CONTACT_SHEETS_WEBHOOK_URL is not configured");
      return {
        ok: false as const,
        error: "Contact messages are not configured yet.",
      };
    }

    const requestId = crypto.randomUUID();
    const payload = {
      ...data,
      requestId,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        redirect: "follow",
      });
      const responseText = await response.text();

      if (!response.ok) {
        console.error(`Contact sheet webhook failed [${response.status}]: ${responseText}`);
        return { ok: false as const, error: "We couldn't send your message. Please try again." };
      }

      const receipt = JSON.parse(responseText) as {
        success?: boolean;
        status?: string;
        requestId?: string;
        contactId?: string;
        error?: string;
      };
      const confirmedByContactScript =
        receipt.success === true &&
        receipt.requestId === requestId &&
        typeof receipt.contactId === "string" &&
        /^CONTACT-\d{6}$/.test(receipt.contactId);
      const confirmedByExistingWebhook = receipt.status?.toLowerCase() === "success";

      if (!confirmedByContactScript && !confirmedByExistingWebhook) {
        console.error(`Contact sheet did not confirm append: ${responseText.slice(0, 300)}`);
        return { ok: false as const, error: "We couldn't confirm your message. Please try again." };
      }

      return { ok: true as const, error: null as string | null };
    } catch (error) {
      console.error("Contact sheet submission failed", error);
      return { ok: false as const, error: "We couldn't send your message. Please try again." };
    }
  });
