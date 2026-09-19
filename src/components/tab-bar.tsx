import { Aperture, Bookmark, SlidersHorizontal } from "lucide-react";
import { Segmented } from "@/components/segmented";
import type { Copy } from "@/lib/universe/i18n";

export type AppTab = "sky" | "lab" | "log";

type Props = {
  copy: Copy;
  tab: AppTab;
  onChange: (tab: AppTab) => void;
  nudge?: AppTab | null;
};

export function TabBar({ copy, tab, onChange, nudge = null }: Props) {
  return (
    <nav
      className="relative z-50 border-t border-border bg-bg-elevated/95 pb-[env(safe-area-inset-bottom)] pointer-events-auto"
      aria-label={copy.tabs.sky + " / " + copy.tabs.lab + " / " + copy.tabs.log}
    >
      <Segmented
        stacked
        className="rounded-none bg-transparent p-1"
        ariaLabel={copy.tabs.sky + " / " + copy.tabs.lab + " / " + copy.tabs.log}
        value={tab}
        onChange={onChange}
        nudge={nudge}
        items={[
          { id: "sky", label: copy.tabs.sky, icon: Aperture },
          { id: "lab", label: copy.tabs.lab, icon: SlidersHorizontal },
          { id: "log", label: copy.tabs.log, icon: Bookmark },
        ]}
      />
    </nav>
  );
}
