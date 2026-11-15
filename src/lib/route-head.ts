export function workshopHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} | Hi Rider 4x4 World` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} | Hi Rider 4x4 World` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
