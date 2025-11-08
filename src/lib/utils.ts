import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumber(value: string): string {
  if (!value) return "";
  const phoneNumber = value.replace(/\D/g, ''); // Remove all non-digit characters
  const phoneNumberLength = phoneNumber.length;

  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
}

/**
 * Generates a consistent HSL color from a string.
 * @param str The input string (e.g., school name).
 * @param s Saturation percentage (e.g., 70).
 * @param l Lightness percentage (e.g., 70).
 * @returns An HSL color string (e.g., "hsl(120, 70%, 70%)").
 */
export function stringToHslColor(str: string, s: number, l: number): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
}