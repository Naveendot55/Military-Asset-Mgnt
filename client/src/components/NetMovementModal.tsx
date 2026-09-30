import React, { useEffect, useRef } from 'react';
import { NetMovementBreakdown } from '../types';
import { X, ArrowDownRight, ArrowUpRight, ShoppingCart, Layers } from 'lucide-react';

interface NetMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: NetMovementBreakdown | null;
  isLoading: boolean;
}

export const NetMovementModal: React.FC<NetMovementModalProps> = ({
  isOpen,
  onClose,
  data,
  isLoading,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Keyboard accessibility: Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="net-movement-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 text-slate-100 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 id="net-movement-title" className="text-lg font-bold">
              Net Movement Breakdown
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm">Calculating movement data...</p>
          </div>
        ) : data ? (
          <div className="py-4 space-y-4">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div className="text-xs uppercase font-semibold text-slate-400 mb-1">
                Net Movement Formula
              </div>
              <p className="text-xs text-slate-400">
                Purchases (+) + Transfer In (+) - Transfer Out (-)
              </p>
            </div>

            <div className="space-y-3">
              {/* Purchases */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded bg-emerald-950 text-emerald-400">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Purchases</div>
                    <div className="text-xs text-slate-400">Procured from suppliers</div>
                  </div>
                </div>
                <div className="text-emerald-400 font-bold text-base">
                  +{(data.purchases ?? 0).toLocaleString()}
                </div>
              </div>

              {/* Transfer In */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded bg-sky-950 text-sky-400">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Transfer In</div>
                    <div className="text-xs text-slate-400">Received from other bases</div>
                  </div>
                </div>
                <div className="text-sky-400 font-bold text-base">
                  +{(data.transferIn ?? 0).toLocaleString()}
                </div>
              </div>

              {/* Transfer Out */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded bg-amber-950 text-amber-400">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Transfer Out</div>
                    <div className="text-xs text-slate-400">Transferred out to other bases</div>
                  </div>
                </div>
                <div className="text-amber-400 font-bold text-base">
                  -{(data.transferOut ?? 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Total Highlight */}
            <div className="mt-4 p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                  Resulting Net Movement
                </span>
                <p className="text-xs text-slate-300">
                  Total inventory shift across selected criteria
                </p>
              </div>
              <div
                className={`text-2xl font-black ${
                  (data.netMovement ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {(data.netMovement ?? 0) >= 0 ? `+${data.netMovement ?? 0}` : data.netMovement}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm">No transaction data available</div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
