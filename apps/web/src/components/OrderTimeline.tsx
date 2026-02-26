import React from 'react';
import { OrderStatus } from '@lessence/core';
import { Check, Truck, Package, CreditCard, XCircle, RefreshCcw, Home } from 'lucide-react';

type TimelineStep = {
  status: OrderStatus;
  label: string;
  icon: React.ReactNode;
};

const STEPS: TimelineStep[] = [
  { status: 'pending', label: 'Order Placed', icon: <Package size={16} /> },
  { status: 'paid', label: 'Payment Confirmed', icon: <CreditCard size={16} /> },
  { status: 'processing', label: 'Processing', icon: <RefreshCcw size={16} /> },
  { status: 'shipped', label: 'Shipped', icon: <Truck size={16} /> },
  { status: 'delivered', label: 'Delivered', icon: <Home size={16} /> },
];

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  history?: { status: OrderStatus; created_at: string }[];
}

export default function OrderTimeline({ currentStatus, history = [] }: OrderTimelineProps) {
  const isCancelled = currentStatus === 'cancelled';
  const isRefunded = currentStatus === 'refunded';

  const historyMap = history.reduce((acc, curr) => {
    acc[curr.status] = curr.created_at;
    return acc;
  }, {} as Record<string, string>);

  const getStepStatus = (stepStatus: OrderStatus, index: number) => {
    if (isCancelled || isRefunded) {
      if (stepStatus === currentStatus) return 'active';
      return 'disabled';
    }

    const currentIdx = STEPS.findIndex(s => s.status === currentStatus);
    if (index < currentIdx) return 'completed';
    if (index === currentIdx) return 'active';
    return 'upcoming';
  };

  return (
    <div className="py-8">
      <div className="relative flex justify-between">
        {/* Line */}
        <div className="absolute top-5 left-0 w-full h-[2px] bg-white/5 -z-0" />
        <div 
          className={`absolute top-5 left-0 h-[2px] bg-[#f4c025] transition-all duration-500 -z-0 ${['w-0', 'w-[25%]', 'w-[50%]', 'w-[75%]', 'w-[100%]'][Math.max(0, STEPS.findIndex(s => s.status === currentStatus))] || 'w-0'
            }`}
          role="progressbar"
          aria-label="Order progress"
        />

        {STEPS.map((step, index) => {
          const stepStatus = getStepStatus(step.status, index);
          const date = historyMap[step.status];

          return (
            <div key={step.status} className="relative z-10 flex flex-col items-center flex-1">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  stepStatus === 'completed' 
                    ? 'bg-[#f4c025] border-[#f4c025] text-black' 
                    : stepStatus === 'active'
                    ? 'bg-black border-[#f4c025] text-[#f4c025] shadow-[0_0_15px_rgba(244,192,37,0.3)]'
                    : 'bg-[#181611] border-white/10 text-fg-faint'
                }`}
              >
                {stepStatus === 'completed' ? <Check size={18} /> : step.icon}
              </div>
              <div className="mt-3 text-center">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                  stepStatus === 'upcoming' ? 'text-fg-faint' : 'text-white'
                }`}>
                  {step.label}
                </p>
                {date && (
                  <p className="text-[8px] text-fg-faint mt-1">
                    {new Date(date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Special statuses for Cancelled/Refunded */}
        {(isCancelled || isRefunded) && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/20 px-4 py-1 rounded-full flex items-center gap-2">
            {isCancelled ? <XCircle size={14} className="text-red-400" /> : <RefreshCcw size={14} className="text-gray-400" />}
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isCancelled ? 'text-red-400' : 'text-gray-400'}`}>
              Order {currentStatus}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
