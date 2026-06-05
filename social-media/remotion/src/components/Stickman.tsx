import React from 'react';

export type StickmanPose =
  | 'confident'
  | 'waiting'
  | 'pointing'
  | 'walking'
  | 'planning'
  | 'sad'
  | 'stressed'
  | 'confused';

interface StickmanProps {
  pose: StickmanPose;
  color?: string;
  size?: number;
  walkPhase?: number; // 0-1 for walking animation
  sweatDrops?: boolean;
  sparkles?: boolean;
}

// ---------------------------------------------------------------
// Extras — sparkles, sweat drops, props
// ---------------------------------------------------------------
const Sparkles: React.FC<{ color: string }> = ({ color }) => (
  <>
    {[
      { cx: 18, cy: 10, r: 3 },
      { cx: 82, cy: 8, r: 2 },
      { cx: 72, cy: 22, r: 2.5 },
      { cx: 12, cy: 28, r: 2 },
      { cx: 88, cy: 35, r: 3 },
    ].map((s, i) => (
      <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={color} opacity={0.9} />
    ))}
    {/* star sparkles */}
    {[
      { x: 15, y: 18, size: 5 },
      { x: 80, y: 15, size: 4 },
    ].map((s, i) => (
      <g key={`star-${i}`} transform={`translate(${s.x}, ${s.y})`}>
        <line x1={0} y1={-s.size} x2={0} y2={s.size} stroke={color} strokeWidth={1.5} />
        <line x1={-s.size} y1={0} x2={s.size} y2={0} stroke={color} strokeWidth={1.5} />
        <line x1={-s.size * 0.7} y1={-s.size * 0.7} x2={s.size * 0.7} y2={s.size * 0.7} stroke={color} strokeWidth={1} />
        <line x1={s.size * 0.7} y1={-s.size * 0.7} x2={-s.size * 0.7} y2={s.size * 0.7} stroke={color} strokeWidth={1} />
      </g>
    ))}
  </>
);

const SweatDrops: React.FC<{ color: string }> = ({ color }) => (
  <>
    {[
      { cx: 72, cy: 20, ry: 5, rx: 3 },
      { cx: 80, cy: 32, ry: 4, rx: 2.5 },
      { cx: 78, cy: 14, ry: 3, rx: 2 },
    ].map((d, i) => (
      <ellipse key={i} cx={d.cx} cy={d.cy} rx={d.rx} ry={d.ry} fill="#4499FF" opacity={0.8} />
    ))}
  </>
);

const Clock: React.FC<{ cx: number; cy: number; r: number; color: string }> = ({ cx, cy, r, color }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={2} fill="none" />
    <line x1={cx} y1={cy} x2={cx} y2={cy - r * 0.6} stroke={color} strokeWidth={1.5} />
    <line x1={cx} y1={cy} x2={cx + r * 0.4} y2={cy} stroke={color} strokeWidth={1.5} />
  </g>
);

const Calendar: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect x={-10} y={-8} width={20} height={16} rx={2} stroke={color} strokeWidth={2} fill="none" />
    <line x1={-10} y1={-2} x2={10} y2={-2} stroke={color} strokeWidth={1.5} />
    <line x1={-4} y1={-8} x2={-4} y2={-4} stroke={color} strokeWidth={1.5} />
    <line x1={4} y1={-8} x2={4} y2={-4} stroke={color} strokeWidth={1.5} />
    {/* grid lines inside */}
    <line x1={-6} y1={2} x2={6} y2={2} stroke={color} strokeWidth={1} opacity={0.5} />
    <line x1={-6} y1={5} x2={6} y2={5} stroke={color} strokeWidth={1} opacity={0.5} />
  </g>
);

const StepBlock: React.FC<{ color: string }> = ({ color }) => (
  <rect x={48} y={104} width={22} height={8} rx={1} fill={color} opacity={0.6} />
);

