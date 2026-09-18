import { z } from "zod";

const indianMobile = /^[6-9]\d{9}$/;

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80, "Name is too long"),
  contact: z
    .string()
    .trim()
    .min(1, "Enter your phone number or email")
    .max(255, "Phone number or email is too long")
    .refine(
      (value) => indianMobile.test(value) || z.string().email().safeParse(value).success,
      "Enter a valid Indian mobile number or email",
    ),
  message: z
    .string()
    .trim()
    .min(5, "Tell us a little more")
    .max(1000, "Message must be 1000 characters or less"),
});

export type ContactMessage = z.infer<typeof contactMessageSchema>;
