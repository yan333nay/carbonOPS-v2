/**
 * StickmanMotivacional — Carbon Films
 * Template: stickman-motivacional-v1.yaml
 * Duração: 33s @ 30fps = 990 frames
 * Arco: Idealização → Instrução → Ilusão → Queda → Reflexão
 */
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { AnimatedText } from '../components/AnimatedText';
import { GridBackground } from '../components/GridBackground';
import { Stickman } from '../components/Stickman';

// ---------------------------------------------------------------
// Cenas — mapeamento de frames (30fps)
// ---------------------------------------------------------------
const SCENES = [
  { id: 'cena-1', start: 0,   end: 90,  label: 'HOOK' },         // 0–3s
  { id: 'cena-2', start: 90,  end: 180, label: 'QUEBRA' },        // 3–6s
  { id: 'cena-3', start: 180, end: 300, label: 'IDEIA' },         // 6–10s
  { id: 'cena-4', start: 300, end: 420, label: 'ACAO' },          // 10–14s
  { id: 'cena-5', start: 420, end: 540, label: 'ILUSAO' },        // 14–18s
  { id: 'cena-6', start: 540, end: 690, label: 'FRUSTRACAO' },    // 18–23s
  { id: 'cena-7', start: 690, end: 840, label: 'CONSEQUENCIA' },  // 23–28s
  { id: 'cena-8', start: 840, end: 990, label: 'FINAL' },         // 28–33s
];

function getCurrentScene(frame: number) {
  return SCENES.find(s => frame >= s.start && frame < s.end) ?? SCENES[SCENES.length - 1];
}

// ---------------------------------------------------------------
// Transição entre cenas
// ---------------------------------------------------------------
function SceneTransition({ startFrame, fps }: { startFrame: number; fps: number }) {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  if (local < 0 || local > 8) return null;
  const opacity = interpolate(local, [0, 4, 8], [0.5, 0, 0], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#000000', opacity }} />
  );
}

// ---------------------------------------------------------------
// Stickman com animação de câmera (zoom/tracking)
// ---------------------------------------------------------------
interface CameraProps {
  frame: number;
  fps: number;
  sceneStart: number;
  sceneLocalFrame: number;
  zoomIn?: boolean;
  zoomOut?: boolean;
  trackingX?: number;
}

