import { z } from "zod";

export const taskSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  contactNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  taskName: z.string().trim().min(3).max(100),
  taskDescription: z.string().trim().min(10).max(1000),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  formattedAddress: z.string().trim().min(3).max(300),
  fee: z.number().int().min(10).max(100000),
  helpersNeeded: z.number().int().min(1).max(4),
  whenNeeded: z.enum(["asap", "today", "schedule"]),
  scheduledFor: z.string().trim().max(40).optional(),
});

export const coordsSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export function makeFallbackTaskId() {
  const n = Math.floor(Math.random() * 999999) + 1;
  return `TASK-${String(n).padStart(6, "0")}`;
}