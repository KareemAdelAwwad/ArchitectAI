import { z } from 'zod';

export const ProjectInputSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(10).max(5000),
  projectType: z.enum(['Frontend', 'Backend', 'Full Stack']),
  techStack: z.array(z.string()).max(40).default([]),
  targetUsers: z.string().max(500).default(''),
  timeline: z.string().max(200).default(''),
  budget: z.string().max(100).default(''),
  specificRequirements: z.string().max(5000).default(''),
  modelChoice: z.enum(['gemini', 'deepseek']).default('gemini').optional()
});

export type ProjectInputDTO = z.infer<typeof ProjectInputSchema>;
