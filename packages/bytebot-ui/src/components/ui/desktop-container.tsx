import React, { useRef, useEffect, useState } from "react";
import { VncViewer } from "@/components/vnc/VncViewer";
import { ScreenshotViewer } from "@/components/screenshot/ScreenshotViewer";
import { ScreenshotData } from "@/utils/screenshotUtils";
import {
  VirtualDesktopStatusHeader,
  VirtualDesktopStatus,
} from "@/components/VirtualDesktopStatusHeader";

interface DesktopContainerProps {
  children?: React.ReactNode;
  screenshot?: ScreenshotData | null;
  viewOnly?: boolean;
  className?: string;
  status?: VirtualDesktopStatus;
}

export const DesktopContainer: React.FC<DesktopContainerProps> = ({
  children,
  screenshot,
  viewOnly = false,
  className = "",
  status = "running",
}) => {
  const outerWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isMounted, setIsMounted] = useState(false);

  // Set isMounted to true after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate the container size on mount and window resize
  useEffect(() => {
    if (!isMounted) return;

    const updateSize = () => {
      const parent =
        outerWrapperRef.current?.parentElement || outerWrapperRef.current;
      if (!parent) return;

      const parentWidth = parent.offsetWidth;
      // Subtract header height (~48px) and margins from available height
      const parentHeight = Math.max(parent.offsetHeight - 52, 100);

      // Calculate the maximum size while maintaining 1280:960 aspect ratio
      let width, height;
      const aspectRatio = 1280 / 960;

      if (parentWidth / parentHeight > aspectRatio) {
        // Height is the limiting factor
        height = parentHeight;
        width = height * aspectRatio;
      } else {
        // Width is the limiting factor
        width = parentWidth;
        height = width / aspectRatio;
      }

      // Cap at maximum dimensions
      width = Math.min(width, 1280);
      height = Math.min(height, 960);

      setContainerSize({
        width: Math.round(width),
        height: Math.round(height),
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [isMounted]);

  return (
    <div
      ref={outerWrapperRef}
      className="flex h-full w-full items-center justify-center overflow-hidden"
    >
      <div
        style={
          containerSize.width > 0
            ? { width: `${containerSize.width}px`, maxWidth: "100%" }
            : { width: "100%" }
        }
        className={`border-bytebot-bronze-light-7 flex flex-col rounded-t-lg border-t border-r border-l ${className}`}
      >
        {/* Header */}
        <div className="bg-bytebot-bronze-light-2 border-bytebot-bronze-light-7 flex items-center justify-between rounded-t-lg border-b px-4 py-2">
          {/* Status Header */}
          <div className="flex items-center gap-2">
            <VirtualDesktopStatusHeader status={status} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">{children}</div>
        </div>

        <div ref={containerRef} className="flex overflow-hidden">
          <div
            style={{
              width:
                containerSize.width > 0
                  ? `${containerSize.width}px`
                  : "100%",
              height:
                containerSize.height > 0
                  ? `${containerSize.height}px`
                  : "auto",
              maxWidth: "100%",
            }}
          >
            {screenshot ? (
              <ScreenshotViewer
                screenshot={screenshot}
                className="h-full w-full"
              />
            ) : (
              <VncViewer viewOnly={viewOnly} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
