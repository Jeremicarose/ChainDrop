import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
} from 'remotion';

// ChainDrop brand colors
const colors = {
  primary: '#1de4c6',
  secondary: '#00a28e',
  dark: '#0a0a0a',
  white: '#ffffff',
  gray: '#6b7280',
  success: '#22c55e',
};

// Wallet Component
const Wallet = ({ label, address, side, isActive, showGlow }) => {
  const frame = useCurrentFrame();

  const glowOpacity = showGlow
    ? interpolate(Math.sin(frame * 0.2), [-1, 1], [0.3, 0.8])
    : 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {showGlow && (
        <div
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.primary}40 0%, transparent 70%)`,
            opacity: glowOpacity,
            filter: 'blur(20px)',
          }}
        />
      )}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 24,
          background: isActive
            ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
            : '#1f2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isActive
            ? `0 0 40px ${colors.primary}60`
            : '0 4px 20px rgba(0,0,0,0.3)',
          border: `2px solid ${isActive ? colors.primary : '#374151'}`,
        }}
      >
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
          <path
            d="M19 7h-1V6a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3zM5 5h10a1 1 0 0 1 1 1v1H5a1 1 0 0 1 0-2zm15 13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8.83A3 3 0 0 0 5 9h14a1 1 0 0 1 1 1v8z"
            fill={colors.white}
          />
          <circle cx="16" cy="14" r="2" fill={colors.white} />
        </svg>
      </div>
      <div
        style={{
          marginTop: 16,
          fontSize: 24,
          fontWeight: 600,
          color: colors.white,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 16,
          color: colors.gray,
          fontFamily: 'monospace',
        }}
      >
        {address}
      </div>
    </div>
  );
};

// Ghost Vault Component
const GhostVault = ({ isActive, scale = 1 }) => {
  const frame = useCurrentFrame();
  const pulseScale = isActive
    ? 1 + Math.sin(frame * 0.15) * 0.05
    : 1;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transform: `scale(${scale * pulseScale})`,
      }}
    >
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: 28,
          background: isActive
            ? `linear-gradient(135deg, ${colors.primary}30 0%, ${colors.secondary}30 100%)`
            : '#1f293720',
          border: `3px dashed ${isActive ? colors.primary : '#374151'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {isActive && (
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: 28,
              background: `radial-gradient(circle, ${colors.primary}20 0%, transparent 70%)`,
              animation: 'pulse 2s infinite',
            }}
          />
        )}
        <svg width="70" height="70" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
            fill={isActive ? colors.primary : '#6b7280'}
            opacity={0.6}
          />
          <path
            d="M12 6v6l4 2"
            stroke={isActive ? colors.primary : '#6b7280'}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div
        style={{
          marginTop: 16,
          fontSize: 20,
          fontWeight: 600,
          color: isActive ? colors.primary : colors.gray,
        }}
      >
        Ghost Vault
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 14,
          color: colors.gray,
        }}
      >
        Counterfactual Address
      </div>
    </div>
  );
};

