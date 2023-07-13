import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

import Select from "./Select";
import githubLogo from "./assets/github-mark.svg";
import { aircraftDetents } from "./data";
import { useGamepads } from "./hooks";

const calculationValues = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function toDcsAxisValue(value: number): number {
  return (value + 1) * 50;
}

export default function App() {
  const gamepads = useGamepads();

  const [selectedAircraftName, setSelectedAircraftName] = useState<
    string | undefined
  >();
  const [selectedGamepadIndex, setSelectedGamepadIndex] = useState<
    number | undefined
  >();
  const [selectedAxisIndex, setSelectedAxisIndex] = useState<
    number | undefined
  >();

  const [isInverted, setIsInverted] = useState(false);
  const [saturation, setSaturation] = useState(100);
  const [deadzone, setDeadzone] = useState(0);

  const selectedAircraft = aircraftDetents.find(
    (ad) => ad.name === selectedAircraftName
  );
  const selectedGamepad =
    selectedGamepadIndex !== undefined
      ? gamepads[selectedGamepadIndex]
      : undefined;

  const milValue =
    selectedAircraft !== undefined ? selectedAircraft.mil : undefined;
  const selectedAxisValue =
    selectedGamepad !== undefined && selectedAxisIndex !== undefined
      ? selectedGamepad.axes[selectedAxisIndex]
      : undefined;
  const detentValue =
    selectedAxisValue !== undefined
      ? Math.floor(toDcsAxisValue(selectedAxisValue))
      : undefined;

  const resultValues = [...calculationValues];
  // Reference: https://github.com/asherao/DCS-Detent-Calculator/blob/932357c13991c32d05cca21c79b830560d1515b4/DCS-Detent-Calculation-Spreadsheet/MainWindow.xaml.cs
  if (milValue !== undefined && detentValue !== undefined) {
    const deadzoneFactor = detentValue - deadzone;
    const combinedFactor = deadzoneFactor / (saturation / 100);

    const nrSlope = isInverted
      ? -(100 - milValue) / combinedFactor
      : (100 - milValue) / (100 - combinedFactor);
    const nrInt = isInverted ? 100 : -(nrSlope - 1) * 100;
    const arSlope = isInverted
      ? -milValue / (100 - combinedFactor)
      : milValue / combinedFactor;
    const arInt = isInverted ? -arSlope * 100 : 0;

    for (let i = 0; i < resultValues.length; i++) {
      if (isInverted) {
        if (calculationValues[i] < combinedFactor) {
          resultValues[i] = calculationValues[i] * nrSlope + nrInt;
        } else {
          resultValues[i] = calculationValues[i] * arSlope + arInt;
        }
      } else {
        if (calculationValues[i] < combinedFactor) {
          resultValues[i] = calculationValues[i] * arSlope + arInt;
        } else {
          resultValues[i] = calculationValues[i] * nrSlope + nrInt;
        }
      }
      if (isNaN(resultValues[i])) {
        if (isInverted) {
          resultValues[i] = 0;
        } else {
          resultValues[i] = 100;
        }
      } else {
        resultValues[i] = Math.round(resultValues[i]);
      }
    }
  }
  const graphData = resultValues.map((value) => ({ value }));

  return (
    <>
      <div className="navbar bg-base-200">
        <h1 className="ml-2 text-xl">DCS Afterburner Detent Finder</h1>
        <span className="grow" />
        <a
          className="link mr-5"
          href="https://www.digitalcombatsimulator.com/en/files/3315617/"
        >
          Thanks to JC of DI for the original data!
        </a>
        <a
          className="link mr-2"
          href="https://github.com/pbzweihander/dcs-detent-finder"
        >
          <img src={githubLogo} className="mr-2 w-6" alt="GitHub logo" />
          Source
        </a>
      </div>
      <div className="flex h-full flex-row">
        <div className="w-96 p-4">
          <Select
            className="select-bordered select mb-1 w-full"
            items={aircraftDetents.map((ad) => ({
              value: ad.name,
              label: ad.name,
            }))}
            value={selectedAircraftName}
            placeholder="Select Aircraft"
            onChange={(value) => {
              setSelectedAircraftName(value);
            }}
          />
          <Select
            className="select-bordered select w-full"
            items={gamepads.map((gamepad) => ({
              value: "" + gamepad.index,
              label: gamepad.id,
            }))}
            value={
              selectedGamepadIndex !== undefined
                ? "" + selectedGamepadIndex
                : undefined
            }
            placeholder="Select Throttle Device"
            onChange={(value) => {
              setSelectedGamepadIndex(Number(value));
              setSelectedAxisIndex(undefined);
            }}
          />
          <div className="px-2 text-xs">
            If the device is not listed, press any button, move an axis, or
            re-plug the device.
          </div>
          {selectedGamepad !== undefined && (
            <>
              <div className="divider" />
              <h2 className="px-2 font-bold">Select Throttle Axis</h2>
              <ul className="menu">
                {selectedGamepad.axes.map((axisValue, axisIndex) => (
                  <li
                    key={axisIndex}
                    className={
                      selectedAxisIndex === axisIndex ? "bg-accent" : ""
                    }
                  >
                    <a
                      onClick={() => {
                        setSelectedAxisIndex(axisIndex);
                      }}
                    >
                      Axis {axisIndex}
                      <progress
                        className="progress w-full"
                        value={toDcsAxisValue(axisValue)}
                        max="100"
                      />
                      {Math.floor(toDcsAxisValue(axisValue))}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="divider divider-horizontal" />
        {selectedAircraft !== undefined && selectedAxisIndex !== undefined && (
          <>
            <div className="w-60 p-4">
              <label className="label mb-2 cursor-pointer px-2">
                <span className="label-text">Inverted</span>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={isInverted}
                  onChange={(e) => {
                    setIsInverted(e.target.checked);
                  }}
                />
              </label>
              <div className="join mb-2">
                <label className="label label-text join-item w-48 px-2">
                  X Saturation
                </label>
                <input
                  type="number"
                  className="input-bordered input join-item w-full"
                  value={saturation}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value < 0) {
                      setSaturation(0);
                    } else if (value > 100) {
                      setSaturation(100);
                    } else {
                      setSaturation(value);
                    }
                  }}
                />
              </div>
              <div className="join">
                <label className="label label-text join-item w-48 px-2">
                  Deadzone
                </label>
                <input
                  type="number"
                  className="input-bordered input join-item w-full"
                  value={deadzone}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value < 0) {
                      setDeadzone(0);
                    } else if (value > 100) {
                      setDeadzone(100);
                    } else {
                      setDeadzone(value);
                    }
                  }}
                />
              </div>
            </div>
            <div className="divider divider-horizontal" />
            <div className="p-5">
              <h2 className="font-bold">
                Push the throttle to the detent position!
              </h2>
              <div className="divider" />
              <h2 className="mb-1 font-bold">Axis tune preview</h2>
              <div className="h-[50vh] w-[50vh]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData}>
                    <YAxis hide domain={[0, 100]} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="divider" />
              <h2 className="mb-1 font-bold">User Curve Values</h2>
              <div className="flex w-full justify-between">
                {resultValues.map((value, idx) => (
                  <span key={idx} className="w-8 border-2 border-slate-400">
                    {isInverted ? 100 - value : value}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
