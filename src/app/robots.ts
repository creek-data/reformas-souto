import type { MetadataRoute } from "next";
import { indexable, siteUrl } from "@/content/site";

/** Hasta el lanzamiento (SITE_INDEXABLE=true) la web no se deja indexar. */
export default function robots(): MetadataRoute.Robots {
  if (!indexable) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: "/api/" }, sitemap: `${siteUrl}/sitemap.xml` };
}
