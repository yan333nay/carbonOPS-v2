import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface TextLine {
  content: string;
  color?: string;
}

interface AnimatedTextProps {
  lines: TextLine[];
  startFrame: number;
  position?: 'top' | 'center' | 'bottom';
  animation?: 'spring-up' | 'fade-zoom' | 'cut' | 'slide-left';
  fontSize?: number;
  delay?: number; // frames between lines
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  lines,
  startFrame,
  position = 'center',
  animation = 'spring-up',
  fontSize = 88,
  delay = 6,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const positionY: Record<string, string> = {
    top: '20%',
    center: '45%',
    bottom: '72%',
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: positionY[position],
        transform: 'translateY(-50%)',
        padding: '0 60px',
        textAlign: 'center',
      }}
    >
      {lines.map((line, i) => {
        const lineStart = startFrame + i * delay;
        const localFrame = Math.max(0, frame - lineStart);

        let opacity = 0;
        let translateY = 0;
        let scale = 1;

        if (animation === 'spring-up') {
          const prog = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 160 } });
          opacity = Math.min(prog * 2, 1);
          translateY = (1 - prog) * 30;
          scale = 0.92 + prog * 0.08;
        } else if (animation === 'fade-zoom') {
          const prog = spring({ frame: localFrame, fps, config: { damping: 18, stiffness: 120 } });
          opacity = Math.min(prog * 1.5, 1);
          scale = 0.95 + prog * 0.05;
        } else if (animation === 'cut') {
          opacity = localFrame >= 0 ? 1 : 0;
        } else if (animation === 'slide-left') {
          const prog = spring({ frame: localFrame, fps, config: { damping: 16, stiffness: 140 } });
          opacity = Math.min(prog * 2, 1);
          translateY = 0;
          scale = 1;
          // handled via translateX below
          const translateX = (1 - prog) * -80;
          return (
            <div
              key={i}
              style={{
                fontFamily: 'Anton, Impact, sans-serif',
                fontSize: `${fontSize}px`,
                fontWeight: 900,
                color: line.color || '#FFFFFF',
                lineHeight: 1.0,
                marginBottom: 8,
                opacity,
                transform: `translateX(${translateX}px) scale(${scale})`,
                textTransform: 'uppercase',
                letterSpacing: '-1px',
                textShadow: '0 2px 20px rgba(0,0,0,0.8)',
              }}
            >
              {line.content}
            </div>
          );
        }

        return (
          <div
            key={i}
            style={{
              fontFamily: 'Anton, Impact, sans-serif',
              fontSize: `${fontSize}px`,
              fontWeight: 900,
              color: line.color || '#FFFFFF',
              lineHeight: 1.0,
              marginBottom: 8,
              opacity,
              transform: `translateY(${translateY}px) scale(${scale})`,
              textTransform: 'uppercase',
              letterSpacing: '-1px',
              textShadow: '0 2px 20px rgba(0,0,0,0.8)',
            }}
          >
            {line.content}
          </div>
        );
      })}
    </div>
  );
};
