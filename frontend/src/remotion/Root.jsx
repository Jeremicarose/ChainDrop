import { Composition } from 'remotion';
import { TransactionFlow } from './TransactionFlow';
import { PaymentSent } from './components/PaymentSent';
import { ClaimAnimation } from './components/ClaimAnimation';
import { ActivityFeedAnimation } from './components/ActivityFeedAnimation';

export const RemotionRoot = () => {
  return (
    <>
      {/* Full Transaction Flow - 10 seconds */}
      <Composition
        id="TransactionFlow"
        component={TransactionFlow}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          sender: '0x1da9...c436',
          recipient: 'alice@company.com',
          amount: '5.00',
          amountCro: '71.43',
        }}
      />

      {/* Payment Sent Animation - 3 seconds */}
      <Composition
        id="PaymentSent"
        component={PaymentSent}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          amount: '5.00',
          amountCro: '71.43',
          recipient: 'alice@company.com',
        }}
      />

      {/* Claim Animation - 3 seconds */}
      <Composition
        id="ClaimAnimation"
        component={ClaimAnimation}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          amount: '71.43',
          recipient: 'alice@company.com',
        }}
      />

      {/* Activity Feed Animation - 5 seconds */}
      <Composition
        id="ActivityFeed"
        component={ActivityFeedAnimation}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          transactions: [
            { sender: '0x1da9...', recipient: 'alice@email.com', amount: '5.00', status: 'claimed' },
            { sender: '0x742d...', recipient: 'bob@company.com', amount: '10.00', status: 'pending' },
            { sender: '0x9f8b...', recipient: '@charlie', amount: '25.00', status: 'claimed' },
          ],
        }}
      />
    </>
  );
};
