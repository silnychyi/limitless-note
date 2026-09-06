import type { ReactElement } from "react";

export function AppIconMark({ size }: { size: number }): ReactElement {
  const inset = Math.round(size * 0.22);
  const box = size - inset * 2;
  const radius = Math.round(size * 0.22);
  const innerRadius = Math.round(size * 0.08);
  const border = Math.max(2, Math.round(size * 0.03));
  const lineHeight = Math.max(2, Math.round(size * 0.035));
  const gap = Math.round(box * 0.08);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        borderRadius: radius,
      }}
    >
      <div
        style={{
          width: box,
          height: box,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: Math.round(box * 0.16),
          background: "#fffdf9",
          borderRadius: innerRadius,
          border: `${border}px solid #1c1917`,
        }}
      >
        <div
          style={{
            width: Math.round(box * 0.64),
            height: lineHeight,
            background: "#1c1917",
            borderRadius: lineHeight,
            marginBottom: gap,
          }}
        />
        <div
          style={{
            width: Math.round(box * 0.5),
            height: lineHeight,
            background: "#1c1917",
            borderRadius: lineHeight,
            marginBottom: gap,
          }}
        />
        <div
          style={{
            width: Math.round(box * 0.36),
            height: lineHeight,
            background: "#1c1917",
            borderRadius: lineHeight,
          }}
        />
      </div>
    </div>
  );
}