function useCameraTransform({ sceneLocalFrame, fps, zoomIn, zoomOut, trackingX }: CameraProps) {
  let scale = 1;
  let translateX = 0;
  let translateY = 0;

  if (zoomIn) {
    const prog = spring({ frame: sceneLocalFrame, fps, config: { damping: 40, stiffness: 30 } });
    scale = 1 + prog * 0.04;
  }
  if (zoomOut) {
    const prog = spring({ frame: sceneLocalFrame, fps, config: { damping: 40, stiffness: 30 } });
    scale = 1 - prog * 0.03;
  }
  if (trackingX) {
    const prog = spring({ frame: sceneLocalFrame, fps, config: { damping: 30, stiffness: 40 } });
    translateX = prog * trackingX;
  }

  return `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
}

// ---------------------------------------------------------------
// Composição principal
// ---------------------------------------------------------------
export const StickmanMotivacional: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const scene = getCurrentScene(frame);
  const sceneLocal = frame - scene.start;

  const stickmanSize = 180;
  const stickmanCenterX = width / 2 - stickmanSize / 2;

  // Cena 4: walking phase animation (oscila entre 0 e 1)
  const walkPhase = scene.id === 'cena-4'
    ? Math.sin((sceneLocal / fps) * Math.PI * 2) * 0.5 + 0.5
    : 0;

  // Câmera por cena
  const cameraTransforms: Record<string, { zoomIn?: boolean; zoomOut?: boolean; trackingX?: number }> = {
    'cena-1': { zoomIn: true },
    'cena-2': {},
    'cena-3': { zoomIn: true },
    'cena-4': { trackingX: 10 },
    'cena-5': {},
    'cena-6': { zoomIn: true },
    'cena-7': {},
    'cena-8': { zoomOut: true },
  };

  const cameraTransform = useCameraTransform({
    frame,
    fps,
    sceneStart: scene.start,
    sceneLocalFrame: sceneLocal,
    ...cameraTransforms[scene.id],
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Grid background */}
      <GridBackground width={width} height={height} gridSize={40} gridColor="#1A1A1A" gridOpacity={0.4} />

      {/* ---- CENA 1: HOOK — confiante no bloco com sparkles ---- */}
      {scene.id === 'cena-1' && (
        <AbsoluteFill style={{ transform: cameraTransform }}>
          <div style={{ position: 'absolute', bottom: 300, left: stickmanCenterX }}>
            <Stickman pose="confident" color="#FFFFFF" size={stickmanSize} sparkles />
          </div>
          <AnimatedText
            lines={[
              { content: 'PERFEITO', color: '#FFFFFF' },
              { content: 'NA SUA VIDA', color: '#FF0000' },
            ]}
            startFrame={8}
            position="top"
            animation="fade-zoom"
            fontSize={92}
          />
        </AbsoluteFill>
      )}

      {/* ---- CENA 2: QUEBRA — esperando com relógio ---- */}
      {scene.id === 'cena-2' && (
        <AbsoluteFill style={{ transform: cameraTransform }}>
          <div style={{ position: 'absolute', bottom: 300, left: stickmanCenterX }}>
            <Stickman pose="waiting" color="#FFFFFF" size={stickmanSize} />
          </div>
          <AnimatedText
            lines={[
              { content: 'E ENQUANTO', color: '#FFFFFF' },
              { content: 'VOCÊ ESPERA', color: '#FF0000' },
            ]}
            startFrame={scene.start + 2}
            position="top"
            animation="cut"
            fontSize={88}
          />
        </AbsoluteFill>
      )}

      {/* ---- CENA 3: IDEIA — dedo levantado ---- */}
      {scene.id === 'cena-3' && (
        <AbsoluteFill style={{ transform: cameraTransform }}>
          <div style={{ position: 'absolute', bottom: 300, left: stickmanCenterX }}>
            <Stickman pose="pointing" color="#FFFFFF" size={stickmanSize} />
          </div>
          <AnimatedText
            lines={[
              { content: 'ENTÃO BOTA UMA', color: '#FFFFFF' },
              { content: 'COISA NA CABEÇA', color: '#FF0000' },
            ]}
            startFrame={scene.start + 9}
            position="top"
            animation="spring-up"
            fontSize={80}
            delay={8}
          />
        </AbsoluteFill>
      )}

      {/* ---- CENA 4: AÇÃO — andando ---- */}
      {scene.id === 'cena-4' && (
        <AbsoluteFill style={{ transform: cameraTransform }}>
          <div style={{
            position: 'absolute',
            bottom: 300,
            left: stickmanCenterX,
            transition: 'left 0.1s',
          }}>
            <Stickman pose="walking" color="#FFFFFF" size={stickmanSize} walkPhase={walkPhase} />
          </div>
          <AnimatedText
            lines={[
              { content: 'MAS COMEÇAR', color: '#FFFFFF' },
              { content: 'JÁ É A CONDIÇÃO', color: '#FF0000' },
            ]}
            startFrame={scene.start + 9}
            position="top"
            animation="slide-left"
            fontSize={82}
          />
        </AbsoluteFill>
      )}

      {/* ---- CENA 5: ILUSÃO — segurando calendário ---- */}
      {scene.id === 'cena-5' && (
        <AbsoluteFill>
          <div style={{ position: 'absolute', bottom: 300, left: stickmanCenterX }}>
            <Stickman pose="planning" color="#FFFFFF" size={stickmanSize} />
          </div>
          <AnimatedText
            lines={[
              { content: 'A SE ALINHAR', color: '#FF0000' },
            ]}
            startFrame={scene.start + 10}
            position="top"
            animation="fade-zoom"
            fontSize={100}
          />
        </AbsoluteFill>
      )}

      {/* ---- CENA 6: FRUSTRAÇÃO — sentado triste (zoom dramático) ---- */}
      {scene.id === 'cena-6' && (
        <AbsoluteFill style={{ transform: cameraTransform }}>
          <div style={{ position: 'absolute', bottom: 280, left: stickmanCenterX }}>
            <Stickman pose="sad" color="#FFFFFF" size={stickmanSize} />
          </div>
          <AnimatedText
            lines={[
              { content: 'E VOCÊ NUNCA', color: '#FFFFFF' },
              { content: 'VAI COMEÇAR', color: '#FF0000' },
            ]}
            startFrame={scene.start + 10}
            position="top"
            animation="fade-zoom"
            fontSize={90}
            delay={15}
          />
        </AbsoluteFill>
      )}

      {/* ---- CENA 7: CONSEQUÊNCIA — estressado com gotas ---- */}
      {scene.id === 'cena-7' && (
        <AbsoluteFill>
          <div style={{ position: 'absolute', bottom: 300, left: stickmanCenterX }}>
            <Stickman pose="stressed" color="#FFFFFF" size={stickmanSize} sweatDrops />
          </div>
          <AnimatedText
            lines={[
              { content: 'SÓ FICAR SE', color: '#FFFFFF' },
              { content: 'LAMENTANDO', color: '#FF0000' },
            ]}
            startFrame={scene.start + 5}
            position="top"
            animation="cut"
            fontSize={90}
          />
        </AbsoluteFill>
      )}

      {/* ---- CENA 8: FINAL — confuso (zoom out) ---- */}
      {scene.id === 'cena-8' && (
        <AbsoluteFill style={{ transform: cameraTransform }}>
          <div style={{ position: 'absolute', bottom: 300, left: stickmanCenterX }}>
            <Stickman pose="confused" color="#FFFFFF" size={stickmanSize} />
          </div>
          <AnimatedText
            lines={[
              { content: 'POR CONTA', color: '#FFFFFF' },
              { content: 'PRÓPRIA!', color: '#FF0000' },
            ]}
            startFrame={scene.start + 8}
            position="top"
            animation="fade-zoom"
            fontSize={96}
            delay={12}
          />
        </AbsoluteFill>
      )}

      {/* ---- Brand footer ---- */}
      <div style={{
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: 'monospace',
        fontSize: 28,
        color: '#666',
        letterSpacing: 4,
        textTransform: 'uppercase',
      }}>
        @carbonfilms.sc
      </div>

      {/* ---- Transições entre cenas ---- */}
      {SCENES.map(s => (
        <SceneTransition key={s.id} startFrame={s.start} fps={fps} />
      ))}
    </AbsoluteFill>
  );
};
