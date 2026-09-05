import { FileOutput, FlaskConical, Orbit, ScanSearch, Sigma } from "lucide-react";
import { Segmented } from "@/components/segmented";
import type { Copy } from "@/lib/universe/i18n";
import type { LabPane } from "@/lib/universe/types";

type Props = {
  copy: Copy;
  pane: LabPane;
  onChange: (pane: LabPane) => void;
};

export function LabPanes({ copy, pane, onChange }: Props) {
  return (
    <Segmented
      stacked
      className="bg-bg"
      ariaLabel={copy.tabs.lab}
      value={pane}
      onChange={onChange}
      items={[
        { id: "constants", label: copy.labPanes.constants, title: copy.labPaneHint.constants, icon: FlaskConical },
        { id: "hunt", label: copy.labPanes.hunt, title: copy.labPaneHint.hunt, icon: ScanSearch },
        { id: "life", label: copy.labPanes.life, title: copy.labPaneHint.life, icon: Orbit },
        { id: "laws", label: copy.labPanes.laws, title: copy.labPaneHint.laws, icon: Sigma },
        { id: "desk", label: copy.labPanes.desk, title: copy.labPaneHint.desk, icon: FileOutput },
      ]}
    />
  );
}
