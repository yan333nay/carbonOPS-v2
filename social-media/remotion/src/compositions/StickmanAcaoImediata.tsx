/**
 * StickmanAcaoImediata — Carbon Films
 * Template: stickman-acao-imediata-v1.yaml
 * Duração: 32s @ 30fps = 960 frames
 * Arco: Tensão → Identificação → Realidade → Decisão
 */
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimatedText } from '../components/AnimatedText';
import { GridBackground } from '../components/GridBackground';
import { Stickman } from '../components/Stickman';

const SCENES = [
  { id: 'cena-1', start: 0,   end: 90  },  // 0–3s:   HOOK
  { id: 'cena-2', start: 90,  end: 210 },  // 3–7s:   TENSÃO
  { id: 'cena-3', start: 210, end: 330 },  // 7–11s:  IDENTIFICAÇÃO
  { id: 'cena-4', start: 330, end: 480 },  // 11–16s: REALIDADE
  { id: 'cena-5', start: 480, end: 600 },  // 16–20s: ESPERA
  { id: 'cena-6', start: 600, end: 750 },  // 20–25s: QUEDA
  { id: 'cena-7', start: 750, end: 870 },  // 25–29s: DECISÃO
  { id: 'cena-8', start: 870, end: 960 },  // 29–32s: CTA
];

function getCurrentScene(frame: number) {
  return SCENES.find(s => frame >= s.start && frame < s.end) ?? SCENES[SCENES.length - 1];
}

function SceneFlash({ startFrame }: { startFrame: number }) {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  if (local < 0 || local > 6) return null;
  const opacity = interpolate(local, [0, 3, 6], [0.3, 0, 0], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ background: '#000', opacity }} />;
}