// Payment Particle
const PaymentParticle = ({ progress, amount }) => {
  const x = interpolate(progress, [0, 1], [0, 400]);
  const y = Math.sin(progress * Math.PI) * -80;
  const scale = interpolate(progress, [0, 0.5, 1], [0.5, 1.2, 0.5]);
  const opacity = interpolate(progress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(50% + ${x - 200}px)`,
        top: `calc(50% + ${y}px)`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          borderRadius: 20,
          padding: '12px 24px',
          boxShadow: `0 0 30px ${colors.primary}80`,
        }}
      >
        <span style={{ color: colors.white, fontSize: 28, fontWeight: 700 }}>
          ${amount}
        </span>
      </div>
    </div>
  );
};

// Main Transaction Flow
export const TransactionFlow = ({ sender, recipient, amount, amountCro }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation phases
  const phase1End = 90; // Sender active
  const phase2End = 150; // Payment flying
  const phase3End = 210; // Ghost vault receiving
  const phase4End = 270; // Claim happening
  // phase5: Complete

  const senderActive = frame < phase2End;
  const paymentFlying = frame >= phase1End && frame < phase3End;
  const ghostVaultActive = frame >= phase2End && frame < phase4End;
  const claimActive = frame >= phase3End;
  const recipientActive = frame >= phase4End;

  const paymentProgress = paymentFlying
    ? interpolate(frame, [phase1End, phase3End], [0, 1], { extrapolateRight: 'clamp' })
    : frame >= phase3End ? 1 : 0;

  const claimProgress = claimActive
    ? interpolate(frame, [phase3End, phase4End], [0, 1], { extrapolateRight: 'clamp' })
    : 0;

  const titleOpacity = interpolate(frame, [0, 30], [0, 1]);
  const subtitleOpacity = interpolate(frame, [20, 50], [0, 1]);

  // Status text
  let statusText = 'Initiating payment...';
  let statusColor = colors.gray;
  if (frame >= phase1End && frame < phase2End) {
    statusText = 'Sending to Ghost Vault...';
    statusColor = colors.primary;
  } else if (frame >= phase2End && frame < phase3End) {
    statusText = 'CRO deposited in Ghost Vault';
    statusColor = colors.primary;
  } else if (frame >= phase3End && frame < phase4End) {
    statusText = 'Recipient claiming funds...';
    statusColor = colors.secondary;
  } else if (frame >= phase4End) {
    statusText = 'Payment complete!';
    statusColor = colors.success;
  }

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${colors.dark} 0%, #111827 100%)`,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontSize: 56,
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
            fontSize: 24,
            color: colors.gray,
            marginTop: 8,
            opacity: subtitleOpacity,
          }}
        >
          Send crypto to anyone, instantly
        </div>
      </div>

      {/* Main Flow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 120,
        }}
      >
        {/* Sender */}
        <Wallet
          label="Sender"
          address={sender}
          side="left"
          isActive={senderActive}
          showGlow={senderActive && frame < phase1End}
        />

        {/* Ghost Vault */}
        <GhostVault isActive={ghostVaultActive} />

        {/* Recipient */}
        <Wallet
          label="Recipient"
          address={recipient}
          side="right"
          isActive={recipientActive}
          showGlow={recipientActive}
        />
      </div>

      {/* Payment Particle */}
      {paymentFlying && (
        <PaymentParticle progress={paymentProgress} amount={amount} />
      )}

      {/* Claim Animation */}
      {claimProgress > 0 && claimProgress < 1 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(${interpolate(claimProgress, [0, 1], [0, 200])}px, -50%)`,
            opacity: interpolate(claimProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]),
          }}
        >
          <div
            style={{
              background: colors.success,
              borderRadius: 16,
              padding: '10px 20px',
              boxShadow: `0 0 20px ${colors.success}60`,
            }}
          >
            <span style={{ color: colors.white, fontSize: 20, fontWeight: 600 }}>
              Claimed!
            </span>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            background: '#1f2937',
            borderRadius: 40,
            padding: '16px 40px',
            border: `2px solid ${statusColor}40`,
          }}
        >
          <div style={{ color: statusColor, fontSize: 24, fontWeight: 600 }}>
            {statusText}
          </div>
          <div style={{ color: colors.gray, fontSize: 18, marginTop: 8 }}>
            ${amount} USD = {amountCro} CRO
          </div>
        </div>
      </div>

      {/* Amount Display */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          right: 80,
          textAlign: 'right',
        }}
      >
        <div style={{ color: colors.gray, fontSize: 18 }}>Amount</div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: colors.white,
          }}
        >
          ${amount}
        </div>
        <div style={{ color: colors.primary, fontSize: 24 }}>
          {amountCro} CRO
        </div>
      </div>
    </AbsoluteFill>
  );
};
