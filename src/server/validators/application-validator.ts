import { z } from "zod";

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
