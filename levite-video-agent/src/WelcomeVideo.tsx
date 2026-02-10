import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const WelcomeVideo: React.FC<{ text?: string }> = ({
  text = "Waiting for input..."
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          color: "black",
          fontSize: 80,
          fontFamily: "sans-serif",
          fontWeight: "bold",
          opacity,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
