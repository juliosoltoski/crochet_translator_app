import { useEffect, useRef, useState } from "react";

interface Rect { x: number; y: number; w: number; h: number; }
type Corner = "tl" | "tr" | "bl" | "br";
type Drag =
  | { kind: "idle" }
  | { kind: "drawing"; ox: number; oy: number }
  | { kind: "moving";  ox: number; oy: number; base: Rect }
  | { kind: "resizing"; corner: Corner; ox: number; oy: number; base: Rect };

export interface NormalizedRect { x: number; y: number; w: number; h: number; }

interface Props {
  file: File;
  onConfirm: (selection: NormalizedRect | null) => void;
  onCancel: () => void;
}

const HIT = 9;    // px — handle hit radius
const MIN = 16;   // px — minimum meaningful selection

export function ImageRegionSelector({ file, onConfirm, onCancel }: Props) {
  const [url] = useState(() => URL.createObjectURL(file));
  // display is state (drives SVG viewBox); sizeRef is always current for event handlers
  const [display, setDisplay] = useState({ w: 0, h: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [sel, setSel] = useState<Rect | null>(null);
  const [drag, setDrag] = useState<Drag>({ kind: "idle" });
  const [cursor, setCursor] = useState("crosshair");
  const [isWide, setIsWide] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });  // always-current display size for event handlers
  const dragRef = useRef<Drag>({ kind: "idle" });
  const selRef = useRef<Rect | null>(null);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  // Keep refs in sync with state so event handlers always see latest values
  useEffect(() => { dragRef.current = drag; }, [drag]);
  useEffect(() => { selRef.current = sel; }, [sel]);

  function onLoad() {
    const img = imgRef.current!;
    const w = img.offsetWidth;
    const h = img.offsetHeight;
    sizeRef.current = { w, h };
    setDisplay({ w, h });
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    setIsWide(img.naturalWidth > img.naturalHeight * 1.4);
  }

  function pt(e: React.PointerEvent): { x: number; y: number } {
    const r = containerRef.current!.getBoundingClientRect();
    const { w, h } = sizeRef.current;
    return {
      x: Math.max(0, Math.min(w, e.clientX - r.left)),
      y: Math.max(0, Math.min(h, e.clientY - r.top)),
    };
  }

  function cornerAt(x: number, y: number, s: Rect): Corner | null {
    const pts: [Corner, number, number][] = [
      ["tl", s.x, s.y], ["tr", s.x + s.w, s.y],
      ["bl", s.x, s.y + s.h], ["br", s.x + s.w, s.y + s.h],
    ];
    for (const [c, cx, cy] of pts) {
      if (Math.abs(x - cx) <= HIT && Math.abs(y - cy) <= HIT) return c;
    }
    return null;
  }

  function inside(x: number, y: number, s: Rect): boolean {
    return x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h;
  }

  function clampRect(s: Rect): Rect {
    const { w, h } = sizeRef.current;
    return {
      x: Math.max(0, Math.min(w - s.w, s.x)),
      y: Math.max(0, Math.min(h - s.h, s.y)),
      w: s.w, h: s.h,
    };
  }

  function makeRect(ax: number, ay: number, bx: number, by: number): Rect {
    const { w, h } = sizeRef.current;
    const x = Math.max(0, Math.min(ax, bx));
    const y = Math.max(0, Math.min(ay, by));
    return { x, y, w: Math.min(Math.abs(bx - ax), w - x), h: Math.min(Math.abs(by - ay), h - y) };
  }

  function applyResize(corner: Corner, base: Rect, ox: number, oy: number, x: number, y: number): Rect {
    const dx = x - ox;
    const dy = y - oy;
    let { x: bx, y: by, w: bw, h: bh } = base;
    if (corner === "tl") { bx += dx; by += dy; bw -= dx; bh -= dy; }
    if (corner === "tr") { bw += dx; by += dy; bh -= dy; }
    if (corner === "bl") { bx += dx; bw -= dx; bh += dy; }
    if (corner === "br") { bw += dx; bh += dy; }
    if (bw < 0) { bx += bw; bw = -bw; }
    if (bh < 0) { by += bh; bh = -bh; }
    const { w, h } = sizeRef.current;
    bx = Math.max(0, bx);
    by = Math.max(0, by);
    bw = Math.min(bw, w - bx);
    bh = Math.min(bh, h - by);
    return { x: bx, y: by, w: bw, h: bh };
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = pt(e);
    const current = selRef.current;

    if (current) {
      const corner = cornerAt(x, y, current);
      if (corner) {
        const next: Drag = { kind: "resizing", corner, ox: x, oy: y, base: { ...current } };
        dragRef.current = next;
        setDrag(next);
        return;
      }
      if (inside(x, y, current)) {
        const next: Drag = { kind: "moving", ox: x, oy: y, base: { ...current } };
        dragRef.current = next;
        setDrag(next);
        return;
      }
    }
    const next: Drag = { kind: "drawing", ox: x, oy: y };
    dragRef.current = next;
    setDrag(next);
    const newSel = { x, y, w: 0, h: 0 };
    selRef.current = newSel;
    setSel(newSel);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const { x, y } = pt(e);
    const d = dragRef.current;

    if (d.kind === "idle") {
      const s = selRef.current;
      if (s) {
        const c = cornerAt(x, y, s);
        if (c) { setCursor(c === "tl" || c === "br" ? "nwse-resize" : "nesw-resize"); return; }
        if (inside(x, y, s)) { setCursor("move"); return; }
      }
      setCursor("crosshair");
      return;
    }

    let next: Rect | null = null;
    if (d.kind === "drawing")   next = makeRect(d.ox, d.oy, x, y);
    if (d.kind === "moving")    next = clampRect({ ...d.base, x: d.base.x + (x - d.ox), y: d.base.y + (y - d.oy) });
    if (d.kind === "resizing")  next = applyResize(d.corner, d.base, d.ox, d.oy, x, y);
    if (next) { selRef.current = next; setSel(next); }
  }

  function onPointerUp() {
    const d = dragRef.current;
    if (d.kind === "drawing") {
      const s = selRef.current;
      if (s && (s.w < MIN || s.h < MIN)) { selRef.current = null; setSel(null); }
    }
    const idle: Drag = { kind: "idle" };
    dragRef.current = idle;
    setDrag(idle);
  }

  function confirm() {
    const s = selRef.current;
    const { w: dw, h: dh } = sizeRef.current;
    const valid = s && s.w >= MIN && s.h >= MIN && dw > 0;
    if (!valid) { onConfirm(null); return; }
    onConfirm({ x: s!.x / dw, y: s!.y / dh, w: s!.w / dw, h: s!.h / dh });
  }

  function resetSel() { selRef.current = null; setSel(null); }

  const hasValidSel = sel != null && sel.w >= MIN && sel.h >= MIN;
  const { w: dw, h: dh } = display;

  return (
    <div className="region-selector">
      <div className="region-selector-header">
        <h2>Select text area</h2>
        <span>Draw a box around the pattern text, then run OCR on that region.</span>
      </div>

      {isWide && (
        <p className="notice info region-selector-tip" role="note">
          Two-column layout detected. Select one column for better accuracy.
        </p>
      )}

      <div
        ref={containerRef}
        className="region-selector-canvas"
        style={{ cursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <img
          ref={imgRef}
          src={url}
          alt="Uploaded image preview"
          onLoad={onLoad}
          draggable={false}
        />

        {dw > 0 && dh > 0 && (
          <svg
            viewBox={`0 0 ${dw} ${dh}`}
            preserveAspectRatio="none"
            className="region-selector-overlay"
            aria-hidden="true"
          >
            {hasValidSel && sel && (
              <>
                <path
                  fillRule="evenodd"
                  fill="rgba(0,0,0,0.42)"
                  d={`M0,0 H${dw} V${dh} H0 Z M${sel.x},${sel.y} H${sel.x + sel.w} V${sel.y + sel.h} H${sel.x} Z`}
                />
                <rect x={sel.x} y={sel.y} width={sel.w} height={sel.h} fill="none" stroke="white" strokeWidth="1.5" />
                {/* Rule-of-thirds guides */}
                {[1, 2].map(n => (
                  <line key={`v${n}`} x1={sel.x + sel.w * n / 3} y1={sel.y} x2={sel.x + sel.w * n / 3} y2={sel.y + sel.h} stroke="rgba(255,255,255,0.25)" strokeWidth="0.75" />
                ))}
                {[1, 2].map(n => (
                  <line key={`h${n}`} x1={sel.x} y1={sel.y + sel.h * n / 3} x2={sel.x + sel.w} y2={sel.y + sel.h * n / 3} stroke="rgba(255,255,255,0.25)" strokeWidth="0.75" />
                ))}
                {/* Corner handles */}
                {([ ["tl", sel.x, sel.y], ["tr", sel.x + sel.w, sel.y], ["bl", sel.x, sel.y + sel.h], ["br", sel.x + sel.w, sel.y + sel.h] ] as [string, number, number][]).map(([name, cx, cy]) => (
                  <rect key={name} x={cx - 5} y={cy - 5} width={10} height={10} rx="2" fill="white" stroke="#245e74" strokeWidth="1.5" />
                ))}
              </>
            )}
          </svg>
        )}
      </div>

      <div className="region-selector-actions">
        <button type="button" className="region-selector-confirm" onClick={confirm}>
          {hasValidSel ? "Extract text from selection" : "Use full image"}
        </button>
        {hasValidSel && (
          <button type="button" className="region-selector-reset" onClick={resetSel}>
            Reset selection
          </button>
        )}
        <button type="button" className="region-selector-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
