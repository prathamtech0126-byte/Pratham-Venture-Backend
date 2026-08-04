import { z } from "zod";

export const contentModeSchema = z
  .enum(["TEMPLATE", "CUSTOM"])
  .optional()
  .default("TEMPLATE");

export const customContentSchema = z.string().max(50000).optional().nullable();

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasCustomContent(content: string | null | undefined): boolean {
  if (!content) return false;
  return stripHtml(content).length > 0;
}

export function isCustomMode(mode: string | null | undefined): boolean {
  return mode === "CUSTOM";
}
