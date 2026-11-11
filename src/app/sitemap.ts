import type { MetadataRoute } from "next";
import { projects } from "@/content/pending";
import { services } from "@/content/services";
import { features, siteUrl } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/servicios", "/calculadora", "/empresa", "/contacto", ...services.map((s) => `/servicios/${s.slug}`)];
  if (features.projects && projects.length) paths.push("/proyectos");
  return paths.map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: "monthly", priority: p === "" ? 1 : 0.7 }));
}
