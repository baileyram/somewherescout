import "./index.css";
import { Composition } from "remotion";
import { WelcomeVideo } from "./WelcomeVideo";
import { KineticText } from "./KineticText";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WelcomeVideo"
        component={WelcomeVideo}
        durationInFrames={120}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          text: "THE PROTOCOL IS LIVE",
        }}
      />
      <Composition
        id="KineticText"
        component={KineticText}
        durationInFrames={300}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
