/**
 * hooks/useCountdown.ts
 * Hook de cuenta regresiva (días, horas, minutos, segundos).
 *
 * Viene del <script> "COUNTDOWN SIMULATION" de inicio.html. En el HTML original
 * el script existía pero NO había elementos donde mostrarse (cd-days, cd-hours...),
 * así que aquí queda listo como hook para usarlo cuando agreguen un contador visual.
 *
 * Uso:  const { days, hours, minutes, seconds } = useCountdown(400368);
 */
import { useEffect, useState } from 'react';

/** Agrega un 0 a la izquierda si el número es de un dígito (5 -> "05"). */
const pad = (n: number) => String(n).padStart(2, '0');

export function useCountdown(initialSeconds: number) {
  /**
   * STATE: secondsLeft
   * Segundos que faltan para que termine la cuenta. Baja 1 cada segundo.
   */
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  /**
   * EFFECT: intervalo de 1 segundo.
   * Se crea una sola vez al montar el componente y se limpia (clearInterval)
   * al desmontarlo para evitar fugas de memoria.
   */
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return {
    days: pad(Math.floor(secondsLeft / 86400)),
    hours: pad(Math.floor((secondsLeft % 86400) / 3600)),
    minutes: pad(Math.floor((secondsLeft % 3600) / 60)),
    seconds: pad(secondsLeft % 60),
    isFinished: secondsLeft === 0,
  };
}
