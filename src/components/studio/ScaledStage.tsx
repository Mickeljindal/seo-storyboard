import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders a fixed-size design (w×h px) scaled to fill its container width,
 * preserving aspect ratio — so the exact same pixel layout used to export
 * PNGs/MP4s renders crisply at any display size in the dashboard.
 */
export function ScaledStage({
  w,
  h,
  radius = 0,
  className,
  children,
}: {
  w: number;
  h: number;
  radius?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / w);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div
      ref={ref}
      className={className}
      style={{ position: "relative", width: "100%", aspectRatio: `${w} / ${h}`, overflow: "hidden", borderRadius: radius }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, width: w, height: h, transformOrigin: "top left", transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
