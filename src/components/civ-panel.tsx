import { formatGyr, formatPct } from "@/lib/universe/format";
import type { Copy } from "@/lib/universe/i18n";
import {
  intelligenceWindow,
  sparkPath,
  formatDiasporaLine,
  type CivModel,
} from "@/lib/universe/civilization";
import type { Evaluation, UniverseParams } from "@/lib/universe/types";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  params: UniverseParams;
  evaluation: Evaluation;
};

export function CivPanel({ copy, params, evaluation }: Props) {
  const model = intelligenceWindow(params, evaluation);
  const routes = formatDiasporaLine(model, copy.civ, { swarmProb: evaluation.swarmProb });
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-medium">{copy.civ.title}</h3>
        <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-muted">
          {copy.civ.hint}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
            {copy.civ.path}
          </dt>
          <dd className="mt-0.5 text-sm text-fg">{copy.civ.pathLabel[model.path]}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
            {copy.civ.intelligence}
          </dt>
          <dd
            className={cn(
              "mt-0.5 font-mono text-sm tabular-nums",
              model.pIntelligence >= 0.08
                ? model.path === "eternal"
                  ? "text-eternal"
                  : "text-life"
                : "text-fg-subtle",
            )}
          >
            {formatPct(model.pIntelligence)}
          </dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
            {copy.civ.carrying}
          </dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">
            {formatPct(model.carrying)}
          </dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
            {copy.civ.ships}
          </dt>
          <dd
            className={cn(
              "mt-0.5 font-mono text-sm tabular-nums",
              model.ships >= 0.08 ? "text-accent" : "text-fg-subtle",
            )}
          >
            {formatPct(model.ships)}
          </dd>
        </div>
      </dl>

      {routes ? (
        <p className="text-pretty text-sm leading-relaxed text-fg-muted">{routes}</p>
      ) : null}

      <ul className="flex flex-col gap-2.5">
        {model.stages.map((stage) => (
          <li key={stage.id} className="flex flex-col gap-1">
            <div className="flex justify-between gap-3">
              <span className="text-xs text-fg-muted">{copy.civ.stages[stage.id]}</span>
              <span className="font-mono text-xs tabular-nums text-fg">
                {formatPct(stage.pSurvive)}
                <span className="ml-2 text-fg-subtle">
                  {" "}
                  {formatGyr(stage.tStartGyr)}
                </span>
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-bg-subtle">
              <div
                className={cn(
                  "h-full rounded-full",
                  stage.pSurvive >= 0.18
                    ? model.path === "eternal"
                      ? "bg-eternal/80"
                      : "bg-life/80"
                    : "bg-fg-subtle/50",
                )}
                style={{ width: `${Math.round(stage.pSurvive * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <Ecology copy={copy} model={model} />

      {model.collapsed ? (
        <p className="text-pretty text-xs leading-relaxed text-sterile">{copy.civ.collapsed}</p>
      ) : model.path === "eternal" ? (
        <p className="text-pretty text-xs leading-relaxed text-eternal">{copy.civ.persists}</p>
      ) : null}
    </section>
  );
}

function Ecology({ copy, model }: { copy: Copy; model: CivModel }) {
  const w = 280;
  const h = 72;
  const bio = sparkPath(
    model.curve.map((p) => p.biosphere),
    w,
    h,
  );
  const minds = sparkPath(
    model.curve.map((p) => p.minds),
    w,
    h,
  );
  return (
    <div>
      <h4 className="text-sm font-medium">{copy.civ.ecology}</h4>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mt-2 h-16 w-full text-fg"
        role="img"
        aria-label={copy.civ.ecology}
      >
        <path d={bio} fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" />
        <path d={minds} fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[0.6875rem] text-fg-subtle uppercase">
        <span>{copy.civ.biosphere}</span>
        <span>{copy.civ.minds}</span>
      </div>
    </div>
  );
}
