interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 bg-gray-900 p-6 rounded-xl border border-purple-500/20 
        shadow-[0_0_30px_rgba(147,51,234,0.2)] max-w-md w-full mx-4
        animate-in fade-in duration-200"
      >
        {children}
      </div>
    </div>
  );
} 