export const StickmanAcaoImediata: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const scene = getCurrentScene(frame);
  const sceneLocal = frame - scene.start;

  const stickmanSize = 180;
  const stickmanCenterX = width / 2 - stickmanSize / 2;

  const walkPhase = scene.id === 'cena-3' || scene.id === 'cena-7'
    ? Math.sin((sceneLocal / fps) * Math.PI * 2) * 0.5 + 0.5
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      <GridBackground width={width} height={height} gridSize={40} gridColor="#1A1A1A" gridOpacity={0.4} />

      {/* ---- CENA 1: HOOK — tenso, olhando relógio ---- */}
      {scene.id === 'cena-1' && (
        <AbsoluteFill>
          <div style={{ position: 'absolute', bottom: 300, left: stickmanCenterX }}>
            <Stickman pose="stressed" color="#FFFFFF" size={stickmanSize} />
          </div>
          <AnimatedText
            lines={[
              { content: 'VOCÊ AINDA', color: '#FFFFFF' },
              { content: 'NÃO COMEÇOU?', color: '#FF0000' },
            ]}
            startFrame={6}
            position="top"
            animation="fade-zoom"
            fontSize={86}
          />
        </AbsoluteFill>
      )}

      {/* ---- CENA 2: TENSÃO — esperando ---- */}
      {scene.id === 'cena-2' && (
        <AbsoluteFill>
          <div style={{ position: 'absolute', bottom: 300, left: stickmanCenterX }}>
            <Stickman pose="waiting" color="#FFFFFF" size={stickmanSize} />
          </div>
          <AnimatedText
            lines={[
              { content: 'ENQUANTO ESPERA', color: '#FFFFFF' },
              { content: 'O MOMENTO CERTO', color: '#FF0000' },
            ]}
            startFrame={scene.start + 8}
            position="top"
            animation="spring-up"
            fontSize={80}
            delay={10}
          />
        </AbsoluteFill>
      )}

      {/* ---- CENA 3: IDENTIFICAÇÃO — andando confiante ---- */}
      {scene.id === 'cena-3' && (
        <AbsoluteFill>
          <div style={{ position: 'absolute', bottom: 300, left: stickmanCenterX }}>
            <Stickman pose="walking" color="#FFFFFF" size={stickmanSize} walkPhase={walkPhase} />
          </div>
          <AnimatedText
            lines={[
              { content: 'SEU CONCORRENTE', color: '#FFFFFF' },
              { content: 'JÁ ESTÁ AGINDO', color: '#FF0000' },
            ]}
            startFrame={scene.start + 8}
            position="top"
            animation="slide-left"
            fontSize={82}
          />
        </AbsoluteFill>
      )}

      {/* ---- CENA 4: REALIDADE — apontando (instrução) ---- */}
      {scene.id === 'cena-4' && (
        <AbsoluteFill>
          <div style={{ position: 'absolute', bottom: 300, left: stickmanCenterX }}>
            <Stickman pose="pointing" color="#FFFFFF" size={stickmanSize} />
          </div>
          <AnimatedText
            lines={[
              { content: 'AÇÃO', color: '#FF0000' },
              { content: 'IMPERFEITA VENCE', color: '#FFFFFF' },
              { content: 'PLANEJAMENTO', color: '#FFFFFF' },
              { content: 'ETERNO', color: '#FF0000' },
            ]}
            startFrame={scene.start + 8}
            position="top"
            animation="spring-up"
            fontSize={72}
            delay={8}
          />
        </AbsoluteFill>
      )}

      {/* ---- CENA 5: ESPERA — planejando (procrastinação) ---- */}
      {scene.id === 'cena-5' && (
        <AbsoluteFill>
          <div style={{ position: 'absolute', bottom: 300, left: stickmanCenterX }}>
            <Stickman pose="planning" color="#FFFFFF" size={stickmanSize} />
          </div>
          <AnimatedText
            lines={[
              { content: 'MAS VOCÊ ESPERA', color: '#FFFFFF' },
              { content: 'O ALINHAMENTO', color: '#FF0000' },
            ]}
            startFrame={scene.start + 8}
            position="top"
            animation="fade-zoom"
            fontSize={84}
            delay={12}
          />
        </AbsoluteFill>
      )}

      {/* ---- CENA 6: QUEDA — triste/derrotado ---- */}
      {scene.id === 'cena-6' && (
        <AbsoluteFill>
          <div style={{ position: 'absolute', bottom: 280, left: stickmanCenterX }}>
            <Stickman pose="sad" color="#FFFFFF" size={stickmanSize} />
          </div>
          <AnimatedText
            lines={[
              { content: 'E O MERCADO', color: '#FFFFFF' },
              { content: 'TE ULTRAPASSA', color: '#FF0000' },
            ]}
            startFrame={scene.start + 10}
            position="top"
            animation="fade-zoom"
            fontSize={88}
            delay={18}
          />
        </AbsoluteFill>
      )}

      {/* ---- CENA 7: DECISÃO — andando (ação final) ---- */}
      {scene.id === 'cena-7' && (
        <AbsoluteFill>
          <div style={{ position: 'absolute', bottom: 300, left: stickmanCenterX }}>
            <Stickman pose="walking" color="#FFFFFF" size={stickmanSize} walkPhase={walkPhase} sparkles />
          </div>
          <AnimatedText
            lines={[
              { content: 'HORA DE', color: '#FFFFFF' },
              { content: 'AGIR AGORA', color: '#FF0000' },
            ]}
            startFrame={scene.start + 8}
            position="top"
            animation="spring-up"
            fontSize={96}
            delay={10}
          />
        </AbsoluteFill>
      )}

      {/* ---- CENA 8: CTA — confiante ---- */}
      {scene.id === 'cena-8' && (
        <AbsoluteFill>
          <div style={{ position: 'absolute', bottom: 300, left: stickmanCenterX }}>
            <Stickman pose="confident" color="#FFFFFF" size={stickmanSize} sparkles />
          </div>
          <AnimatedText
            lines={[
              { content: 'CHAMA A', color: '#FFFFFF' },
              { content: 'CARBON', color: '#FF0000' },
            ]}
            startFrame={scene.start + 8}
            position="top"
            animation="fade-zoom"
            fontSize={100}
            delay={10}
          />
        </AbsoluteFill>
      )}

      {/* Brand footer */}
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

      {SCENES.map(s => (
        <SceneFlash key={s.id} startFrame={s.start} />
      ))}
    </AbsoluteFill>
  );
};
