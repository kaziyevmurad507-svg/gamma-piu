import type { MetadataRoute } from "next";
import { IS_NON_PRODUCTION, SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  if (IS_NON_PRODUCTION) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: "/admin" }, sitemap: `${SITE_URL}/sitemap.xml` };
}
