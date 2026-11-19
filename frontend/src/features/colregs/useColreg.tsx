import { useState } from "react";
import { renderSvg } from "./colregUtils";
import type { Scenario } from "./colregUtils";

export default function useColreg() {
  const [scenario, setScenario] = useState<Scenario>({ rule: 23, kind: "power", lengthM: 30 });
  const [bearingDeg, setBearingDeg] = useState(0);
  const [showSilhouette, setShowSilhouette] = useState(true);

  const view = renderSvg(scenario, bearingDeg, 0, showSilhouette);

  return {
    view,
    scenario,
    bearingDeg,
    showSilhouette,
    setScenario,
    setBearingDeg,
    setShowSilhouette,
  };
}
