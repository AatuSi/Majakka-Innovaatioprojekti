import { useState } from "react";
import type { ChangeEvent } from "react";
import { EXAMPLES } from "./colregUtils";
import useColreg from "./useColreg";

const rules = [23, 24, 25, 26, 27, 28, 29, 30] as const;

const options = EXAMPLES.map((scenario, index) => ({
  scenario,
  value: String(index),
  label: [
    scenario.kind.replaceAll("-", " "),
    `${scenario.lengthM} m`,
    "state" in scenario && scenario.state.replaceAll("-", " "),
    "rig" in scenario && scenario.rig,
    "towLengthM" in scenario && `tow ${scenario.towLengthM} m`,
    "dracone" in scenario && "dracone",
    "netSignal" in scenario && scenario.netSignal,
    "pairTrawling" in scenario && "pair trawling",
    "gear" in scenario && `gear ${scenario.gear.extentM} m`,
    "purseSeineHampered" in scenario && "purse seine",
    "makingWay" in scenario && "making way",
    "obstructionSide" in scenario && `${scenario.obstructionSide} obstructed`,
  ].filter(Boolean).join(" · "),
}));

export default function ColregsPage() {
  const { view, scenario, bearingDeg, setScenario, setBearingDeg } = useColreg();

  const [selectedOption, setSelectedOption] = useState("");

  const handleScenarioChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const option = options.find((opt) => opt.value === e.currentTarget.value);
    if (!option) return;

    setSelectedOption(option.value);
    setScenario(option.scenario);
  };

  const handleBearingChange = (e: ChangeEvent<HTMLInputElement>) =>
    setBearingDeg(e.currentTarget.valueAsNumber);

  return (
    <section className="text-white flex flex-col justify-center max-w-96 justify-self-center w-full py-4 px-1 gap-4">
      <label className="flex flex-col gap-2">
        Aluksen valot
        <select
          className="w-full rounded-lg bg-slate-800 p-2"
          value={selectedOption}
          onChange={handleScenarioChange}
        >
          <option value="" disabled>
            Valitse valokuvio
          </option>

          {rules.map((rule) => (
            <optgroup key={rule} label={`Sääntö ${rule}`}>
              {options
                .filter((option) => option.scenario.rule === rule)
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>

      <div className="flex gap-4">
        <div className="w-[5ch]">{bearingDeg}°</div>
        <input
          className="w-full"
          aria-label="Katselukulma"
          type="range"
          min={0}
          max={360}
          value={bearingDeg}
          onChange={handleBearingChange}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
        {["Keula", "Styyrpuuri", "Perä", "Paapuuri"].map((name, i) => (
          <button
            type="button"
            className="border-none bg-blue-500 cursor-pointer p-2 rounded-lg"
            key={name}
            onClick={() => setBearingDeg(90 * i)}
          >
            {name}
          </button>
        ))}
      </div>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-60 -65 120 80"
        role="img"
        aria-label={`Rule ${scenario.rule} lights, bearing ${bearingDeg} degrees`}
      >
        {view}
      </svg>
    </section>
  );
}
