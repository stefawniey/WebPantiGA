import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, CreditCard, Wallet, Smartphone, Banknote, ShieldCheck } from 'lucide-react';
import { Donation } from '../types';
import { formatToWIB } from '../utils';

interface DonationReceiptModalProps {
  donation: Donation | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DonationReceiptModal({ donation, isOpen, onClose }: DonationReceiptModalProps) {
  if (!donation) return null;

  const formatDate = (dateStr: string) => {
    return formatToWIB(dateStr, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ' • ' + formatToWIB(dateStr, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getMethodDetails = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes('bca') || m.includes('mandiri') || m.includes('bri') || m.includes('bni')) {
      return { 
        name: method.toUpperCase(), 
        icon: <Banknote className="w-5 h-5" />, 
        color: 'text-blue-600',
        bg: 'bg-blue-50'
      };
    }
    if (m.includes('ovo') || m.includes('dana') || m.includes('gopay') || m.includes('shopeepay')) {
      return { 
        name: method.toUpperCase(), 
        icon: <Smartphone className="w-5 h-5" />, 
        color: 'text-purple-600',
        bg: 'bg-purple-50'
      };
    }
    return { 
      name: method.toUpperCase(), 
      icon: <Wallet className="w-5 h-5" />, 
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    };
  };

  const methodInfo = getMethodDetails(donation.method || 'Transfer Bank');

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const checkCircleVariants = {
    hidden: { scale: 0, rotate: -45 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        type: "spring", 
        damping: 12, 
        stiffness: 200,
        delay: 0.4
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0F3027]/80 backdrop-blur-sm"
          />
  
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="relative w-full max-w-[360px] z-[110] max-h-[92vh] flex flex-col pt-4 pointer-events-auto"
          >
            {/* Main Card */}
            <div className="bg-white rounded-t-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex-shrink-0 relative overflow-visible">
              {/* Header with Close */}
              <div className="absolute top-6 right-6 z-[120]">
                 <motion.button 
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-emerald-50 rounded-full transition-colors text-emerald-900 shadow-sm cursor-pointer border border-emerald-100"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
  
              {/* Status Section */}
              <div className="flex flex-col items-center pt-12 pb-6 px-6 text-center">
                <motion.div 
                  variants={checkCircleVariants}
                  className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mb-5 shadow-2xl shadow-emerald-200 ring-8 ring-emerald-50"
                >
                  <Check className="w-8 h-8 text-white stroke-[3px]" />
                </motion.div>
                
                <motion.div variants={itemVariants} className="text-emerald-900 text-3xl font-display font-black mb-1">
                  {donation.type === 'money' 
                    ? `Rp${donation.amount?.toLocaleString('id-ID')}` 
                    : 'Logistik'}
                </motion.div>
                <motion.div variants={itemVariants} className="text-emerald-800 font-bold text-base">Donasi Berhasil</motion.div>
                <motion.div variants={itemVariants} className="text-emerald-800/40 text-[10px] font-black mt-1 uppercase tracking-widest">{formatDate(donation.created_at)}</motion.div>
              </div>
  
              {/* Merchant Identity divider with side notches */}
              <motion.div variants={itemVariants} className="relative">
                <div className="px-6 py-4 flex items-center gap-4 bg-gray-50/30 border-y border-dashed border-emerald-100/30">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-[11px] font-black shadow-md shadow-emerald-100 flex-shrink-0">
                    GA
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-emerald-900 font-bold text-xs uppercase tracking-tight truncate">GRIYA AMANAH</div>
                    <div className="text-emerald-600/60 text-[9px] font-black uppercase tracking-widest mt-0.5">TERVERIFIKASI</div>
                  </div>
                  <div className="px-2.5 py-1 bg-emerald-100/50 text-emerald-700 text-[8px] font-black rounded-lg uppercase tracking-wider">
                    BERHASIL
                  </div>
                </div>
                
                {/* Side cutouts (punched holes) - matching backdrop color */}
                <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-5 h-8 bg-[#0F3027] rounded-r-full" />
                <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-5 h-8 bg-[#0F3027] rounded-l-full" />
              </motion.div>
  
              {/* Info Section - Modern Rows */}
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <motion.div variants={itemVariants} className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-emerald-800/40 text-[9px] font-black uppercase tracking-widest">No. Transaksi</span>
                    <span className="text-emerald-900 font-mono text-[10px] font-bold">
                      #{donation.id.toString().slice(-8).toUpperCase()}
                    </span>
                  </motion.div>
                  <motion.div variants={itemVariants} className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-emerald-800/40 text-[9px] font-black uppercase tracking-widest">Penerima</span>
                    <span className="text-emerald-900 font-bold text-[10px] text-right line-clamp-1 max-w-[170px]">
                      {donation.orphanage_name}
                    </span>
                  </motion.div>
                  <motion.div variants={itemVariants} className="flex justify-between items-center py-2">
                    <span className="text-emerald-800/40 text-[9px] font-black uppercase tracking-widest">Metode</span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-900 font-black text-[10px] tracking-tight">{methodInfo.name}</span>
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1, type: "spring" }}
                        className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center"
                      >
                         <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[4px]" />
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </div>
  
              {/* Wavy Edge Card Bottom - Integrated into main div */}
              <div className="h-5 bg-white relative overflow-hidden flex-shrink-0">
                 <div className="absolute inset-x-0 -bottom-2.5 flex justify-between px-0 translate-y-1">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-[#0F3027]" />
                    ))}
                 </div>
              </div>
            </div>
  
            {/* Footer Label */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col items-center mt-6 pb-4 flex-shrink-0"
            >
              <div className="flex items-center gap-1.5 text-white/30 text-[8px] font-black uppercase tracking-[0.25em]">
                <ShieldCheck className="w-3 h-3" />
                <span>GRIYA AMANAH TERINTEGRASI</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
