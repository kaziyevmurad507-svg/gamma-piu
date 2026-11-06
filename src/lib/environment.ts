// While pre-prod shares the live data source, it must never expose admin writes.
export const IS_READ_ONLY_STAGING = process.env.VERCEL_TARGET_ENV === "pre-prod" || process.env.APP_ENV === "pre-prod";
