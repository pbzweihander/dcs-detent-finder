import { useCallback, useEffect, useRef, useState } from "react";

export function useGamepads(): Gamepad[] {
  const [gamepads, setGamepads] = useState<Gamepad[]>([]);
  const requestRef = useRef<number>();

  const haveEvents = "ongamepadconnected" in window;

  const addGamepad = useCallback(
    (gamepad: Gamepad) => {
      setGamepads((gps) => {
        const newGps = [...gps];
        newGps[gamepad.index] = gamepad;
        return newGps;
      });
    },
    [setGamepads]
  );

  const removeGamepad = useCallback(
    (gamepad: Gamepad) => {
      setGamepads((gps) => gps.filter((gp) => gp.index !== gamepad.index));
    },
    [setGamepads]
  );

  const connectGamepadHandler = useCallback(
    (e: GamepadEvent) => {
      addGamepad(e.gamepad);
    },
    [addGamepad]
  );

  const disconnectGamepadHandler = useCallback(
    (e: GamepadEvent) => {
      removeGamepad(e.gamepad);
    },
    [removeGamepad]
  );

  const scanGamepads = useCallback(() => {
    const detectedGamepads =
      navigator.getGamepads != null
        ? navigator.getGamepads()
        : navigator.webkitGetGamepads != null
        ? navigator.webkitGetGamepads()
        : [];

    for (const gamepad of detectedGamepads) {
      if (gamepad != null) {
        addGamepad(gamepad);
      }
    }
  }, [addGamepad]);

  useEffect(() => {
    window.addEventListener("gamepadconnected", connectGamepadHandler);
    window.addEventListener("gamepaddisconnected", disconnectGamepadHandler);

    return () => {
      window.removeEventListener("gamepadconnected", connectGamepadHandler);
      window.removeEventListener(
        "gamepaddisconnected",
        disconnectGamepadHandler
      );
    };
  }, [connectGamepadHandler, disconnectGamepadHandler]);

  const animate = useCallback(() => {
    if (haveEvents) {
      scanGamepads();
    }
    requestRef.current = requestAnimationFrame(animate);
  }, [requestRef, scanGamepads, haveEvents]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current !== undefined) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);

  return gamepads;
}
