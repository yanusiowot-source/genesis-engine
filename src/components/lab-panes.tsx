import { FileOutput, FlaskConical, Orbit, ScanSearch, Sigma } from "lucide-react";
import { Segmented } from "@/components/segmented";
import type { Copy } from "@/lib/universe/i18n";
import type { LabPane } from "@/lib/universe/types";

type Props = {
  copy: Copy;
  pane: LabPane;
  onChange: (pane: LabPane) => void;
  nudge?: LabPane | null;
};

export function LabPanes({ copy, pane, onChange, nudge = null }: Props) {
  return (
    <Segmented
      stacked
      collapseLabel
      className="bg-bg"
      ariaLabel={copy.tabs.lab}
      value={pane}
      onChange={onChange}
      nudge={nudge}
      items={[
        { id: "constants", label: copy.labPanes.constants, icon: FlaskConical },
        { id: "hunt", label: copy.labPanes.hunt, icon: ScanSearch },
        { id: "life", label: copy.labPanes.life, icon: Orbit },
        { id: "laws", label: copy.labPanes.laws, icon: Sigma },
        { id: "desk", label: copy.labPanes.desk, icon: FileOutput },
      ]}
    />
  );
}