import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";
import { logger } from "../config/logger";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function formatDate(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  }
): Promise<string> {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
    return date.toLocaleDateString("en-US", options);
  } catch (error) {
    await logger.warn("Invalid date format", { dateString, error: error instanceof Error ? error.message : "Unknown error" });
    return "Invalid Date";
  }
}

export function formatCurrency(amount: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
  } catch (error) {
    logger.error("Failed to format currency", { amount, currency, error: error instanceof Error ? error.message : "Unknown error" });
    return `${amount} ${currency}`;
  }
}

export function truncateString(str: string, length = 50): string {
  if (!str) return "";
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timeoutId: NodeJS.Timeout;
  const debounced = function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timeoutId);
  return debounced;
}

export function generateRandomString(length = 8): string {
  try {
    return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
  } catch (error) {
    logger.error("Failed to generate random string", { length, error: error instanceof Error ? error.message : "Unknown error" });
    throw new Error("Failed to generate random string");
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  if (!isValid) {
    logger.warn("Invalid email format", { email: "[REDACTED]" });
  }
  return isValid;
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?\d{10,15}$/;
  const cleanedPhone = phone.replace(/[\s-]/g, "");
  const isValid = phoneRegex.test(cleanedPhone);
  if (!isValid) {
    logger.warn("Invalid phone format", { phone: "[REDACTED]" });
  }
  return isValid;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    logger.error("Error extracted", { message: error.message, name: error.name });
    return error.message;
  }
  const message = String(error);
  logger.error("Non-Error object converted to string", { message });
  return message;
}

export async function safeJsonParse<T>(jsonString: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    await logger.error("Failed to parse JSON", { jsonString: truncateString(jsonString, 50), error: error instanceof Error ? error.message : "Unknown error" });
    return fallback;
  }
}

export async function getFromLocalStorage<T>(key: string, fallback: T): Promise<T> {
  if (typeof window === "undefined") {
    await logger.warn("Attempted to access localStorage in non-browser environment", { key });
    return fallback;
  }
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      await logger.info("No value found in localStorage", { key });
      return fallback;
    }
    const parsed = JSON.parse(item) as T;
    await logger.info("Value retrieved from localStorage", { key });
    return parsed;
  } catch (error) {
    await logger.error("Error reading from localStorage", { key, error: error instanceof Error ? error.message : "Unknown error" });
    return fallback;
  }
}

export async function setToLocalStorage(key: string, value: unknown): Promise<boolean> {
  if (typeof window === "undefined") {
    await logger.warn("Attempted to write to localStorage in non-browser environment", { key });
    return false;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
    await logger.info("Value written to localStorage", { key });
    if (key.toLowerCase().includes("token") || key.toLowerCase().includes("password")) {
      await logger.warn("Storing sensitive data in localStorage is insecure", { key });
    }
    return true;
  } catch (error) {
    await logger.error("Error writing to localStorage", { key, error: error instanceof Error ? error.message : "Unknown error" });
    return false;
  }
}