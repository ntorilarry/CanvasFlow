"use client";

import {
  ShapeUtil,
  TLBaseShape,
  HTMLContainer,
  Geometry2d,
  Rectangle2d,
  T,
  TLResizeInfo,
  resizeBox,
} from "tldraw";

type CameraShape = TLBaseShape<
  "camera",
  {
    w: number;
    h: number;
  }
>;

export class CameraShapeUtil extends ShapeUtil<CameraShape> {
  static override type = "camera" as const;

  static override props = {
    w: T.number,
    h: T.number,
  };

  getDefaultProps(): CameraShape["props"] {
    return {
      w: 200,
      h: 150,
    };
  }

  getGeometry(shape: CameraShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override canResize() {
    return true;
  }

  override canEdit() {
    return false;
  }

  override onResize(shape: CameraShape, info: TLResizeInfo<CameraShape>) {
    return resizeBox(shape, info);
  }

  component() {
    return (
      <HTMLContainer
        style={{
          width: "100%",
          height: "100%",
          pointerEvents: "all",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            border: "2px dashed #3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -4,
              left: -4,
              width: 8,
              height: 8,
              backgroundColor: "#3b82f6",
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 8,
              height: 8,
              backgroundColor: "#3b82f6",
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -4,
              left: -4,
              width: 8,
              height: 8,
              backgroundColor: "#3b82f6",
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -4,
              right: -4,
              width: 8,
              height: 8,
              backgroundColor: "#3b82f6",
              borderRadius: 2,
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 4,
              left: 4,
              backgroundColor: "#3b82f6",
              color: "white",
              padding: "2px 6px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 500,
              pointerEvents: "none",
            }}
          >
            Screenshot Area
          </div>
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: CameraShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        fill="none"
        stroke="var(--color-selected)"
        strokeWidth={2}
      />
    );
  }
}

export type { CameraShape };
