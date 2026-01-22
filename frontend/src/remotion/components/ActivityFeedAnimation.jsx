import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
  Sequence,
} from 'remotion';

const colors = {
  primary: '#1de4c6',
  secondary: '#00a28e',
  success: '#22c55e',
  warning: '#f59e0b',
  dark: '#0a0a0a',
  white: '#ffffff',
  gray: '#6b7280',
};

const TransactionCard = ({ transaction, index, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const slideIn = spring({
    frame: localFrame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(slideIn, [0, 1], [100, 0]);

  const isPending = transaction.status === 'pending';
  const statusColor = isPending ? colors.warning : colors.success;

  // Pulsing effect for pending
  const pulseScale = isPending
    ? 1 + Math.sin(frame * 0.15) * 0.02
    : 1;

  return (
    <div
      style={{
        transform: `translateY(${translateY}px) scale(${pulseScale})`,
        opacity,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          background: 'rgba(31, 41, 55, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: 20,
          padding: 24,
          border: `1px solid ${isPending ? colors.warning + '40' : colors.success + '40'}`,
          boxShadow: isPending
            ? `0 0 30px ${colors.warning}20`
            : `0 0 20px ${colors.success}20`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: Icon + Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Status icon */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: `${statusColor}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isPending ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke={statusColor} strokeWidth={2} />
                  <path d="M12 6v6l4 2" stroke={statusColor} strokeWidth={2} strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke={statusColor}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>

            {/* Details */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    color: colors.white,
                    fontSize: 20,
                    fontWeight: 600,
                    fontFamily: 'monospace',
                  }}
                >
                  {transaction.sender}
                </span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 5l7 7-7 7"
                    stroke={colors.primary}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span style={{ color: colors.gray, fontSize: 18 }}>
                  {transaction.recipient}
                </span>
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    color: statusColor,
                    fontSize: 14,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  {transaction.status}
                </span>
                <span style={{ color: colors.gray, fontSize: 14 }}>
                  • just now
                </span>
              </div>
            </div>
          </div>

          {/* Right: Amount */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: colors.white,
              }}
            >
              ${transaction.amount}
            </div>
            <div style={{ color: colors.primary, fontSize: 16, marginTop: 4 }}>
              CRO
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ActivityFeedAnimation = ({ transactions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1]);

  // Live indicator pulse
  const livePulse = Math.sin(frame * 0.2) * 0.5 + 0.5;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${colors.dark} 0%, #111827 50%, ${colors.dark} 100%)`,
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: 40,
      }}
    >
      {/* Background gradient orbs */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.primary}15 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 300,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.secondary}15 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />

      {/* Header */}
      <div
        style={{
          opacity: headerOpacity,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ChainDrop
        </div>
        <div
          style={{
            fontSize: 28,
            color: colors.white,
            marginTop: 16,
            fontWeight: 600,
          }}
        >
          Live Activity
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 12,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: colors.success,
              boxShadow: `0 0 ${10 + livePulse * 10}px ${colors.success}`,
            }}
          />
          <span style={{ color: colors.gray, fontSize: 18 }}>
            Cronos Testnet
          </span>
        </div>
      </div>

      {/* Stats Bar */}
      <div
        style={{
          display: 'flex',
          gap: 20,
          marginBottom: 40,
          opacity: interpolate(frame, [10, 30], [0, 1]),
        }}
      >
        {[
          { label: 'Total', value: '127', color: colors.white },
          { label: 'Claimed', value: '89', color: colors.success },
          { label: 'Pending', value: '38', color: colors.warning },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: 'rgba(31, 41, 55, 0.6)',
              borderRadius: 16,
              padding: '20px 24px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: stat.color,
              }}
            >
              {stat.value}
            </div>
            <div style={{ color: colors.gray, fontSize: 16, marginTop: 4 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Transaction List */}
      <div style={{ flex: 1 }}>
        {transactions.map((tx, index) => (
          <TransactionCard
            key={index}
            transaction={tx}
            index={index}
            startFrame={30 + index * 25}
          />
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: 'center',
          marginTop: 40,
          opacity: interpolate(frame, [100, 120], [0, 1]),
        }}
      >
        <div style={{ color: colors.gray, fontSize: 18 }}>
          Send crypto to anyone • No wallet required
        </div>
      </div>
    </AbsoluteFill>
  );
};
