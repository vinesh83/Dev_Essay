import { useEffect, useRef, useState } from "react";

// Lazy wrapper for the 3D showroom. three.js loads only when this mounts.
export default function Showroom3D({ carId }: { carId: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const room = useRef<{ setCar: (id: string) => void; resize: () => void; dispose: () => void } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    let ro: ResizeObserver | null = null;
    import("../three/showroom")
      .then(({ createShowroom }) => {
        if (!alive || !ref.current) return;
        try {
          room.current = createShowroom(ref.current, carId);
          ro = new ResizeObserver(() => room.current?.resize());
          ro.observe(ref.current);
        } catch {
          setFailed(true);
        }
      })
      .catch(() => setFailed(true));
    return () => {
      alive = false;
      ro?.disconnect();
      room.current?.dispose();
      room.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => room.current?.setCar(carId), [carId]);

  if (failed) return <div className="showroom fallback">🏎️ 3D needs a newer browser. Your car is still in the Garage!</div>;
  return <canvas ref={ref} className="showroom" aria-label="3D car showroom. Drag to spin." />;
}
