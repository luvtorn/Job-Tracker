import { z } from "zod";

export const createApplicationSchema = z.object({ vacancyId: z.string().uuid() }).strict();
export const applicationQuerySchema = z.object({
  status: z.enum(["APPLIED", "INTERVIEWING", "REJECTED", "OFFER", "ACCEPTED", "WITHDRAWN"]).optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum([
    "APPLIED",
    "INTERVIEWING",
    "REJECTED",
    "OFFER",
    "ACCEPTED",
    "WITHDRAWN",
  ]),
});

export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusSchema
>;
