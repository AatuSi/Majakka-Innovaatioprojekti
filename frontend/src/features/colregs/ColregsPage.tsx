import type { ChangeEvent } from "react";
import useColreg from "./useColreg";

export default function ColregsPage() {
  const { view, scenario, bearingDeg, setScenario, setBearingDeg } = useColreg();

  const handleBearingChange = (e: ChangeEvent<HTMLInputElement>) => setBearingDeg(+e.target.value);

  return (
    <section className="max-w-96 max-h-96 text-white">
      <input type="range" min={0} max={360} onChange={handleBearingChange}></input>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-60 -65 120 80"
        role="img"
        aria-label={`Rule ${scenario.rule} lights, bearing ${bearingDeg} degrees`}
      >
        ${view}
      </svg>
    </section>
  );
}
