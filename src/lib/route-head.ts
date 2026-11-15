export function workshopHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} | Workshop Management` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} | Workshop Management` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
