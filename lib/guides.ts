/**
 * Registry of SEO guide/content pages under /guide. Centralized so the sitemap,
 * cross-links between guides, and the pages themselves stay in sync.
 */
export interface Guide {
  slug: string;
  title: string;
  /** Short label used in "related guides" links. */
  linkText: string;
}

export const GUIDES: Guide[] = [
  {
    slug: "how-to-split-bills-with-roommates",
    title: "How to Split Bills With Roommates (Without the Awkwardness)",
    linkText: "How to split bills with roommates",
  },
  {
    slug: "how-to-split-rent-fairly",
    title: "How to Split Rent Fairly Between Roommates",
    linkText: "How to split rent fairly",
  },
  {
    slug: "free-splitwise-alternative",
    title: "The Best Free Splitwise Alternative for Roommates",
    linkText: "The best free Splitwise alternative",
  },
];

export const guidePath = (slug: string) => `/guide/${slug}`;
