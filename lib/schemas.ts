import { z } from "zod";

export const extractionSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  company: z.string(),
  job_title: z.string(),
  email: z.string(),
  phone: z.string(),
  website: z.string(),
  address: z.string(),
  region: z.string(),
  country: z.string()
});

export const enrichmentSchema = z.object({
  company_description: z.string(),
  address: z.string(),
  country: z.string(),
  region: z.string(),
  company_category: z.string(),
  company_source_url: z.string()
});
