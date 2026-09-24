import { ChevronDown } from "lucide-react";

export interface FaqItem {
  q: string;
  a: string;
}

/** The schema.org FAQPage graph node for a guide's FAQ list. */
export function faqJsonLd(faq: FaqItem[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/**
 * The "Frequently asked questions" list shared by every guide page: one
 * grouped card of native disclosure rows. Each question is a full-width,
 * 56px+ tap target; answers stay in the HTML (and in search results) while
 * collapsed, and it all works without JavaScript.
 */
export function FaqSection({
  faq,
  title = "Frequently asked questions",
}: {
  faq: FaqItem[];
  title?: string;
}) {
  return (
    <section className="mt-12 md:mt-14">
      <h2 className="text-balance text-2xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4 divide-y overflow-hidden rounded-2xl border bg-card">
        {faq.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:bg-accent [&::-webkit-details-marker]:hidden">
              <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug">
                {item.q}
              </h3>
              <ChevronDown
                className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="px-4 pb-4 text-base/relaxed text-foreground/85">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
