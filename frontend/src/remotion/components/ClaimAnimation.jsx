import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from 'remotion';

const colors = {
  primary: '#1de4c6',
  secondary: '#00a28e',
  success: '#22c55e',
  dark: '#0a0a0a',
  white: '#ffffff',
  gray: '#6b7280',
};

export const ClaimAnimation = ({ amount, recipient }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Envelope opening animation
  const envelopeOpen = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Coins flying out
  const coinsProgress = interpolate(frame, [25, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Success state
  const successOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const successScale = spring({
    frame: Math.max(0, frame - 60),
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  // Coin positions
  const coins = [
    { delay: 0, endX: -120, endY: -180 },
    { delay: 5, endX: 0, endY: -200 },
    { delay: 10, endX: 120, endY: -180 },
    { delay: 8, endX: -80, endY: -150 },
    { delay: 12, endX: 80, endY: -160 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at center, #1f2937 0%, ${colors.dark} 100%)`,
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background particles */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.success}20 0%, transparent 70%)`,
          filter: 'blur(60px)',
          opacity: successOpacity,
        }}
      />

      {/* Envelope */}
      <div
        style={{
          position: 'relative',
          transform: `translateY(${interpolate(envelopeOpen, [0, 1], [0, 50])}px)`,
        }}
      >
        {/* Envelope body */}
        <div
          style={{
            width: 280,
            height: 180,
            background: 'linear-gradient(180deg, #374151 0%, #1f2937 100%)',
            borderRadius: 16,
            position: 'relative',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          {/* Inner glow */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at center top, ${colors.primary}40 0%, transparent 60%)`,
              opacity: envelopeOpen,
            }}
          />
        </div>

        {/* Envelope flap */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 280,
            height: 100,
            transformOrigin: 'top center',
            transform: `rotateX(${interpolate(envelopeOpen, [0, 1], [0, 180])}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(180deg, #4b5563 0%, #374151 100%)',
              clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
              borderRadius: '16px 16px 0 0',
            }}
          />
        </div>

        {/* Flying coins */}
        {coins.map((coin, i) => {
          const coinFrame = Math.max(0, frame - 25 - coin.delay);
          const progress = interpolate(coinFrame, [0, 40], [0, 1], {
            extrapolateRight: 'clamp',
          });
          const x = interpolate(progress, [0, 1], [0, coin.endX]);
          const y = interpolate(progress, [0, 0.5, 1], [0, coin.endY * 1.2, coin.endY]);
          const scale = interpolate(progress, [0, 0.5, 1], [0.3, 1.2, 1]);
          const opacity = interpolate(progress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.8]);
          const rotation = interpolate(progress, [0, 1], [0, 360]);

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(${x - 25}px, ${y - 25}px) scale(${scale}) rotate(${rotation}deg)`,
                opacity,
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                  boxShadow: `0 0 20px ${colors.primary}80`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 20,
                  color: colors.white,
                }}
              >
                CRO
              </div>
            </div>
          );
        })}
      </div>

      {/* Success message */}
      <div
        style={{
          position: 'absolute',
          bottom: 200,
          textAlign: 'center',
          opacity: successOpacity,
          transform: `scale(${successScale})`,
        }}
      >
        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: colors.success,
          }}
        >
          Claimed!
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: colors.white,
            marginTop: 16,
          }}
        >
          {amount} CRO
        </div>
        <div
          style={{
            fontSize: 24,
            color: colors.gray,
            marginTop: 12,
          }}
        >
          received by {recipient}
        </div>
      </div>

      {/* ChainDrop branding */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          fontSize: 24,
          fontWeight: 600,
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        ChainDrop
      </div>
    </AbsoluteFill>
  );
};
