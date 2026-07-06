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

/** The "Frequently asked questions" card list shared by every guide page. */
export function FaqSection({ faq }: { faq: FaqItem[] }) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold">Frequently asked questions</h2>
      <div className="mt-5 space-y-4">
        {faq.map((item) => (
          <div key={item.q} className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold">{item.q}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
