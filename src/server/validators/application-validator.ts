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

export const cancelInterviewSchema = z.object({
  nextStatus: z.enum(["APPLIED", "INTERVIEWING"]),
}).strict();

export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusSchema
>;

export type CancelInterviewInput = z.infer<typeof cancelInterviewSchema>;
