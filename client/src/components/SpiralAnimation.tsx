import { motion } from "framer-motion";

export function SpiralAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-1/2 left-1/2 w-[800px] h-[800px]"
        style={{
          background: `conic-gradient(
            transparent 0deg,
            hsl(var(--primary) / 0.1) 30deg,
            hsl(var(--secondary) / 0.1) 60deg,
            transparent 90deg,
            hsl(var(--primary) / 0.05) 180deg,
            transparent 270deg
          )`,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 20,
          ease: "linear",
          repeat: Infinity,
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-[600px] h-[600px]"
        style={{
          background: `conic-gradient(
            transparent 0deg,
            hsl(var(--secondary) / 0.08) 45deg,
            transparent 90deg,
            hsl(var(--primary) / 0.08) 180deg,
            transparent 270deg
          )`,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: 25,
          ease: "linear",
          repeat: Infinity,
        }}
      />
    </div>
  );
}
