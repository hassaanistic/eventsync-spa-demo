import { z } from "zod";

// Identity form schema
export const identityFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zip: z.string().optional(),
});

// Manual lead form schema
export const manualLeadFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  city: z.string().optional(),
  stateCode: z.string().optional(),
  countryCode: z.string().optional(),
  zipCode: z.string().optional(),
  stageInSalesProcess: z.string().optional(),
  preferredPlan: z.string().optional(),
});

// Contact form schema
export const contactFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().optional(),
  role: z.string().optional(),
  company: z.string().optional(),
});

// Manual contact form schema
export const manualContactFormSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  channel: z.string().optional(),
  notes: z.string().optional(),
});

// Product contact form schema
export const productContactFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  question: z.string().min(1, "Question is required"),
});

export type IdentityFormData = z.infer<typeof identityFormSchema>;
export type ManualLeadFormData = z.infer<typeof manualLeadFormSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type ManualContactFormData = z.infer<typeof manualContactFormSchema>;
export type ProductContactFormData = z.infer<typeof productContactFormSchema>;

