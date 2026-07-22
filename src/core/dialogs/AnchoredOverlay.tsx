import { CSSProperties, ReactNode, RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type OverlayAlignment = "start" | "end";

export function anchoredOverlayPosition(anchor: Pick<DOMRect, "top" | "left" | "right" | "bottom">, overlay: Pick<DOMRect, "width" | "height">, viewport: { width: number; height: number }, alignment: OverlayAlignment = "start", gap = 6): { top: number; left: number } {
  const fitsBelow = anchor.bottom + gap + overlay.height <= viewport.height - gap;
  const proposedTop = fitsBelow ? anchor.bottom + gap : anchor.top - gap - overlay.height;
  const maxTop = Math.max(gap, viewport.height - overlay.height - gap);
  const proposedLeft = alignment === "end" ? anchor.right - overlay.width : anchor.left;
  const maxLeft = Math.max(gap, viewport.width - overlay.width - gap);
  return {
    top: Math.min(Math.max(proposedTop, gap), maxTop),
    left: Math.min(Math.max(proposedLeft, gap), maxLeft),
  };
}

export function unscaleAnchoredOverlayPosition(position: { top: number; left: number }, cssZoom: number): { top: number; left: number } {
  const scale = Number.isFinite(cssZoom) && cssZoom > 0 ? cssZoom : 1;
  return { top: position.top / scale, left: position.left / scale };
}

function effectiveCssZoom(element: HTMLElement): number {
  const currentCssZoom = (element as HTMLElement & { currentCSSZoom?: number }).currentCSSZoom;
  if (typeof currentCssZoom === "number" && currentCssZoom > 0) return currentCssZoom;
  const rootZoom = Number.parseFloat(getComputedStyle(document.documentElement).zoom);
  return Number.isFinite(rootZoom) && rootZoom > 0 ? rootZoom : 1;
}

export function AnchoredOverlay({ anchorRef, children, className, onClose, alignment = "start", matchAnchorWidth = false }: { anchorRef: RefObject<HTMLElement | null>; children: ReactNode; className: string; onClose: () => void; alignment?: OverlayAlignment; matchAnchorWidth?: boolean }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const [style, setStyle] = useState<CSSProperties>({ visibility: "hidden" });
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    const position = () => {
      const anchor = anchorRef.current;
      const overlay = overlayRef.current;
      if (!anchor || !overlay) return;
      const cssZoom = effectiveCssZoom(overlay);
      const anchorRect = anchor.getBoundingClientRect();
      const matchedWidth = matchAnchorWidth ? anchorRect.width / cssZoom : undefined;
      if (matchedWidth) overlay.style.width = `${matchedWidth}px`;
      const overlayRect = overlay.getBoundingClientRect();
      const position = anchoredOverlayPosition(anchorRect, overlayRect, { width: window.innerWidth, height: window.innerHeight }, alignment);
      setStyle({
        ...unscaleAnchoredOverlayPosition(position, cssZoom),
        width: matchedWidth,
      });
    };
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [alignment, anchorRef, matchAnchorWidth]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (overlayRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onCloseRef.current();
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [anchorRef]);

  return createPortal(<div ref={overlayRef} className={className} style={style}>{children}</div>, document.body);
}
