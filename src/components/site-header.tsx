import { LivePill } from "@/components/live-pill";
import { Wordmark } from "@/components/wordmark";
import { branding } from "@/lib/env";
import { getPresenceCounts } from "@/lib/presence";

export async function SiteHeader() {
  const { online, lastHour } = await getPresenceCounts();

  return (
    <header className="mb-6 text-center">
      <h1>
        <Wordmark />
      </h1>
      <div className="mt-5">
        <LivePill initialOnline={online} initialLastHour={lastHour} />
      </div>
      <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-balance text-muted-foreground [text-wrap:pretty]">
        {branding.tagline}{" "}
        <span className="font-semibold text-primary">{branding.taglineEmphasis}</span>
      </p>
    </header>
  );
}
