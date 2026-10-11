import { createFileRoute, Link } from "@tanstack/react-router";
import { KeepDesk } from "@/components/keep-desk";
import { Button } from "@/components/ui/button";
import { copyFor, detectLocale } from "@/lib/universe/i18n";
import { APP_VERSION, productOffers, PUBLIC_LAB_URL } from "@/lib/universe/studio";

const TITLE = "Genesis Engine — physics is not for sale";
const DESCRIPTION =
  "A cosmological laboratory. Sculpt ΛCDM, watch a galaxy, hunt four thin corridors where a mind might live. The lab is free. A Windows or Linux copy is any whole dollar from $1.";

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
        <div className="mt-4 grid grid-cols-2 gap-2">
          <img
            src="/press/ph-sky.png"
            alt="The observatory sky."
            width={640}
            height={400}
            className="h-28 w-full rounded-[var(--radius-sm)] object-cover shadow-[var(--shadow-border)] sm:h-36"
          />
          <img
            src="/press/ph-lab.png"
            alt="The laboratory desk."
            width={640}
            height={400}
            className="h-28 w-full rounded-[var(--radius-sm)] object-cover shadow-[var(--shadow-border)] sm:h-36"
          />
        </div>
        <div className="mt-7">
          <Button asChild className="w-full">
            <Link to="/">{copy.studioEnterCta}</Link>
          </Button>
        </div>
        <div className="mt-8">
          <KeepDesk copy={copy} />
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
              url: `${PUBLIC_LAB_URL}about/`,
              image: `${PUBLIC_LAB_URL}og.jpg`,
              description: DESCRIPTION,
              applicationCategory: "EducationalApplication",
              operatingSystem: "Windows, Linux, Web",
              softwareVersion: APP_VERSION,
              author: { "@type": "Person", name: "Ян Ярошевич", url: "https://x.com/yanusio" },
              offers: productOffers(),
            }),
          }}
        />
      </main>
    </div>
  );
}
