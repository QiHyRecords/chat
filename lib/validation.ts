export const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "support",
  "system",
  "chat",
  "root",
  "owner",
  "moderator",
]);

const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F-\u009F]/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,32}$/;

export type FieldValidation = { valid: true; value: string } | { valid: false; error: string };

export function normalizeDisplayName(value: string): FieldValidation {
  if (CONTROL_CHARACTERS.test(value)) return { valid: false, error: "Display name contains unsupported characters." };
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return { valid: false, error: "Display name is required." };
  if (normalized.length > 80) return { valid: false, error: "Display name must be 80 characters or fewer." };
  return { valid: true, value: normalized };
}

export function normalizeUsername(value: string): FieldValidation {
  const normalized = value.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(normalized)) {
    return { valid: false, error: "Use 3–32 letters, numbers, or underscores." };
  }
  if (RESERVED_USERNAMES.has(normalized)) return { valid: false, error: "That username is reserved." };
  return { valid: true, value: normalized };
}

export function validateEmail(value: string): FieldValidation {
  const normalized = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return { valid: false, error: "Enter a valid email address." };
  return { valid: true, value: normalized };
}

export function validatePassword(value: string): FieldValidation {
  if (value.length < 8) return { valid: false, error: "Password must contain at least 8 characters." };
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return { valid: false, error: "Password must include a letter and a number." };
  return { valid: true, value };
}

export function validateBio(value: string): FieldValidation {
  if (value.length > 500) return { valid: false, error: "Bio must be 500 characters or fewer." };
  if (CONTROL_CHARACTERS.test(value)) return { valid: false, error: "Bio contains unsupported characters." };
  return { valid: true, value: value.trim() };
}
