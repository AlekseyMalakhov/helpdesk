import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters."),
  email: z.email("Valid email is required."),
  password: z.string().trim().min(8, "Password must be at least 8 characters."),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// Client form schema — empty string means "don't change password"
export const editUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters."),
  email: z.email("Valid email is required."),
  password: z.string().trim().refine(
    (val) => val === "" || val.length >= 8,
    "Password must be at least 8 characters.",
  ),
});

export type EditUserInput = z.infer<typeof editUserSchema>;

// Server request body schema — password absent means "don't change"
export const editUserBodySchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters."),
  email: z.email("Valid email is required."),
  password: z.string().min(8, "Password must be at least 8 characters.").optional(),
});

export type EditUserBody = z.infer<typeof editUserBodySchema>;
