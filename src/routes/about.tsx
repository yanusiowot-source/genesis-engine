import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PayRails } from "@/components/pay-rails";
import { copyFor, detectLocale } from "@/lib/universe/i18n";
import { orderCopyUrl } from "@/lib/universe/studio";

const TITLE = "Genesis Engine — physics is not for sale";
const DESCRIPTION =
  "A cosmological laboratory. Sculpt ΛCDM, watch a galaxy, hunt three thin corridors where a mind might live. The lab is free. A Windows or Linux copy is one-time, 15 USDT.";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://yanusiowot-source.github.io/genesis-lab/og.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function AboutPage() {
  const copy = copyFor(detectLocale());
  const cards = [
    [copy.studioFreeTitle, copy.studioFreeBody],
    [copy.studioKeepTitle, copy.studioKeepBody],
    [copy.studioSupportTitle, copy.studioSupportBody],
  ] as const;

  return (
    <div className="sky-glow min-h-dvh bg-bg px-5 py-10 text-fg sm:px-8">
      <main className="mx-auto flex max-w-xl flex-col">
        <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
          {copy.kicker}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-none tracking-[-0.03em] sm:text-5xl">
          {copy.appName}
        </h1>
        <p className="mt-4 text-pretty text-base leading-relaxed text-fg-muted">{copy.aboutBody}</p>
        <p className="mt-3 text-pretty text-base leading-relaxed text-fg">{copy.studioHonesty}</p>
        <img
          src="/og.jpg"
          alt="A spiral galaxy in Genesis Engine, lit from the disk."
          width={1200}
          height={630}
          className="mt-7 w-full rounded-[var(--radius-md)] shadow-[var(--shadow-border)]"
        />
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/">{copy.studioEnterCta}</Link>
          </Button>
          <Button asChild variant="outline">
            <a href={orderCopyUrl(copy.studioOrderText)} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              {copy.studioReserveCta}
            </a>
          </Button>
        </div>
        <ul className="mt-7 flex flex-col gap-2">
          {cards.map(([title, body]) => (
            <li
              key={title}
              className="rounded-[var(--radius-md)] bg-bg-subtle px-4 py-3 shadow-[var(--shadow-border)]"
            >
              <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-accent uppercase">
                {title}
              </p>
              <p className="mt-1.5 text-pretty text-sm leading-relaxed text-fg">{body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-7">
          <PayRails copy={copy} />
        </div>
        <p className="mt-8 text-sm text-fg-subtle">{copy.sourceCode}</p>
        <p className="mt-1 font-mono text-[0.6875rem] text-fg-subtle">{copy.version}</p>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Genesis Engine",
              url: "https://yanusiowot-source.github.io/genesis-lab/about/",
              image: "https://yanusiowot-source.github.io/genesis-lab/og.jpg",
              description: DESCRIPTION,
              applicationCategory: "EducationalApplication",
              operatingSystem: "Windows, Linux, Web",
              author: { "@type": "Person", name: "Ян Ярошевич", url: "https://x.com/yanusio" },
              offers: [
                {
                  "@type": "Offer",
                  name: "Public laboratory",
                  price: "0",
                  priceCurrency: "USD",
                  description: "The public laboratory is free.",
                },
                {
                  "@type": "Offer",
                  name: "Desktop copy",
                  description: "Windows or Linux zip. One-time. 15 USDT (BEP20) or Bitcoin, then a note on X. Not a lock on the sky.",
                },
              ],
            }),
          }}
        />
      </main>
    </div>
  );
}
