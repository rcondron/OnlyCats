interface LoadingMessageProps {
    message: string;
  }
  
export const LoadingMessage = ({ message }: LoadingMessageProps) => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="animate-spin text-4xl">🌟</div>
    <p className="text-xl text-white/70">{message}</p>
  </div>
);

export const ConnectWalletMessage = () => (
  <div className="text-center space-y-6">
    <div className="flex flex-col items-center">
      <span className="text-6xl mb-4">😺</span>
      <h2 className="text-3xl font-cinzel font-bold neon-text mb-2">
        Welcome to Only Cats
      </h2>
      <p className="text-xl text-white/70 mb-2">
        Connect your wallet to view your warrior cats
      </p>
      <p className="text-sm text-white/50">
        Use the connect button in the top right to get started
      </p>
    </div>
    <div className="inline-block bg-gradient-to-r from-purple-500/10 to-blue-500/10 
      border border-purple-500/20 rounded-lg p-4 max-w-md mx-auto">
      <p className="text-sm text-white/60">
        Once connected, you'll be able to:
      </p>
      <ul className="text-sm text-white/70 mt-2 space-y-1">
        <li className="flex items-center gap-2">
          <span>👀</span> View your warrior cat collection
        </li>
        <li className="flex items-center gap-2">
          <span>⚔️</span> Enter battles and earn rewards
        </li>
        <li className="flex items-center gap-2">
          <span>✨</span> Revive fallen warriors
        </li>
        <li className="flex items-center gap-2">
          <span>💰</span> Claim your battle earnings
        </li>
      </ul>
    </div>
  </div>
);

export const NoCatsMessage = () => (
  <div className="text-center">
    <p className="text-xl text-white/70 mb-4">You don't have any cats yet</p>
    <a href="/" className="btn-primary inline-block">
      Generate Your First Cat
    </a>
  </div>
);