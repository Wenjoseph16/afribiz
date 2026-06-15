import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(1, 'Le nom du tag est requis').max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Couleur invalide').optional(),
});

export const createNoteSchema = z.object({
  content: z.string().min(1, 'Le contenu de la note est requis').max(2000),
});

export const updateNoteSchema = z.object({
  content: z.string().min(1, 'Le contenu de la note est requis').max(2000),
});

export const createSegmentSchema = z.object({
  name: z.string().min(1, 'Le nom du segment est requis').max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Couleur invalide').optional(),
  isDynamic: z.boolean().optional(),
  conditions: z.any().optional(),
});

export const updateSegmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isDynamic: z.boolean().optional(),
  conditions: z.any().optional(),
});

export const assignTagToClientSchema = z.object({
  tagId: z.string().min(1, 'ID du tag requis'),
});

export const assignClientToSegmentSchema = z.object({
  segmentId: z.string().min(1, 'ID du segment requis'),
});
