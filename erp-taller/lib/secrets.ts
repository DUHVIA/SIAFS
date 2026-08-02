if (!process.env.JWT_SECRET) {
  throw new Error("FATAL ERROR: JWT_SECRET environment variable is not set.");
}

export const BASE_SECRET = process.env.JWT_SECRET;
export const ENCODED_JWT_SECRET = new TextEncoder().encode(BASE_SECRET);
