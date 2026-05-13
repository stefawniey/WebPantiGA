import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';

export default function Maintenance() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-20">
      <div className="w-24 h-24 bg-gold/10 text-gold rounded-full flex items-center justify-center mb-8 animate-bounce">
        <Construction className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-display font-black text-emerald-900 mb-4">Dalam Pengembangan</h1>
      <p className="text-emerald-800/60 max-w-md font-medium">Fitur manajemen lanjutan ini sedang dalam proses integrasi. Silakan kembali lagi nanti.</p>
    </div>
  );
}
