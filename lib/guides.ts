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
  {
    slug: "how-to-split-utilities-with-roommates",
    title: "How to Split Utility Bills With Roommates",
    linkText: "How to split utilities with roommates",
  },
  {
    slug: "how-to-ask-a-roommate-for-money",
    title: "How to Ask a Roommate for Money They Owe You",
    linkText: "How to ask a roommate for money owed",
  },
  {
    slug: "how-to-split-groceries-with-roommates",
    title: "How to Split Groceries With Roommates Fairly",
    linkText: "How to split groceries with roommates",
  },
  {
    slug: "splitting-bills-with-different-incomes",
    title: "How to Split Bills When Roommates Earn Different Amounts",
    linkText: "Splitting bills with different incomes",
  },
];

export const guidePath = (slug: string) => `/guide/${slug}`;
