import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, getInputProps } from "remotion";

interface Word {
    word: string;
    start: number;
    end: number;
}

export const KineticText: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Use words from props if available
    const { words = [] } = getInputProps() as { words: Word[] };

    // Find current words to display (show 1-2 words at a time)
    const currentTime = frame / fps;
    const visibleWords = words.filter((word) => {
        const isActive = currentTime >= word.start && currentTime <= word.end + 0.3;
        return isActive;
    });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "#000000",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 20,
                    textAlign: "center",
                }}
            >
                {visibleWords.map((word, index) => {
                    const startFrame = Math.floor(word.start * fps);

                    // Smooth slide-up animation
                    const opacity = interpolate(
                        frame - startFrame,
                        [0, 5],
                        [0, 1],
                        { extrapolateRight: "clamp" }
                    );

                    const translateY = interpolate(
                        frame - startFrame,
                        [0, 8],
                        [20, 0],
                        {
                            extrapolateRight: "clamp",
                            easing: Easing.out(Easing.quad)
                        }
                    );

                    return (
                        <div
                            key={`${word.word}-${word.start}`}
                            style={{
                                fontFamily: "'Inter', 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
                                fontSize: 100,
                                fontWeight: 800,
                                color: "#FFFFFF",
                                textTransform: "uppercase",
                                letterSpacing: "-2px",
                                textShadow: "0px 4px 10px rgba(0,0,0,0.6)",
                                opacity,
                                transform: `translateY(${translateY}px)`,
                            }}
                        >
                            {word.word}
                        </div>
                    );
                })}
            </div>
        </AbsoluteFill>
    );
};
