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
  dark: '#0a0a0a',
  white: '#ffffff',
  gray: '#6b7280',
};

export const PaymentSent = ({ amount, amountCro, recipient }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const scaleIn = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const checkmarkProgress = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const textOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ringScale = interpolate(frame, [0, 30], [0.5, 1.2], {
    extrapolateRight: 'clamp',
  });

  const ringOpacity = interpolate(frame, [0, 20, 40], [0, 0.6, 0], {
    extrapolateRight: 'clamp',
  });

  // Particle effects
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const delay = i * 2;
    const particleFrame = Math.max(0, frame - 20 - delay);
    const distance = interpolate(particleFrame, [0, 30], [0, 200], {
      extrapolateRight: 'clamp',
    });
    const opacity = interpolate(particleFrame, [0, 10, 30], [0, 1, 0], {
      extrapolateRight: 'clamp',
    });

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      opacity,
    };
  });

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
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.primary}30 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />

      {/* Expanding ring */}
      <div
        style={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          border: `4px solid ${colors.primary}`,
          transform: `scale(${ringScale})`,
          opacity: ringOpacity,
        }}
      />

      {/* Particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: colors.primary,
            transform: `translate(${p.x}px, ${p.y}px)`,
            opacity: p.opacity,
            boxShadow: `0 0 10px ${colors.primary}`,
          }}
        />
      ))}

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `scale(${scaleIn})`,
        }}
      >
        {/* Success circle */}
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 60px ${colors.primary}60`,
          }}
        >
          {/* Checkmark SVG */}
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke={colors.white}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={24}
              strokeDashoffset={24 * (1 - checkmarkProgress)}
            />
          </svg>
        </div>

        {/* Text */}
        <div
          style={{
            marginTop: 40,
            textAlign: 'center',
            opacity: textOpacity,
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: colors.white,
            }}
          >
            Payment Sent!
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: colors.white,
              marginTop: 16,
            }}
          >
            ${amount}
          </div>
          <div
            style={{
              fontSize: 28,
              color: colors.primary,
              marginTop: 8,
            }}
          >
            {amountCro} CRO
          </div>
          <div
            style={{
              fontSize: 24,
              color: colors.gray,
              marginTop: 24,
            }}
          >
            to {recipient}
          </div>
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
