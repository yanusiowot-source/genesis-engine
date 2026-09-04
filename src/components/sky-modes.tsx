import { CircleDot, Eclipse, Eye, Orbit } from "lucide-react";
import { Segmented } from "@/components/segmented";
import type { Copy } from "@/lib/universe/i18n";
import type { SkyMode } from "@/lib/universe/types";

type Props = {
  copy: Copy;
  mode: SkyMode;
  onChange: (mode: SkyMode) => void;
};

export function SkyModes({ copy, mode, onChange }: Props) {
  return (
    <Segmented
      collapseLabel
      className="w-full max-w-md"
      ariaLabel={copy.obs.modesLabel}
      value={mode}
      onChange={onChange}
      items={[
        { id: "galaxy", label: copy.obs.modes.galaxy, title: copy.obs.modeHint.galaxy, icon: Orbit },
        {
          id: "planetarium",
          label: copy.obs.modes.planetarium,
          title: copy.obs.modeHint.planetarium,
          icon: Eye,
        },
        { id: "lensing", label: copy.obs.modes.lensing, title: copy.obs.modeHint.lensing, icon: CircleDot },
        {
          id: "collision",
          label: copy.obs.modes.collision,
          title: copy.obs.modeHint.collision,
          icon: Eclipse,
        },
      ]}
    />
  );
}
