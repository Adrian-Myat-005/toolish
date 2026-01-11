import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function isBurmese(text) {
  if (!text) return false;
  // Burmese Unicode range: U+1000–U+109F
  const burmeseRegex = /[\u1000-\u109F]/;
  return burmeseRegex.test(text);
}
