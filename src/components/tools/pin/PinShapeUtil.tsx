"use client";

import {
  ShapeUtil,
  TLBaseShape,
  HTMLContainer,
  Geometry2d,
  Rectangle2d,
  T,
} from "tldraw";

// Define pin shape type inline
type PinShape = TLBaseShape<
  "pin",
  {
    w: number;
    h: number;
    color: string;
  }
>;

export class PinShapeUtil extends ShapeUtil<PinShape> {
  static override type = "pin" as const;

  static override props = {
    w: T.number,
    h: T.number,
    color: T.string,
  };

  getDefaultProps(): PinShape["props"] {
    return {
      w: 32,
      h: 48,
      color: "#ef4444",
    };
  }

  getGeometry(shape: PinShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override canResize() {
    return false;
  }

  override canEdit() {
    return false;
  }

  component(shape: PinShape) {
    return (
      <HTMLContainer
        style={{
          pointerEvents: "all",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width={shape.props.w}
          height={shape.props.h}
          viewBox="0 0 32 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" }}
        >
          {/* Pin head (flat top, rounded) */}
          <ellipse cx="16" cy="12" rx="10" ry="8" fill={shape.props.color} />
          <path
            d="M6 12 L16 12 L26 12 L16 48 Z"
            fill={shape.props.color}
          />
          {/* Pin shaft highlight */}
          <path
            d="M10 12 L16 44 L22 12"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Head highlight */}
          <ellipse cx="16" cy="10" rx="5" ry="4" fill="rgba(255,255,255,0.5)" />
        </svg>
      </HTMLContainer>
    );
  }

  indicator(shape: PinShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={4}
        fill="none"
        stroke="var(--color-selected)"
        strokeWidth={2}
      />
    );
  }
}

export type { PinShape };