// ---------------------------------------------------------------
// Main Stickman
// ---------------------------------------------------------------
export const Stickman: React.FC<StickmanProps> = ({
  pose,
  color = '#FFFFFF',
  size = 200,
  walkPhase = 0,
  sweatDrops = false,
  sparkles = false,
}) => {
  // ViewBox: 100 x 130. Stickman center at x=50.
  // Head: cy=18 r=13, Body: (50,31)→(50,72)
  // Shoulders at y=48, Hips at y=72

  const strokeW = 3;
  const headCy = 18;
  const headR = 13;
  const bodyTop = headCy + headR + 1; // ~32
  const bodyBot = 72;
  const shoulderY = 48;
  const hipY = bodyBot;

  // Pose configurations: [leftArm, rightArm, leftLeg, rightLeg]
  // Each: { x1, y1, x2, y2 } from joint point
  const poseConfigs: Record<StickmanPose, {
    leftArm: [number, number, number, number];
    rightArm: [number, number, number, number];
    leftLeg: [number, number, number, number];
    rightLeg: [number, number, number, number];
    extras?: React.ReactNode;
  }> = {
    confident: {
      leftArm:  [50, shoulderY, 28, 62],
      rightArm: [50, shoulderY, 72, 58],
      leftLeg:  [50, hipY, 35, 108],
      rightLeg: [50, hipY, 65, 104], // foot on block
      extras: <StepBlock color={color} />,
    },
    waiting: {
      leftArm:  [50, shoulderY, 30, 68],
      rightArm: [50, shoulderY, 70, 68],
      leftLeg:  [50, hipY, 38, 110],
      rightLeg: [50, hipY, 62, 110],
      extras: <Clock cx={50} cy={50} r={10} color={color} />,
    },
    pointing: {
      leftArm:  [50, shoulderY, 28, 62],
      rightArm: [50, shoulderY, 74, 36], // raised up
      leftLeg:  [50, hipY, 36, 110],
      rightLeg: [50, hipY, 64, 110],
      extras: (
        // fingertip
        <circle cx={78} cy={31} r={2.5} fill={color} />
      ),
    },
    walking: {
      // animated via walkPhase
      leftArm:  [50, shoulderY, 26 + walkPhase * 8, 62 - walkPhase * 5],
      rightArm: [50, shoulderY, 74 - walkPhase * 8, 62 - walkPhase * 5],
      leftLeg:  [50, hipY, 30 + walkPhase * 14, 108 - walkPhase * 8],
      rightLeg: [50, hipY, 70 - walkPhase * 14, 108 + walkPhase * 8],
    },
    planning: {
      leftArm:  [50, shoulderY, 30, 58],
      rightArm: [50, shoulderY, 70, 58],
      leftLeg:  [50, hipY, 36, 110],
      rightLeg: [50, hipY, 64, 110],
      extras: <Calendar x={50} y={60} color={color} />,
    },
    sad: {
      // sitting down: legs out to sides, body slightly shorter, head drooped
      leftArm:  [50, shoulderY, 28, 66],
      rightArm: [50, shoulderY, 72, 66],
      leftLeg:  [50, hipY, 20, 88],
      rightLeg: [50, hipY, 80, 88],
    },
    stressed: {
      leftArm:  [50, shoulderY, 28, 30], // both hands to head
      rightArm: [50, shoulderY, 72, 30],
      leftLeg:  [50, hipY, 36, 110],
      rightLeg: [50, hipY, 64, 110],
    },
    confused: {
      leftArm:  [50, shoulderY, 30, 66],
      rightArm: [50, shoulderY, 70, 30], // hand to head
      leftLeg:  [50, hipY, 36, 110],
      rightLeg: [50, hipY, 64, 110],
    },
  };

  const config = poseConfigs[pose];

  // Head tilt for sad/confused
  const headTilt = pose === 'sad' ? 12 : pose === 'confused' ? -8 : 0;
  const bodyBotY = pose === 'sad' ? hipY - 8 : bodyBot;

  return (
    <svg
      viewBox="0 0 100 130"
      width={size}
      height={size * 1.3}
      style={{ overflow: 'visible' }}
    >
      {/* Sparkles */}
      {sparkles && <Sparkles color={color} />}
      {/* Sweat drops */}
      {sweatDrops && <SweatDrops color={color} />}

      {/* Head */}
      <circle
        cx={50}
        cy={headCy}
        r={headR}
        stroke={color}
        strokeWidth={strokeW}
        fill="none"
        transform={headTilt !== 0 ? `rotate(${headTilt}, 50, ${headCy})` : undefined}
      />

      {/* Body */}
      <line
        x1={50} y1={bodyTop}
        x2={50} y2={bodyBotY}
        stroke={color}
        strokeWidth={strokeW}
        strokeLinecap="round"
      />

      {/* Left arm */}
      <line
        x1={config.leftArm[0]} y1={config.leftArm[1]}
        x2={config.leftArm[2]} y2={config.leftArm[3]}
        stroke={color}
        strokeWidth={strokeW}
        strokeLinecap="round"
      />

      {/* Right arm */}
      <line
        x1={config.rightArm[0]} y1={config.rightArm[1]}
        x2={config.rightArm[2]} y2={config.rightArm[3]}
        stroke={color}
        strokeWidth={strokeW}
        strokeLinecap="round"
      />

      {/* Left leg */}
      <line
        x1={config.leftLeg[0]} y1={config.leftLeg[1]}
        x2={config.leftLeg[2]} y2={config.leftLeg[3]}
        stroke={color}
        strokeWidth={strokeW}
        strokeLinecap="round"
      />

      {/* Right leg */}
      <line
        x1={config.rightLeg[0]} y1={config.rightLeg[1]}
        x2={config.rightLeg[2]} y2={config.rightLeg[3]}
        stroke={color}
        strokeWidth={strokeW}
        strokeLinecap="round"
      />

      {/* Extra elements (clock, calendar, block, etc.) */}
      {config.extras}
    </svg>
  );
};
