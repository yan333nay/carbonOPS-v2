import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { StickmanAcaoImediata } from './compositions/StickmanAcaoImediata';
import { StickmanMotivacional } from './compositions/StickmanMotivacional';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="StickmanMotivacional"
        component={StickmanMotivacional}
        durationInFrames={990}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{}}
      />
      <Composition
        id="StickmanAcaoImediata"
        component={StickmanAcaoImediata}
        durationInFrames={960}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{}}
      />
    </>
  );
};

registerRoot(RemotionRoot);
