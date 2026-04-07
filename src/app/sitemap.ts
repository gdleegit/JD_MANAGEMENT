import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = "https://joongdong-aa.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tournaments = await prisma.tournament.findMany({
    where: { active: true },
    select: { id: true, createdAt: true },
  });

  return [
    {
      url: `${BASE_URL}/tournaments`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...tournaments.map((t) => ({
      url: `${BASE_URL}/tournaments/${t.id}`,
      lastModified: t.createdAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
