'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AudioExperienceProps {
  audioSrc: string;
}

interface Particle {
  id: number;
  width: string;
  height: string;
  top: string;
  left: string;
  duration: number;
  delay: number;
  xOffset: number;
}

export const AudioExperience = ({ audioSrc }: AudioExperienceProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Use deterministic pseudo-randomness to satisfy React purity rules
  // and avoid hydration mismatches or lint errors.
  const particles = useMemo<Particle[]>(() => {
    return [...Array(20)].map((_, i) => {
      const pseudoRandom = (seed: number) => {
        const x = Math.sin(i + seed) * 10000;
        return x - Math.floor(x);
      };

      return {
        id: i,
        width: (pseudoRandom(1) * 4 + 2).toFixed(2) + 'px',
        height: (pseudoRandom(2) * 4 + 2).toFixed(2) + 'px',
        top: (pseudoRandom(3) * 100).toFixed(2) + '%',
        left: (pseudoRandom(4) * 100).toFixed(2) + '%',
        duration: Math.round((pseudoRandom(5) * 5 + 5) * 100) / 100,
        delay: Math.round((pseudoRandom(6) * 5) * 100) / 100,
        xOffset: Math.round((pseudoRandom(7) - 0.5) * 40 * 100) / 100,
      };
    });
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.1;
    }
  }, []);

  const startExperience = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.warn('Audio playback failed:', err);
      });
      setIsPlaying(true);
      setHasInteracted(true);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <>
      <audio ref={audioRef} src={audioSrc} loop />

      {/* Enter Experience Overlay */}
      <AnimatePresence>
        {!hasInteracted && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.5, ease: 'easeInOut' } }}
            className="fixed inset-0 z-1000 flex flex-col items-center justify-center bg-deep-forest overflow-hidden"
          >
            {/* Background Atmosphere */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-rune/20 rounded-full blur-[120px]" />
              <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cosmic-purple/30 rounded-full blur-[100px]" />
            </div>

            {/* Runic Decoration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 2 }}
              className="relative z-10 text-center px-6"
            >
              <h1 className="font-display text-5xl md:text-7xl font-bold text-parchment mb-4 tracking-wider">
                YGGDRASIL
              </h1>
              <p className="font-body text-gold-rune/80 text-lg md:text-xl mb-12 max-w-md mx-auto italic">
                Grow your worlds. Manifest your ideas.
              </p>

              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(212, 168, 83, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={startExperience}
                className="group relative px-10 py-4 bg-transparent border-2 border-gold-rune text-gold-rune font-display text-xl tracking-widest uppercase overflow-hidden transition-all duration-300"
              >
                <span className="relative z-10 group-hover:text-deep-forest transition-colors duration-300">
                  Enter the Realm
                </span>
                <div className="absolute inset-0 bg-gold-rune -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
              </motion.button>

              <div className="mt-16 text-parchment/30 text-xs font-mono max-w-xs mx-auto text-center leading-relaxed">
                Peaceful Village by Arthur Vyncke | arthurvost<br />
                Music promoted by free-stock-music.com<br />
                Creative Commons Attribution-ShareAlike 3.0 Unported
              </div>
            </motion.div>

            {/* Floating Particles Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  animate={{
                    y: [0, -200],
                    x: [0, p.xOffset],
                    opacity: [0, 0.4, 0],
                  }}
                  transition={{
                    duration: p.duration,
                    repeat: Infinity,
                    delay: p.delay,
                    ease: "linear",
                  }}
                  className="absolute rounded-full bg-gold-rune/40"
                  style={{
                    width: p.width,
                    height: p.height,
                    top: p.top,
                    left: p.left,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Audio Toggle */}
      <AnimatePresence mode="wait">
        {hasInteracted && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed bottom-6 right-6 z-500 flex items-center gap-4 group"
          >
            <div className="bg-mist-green/80 backdrop-blur-md border border-gold-rune/20 rounded-full px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-gold-rune text-xs font-display tracking-widest uppercase pointer-events-none">
              {isPlaying ? 'Sound On' : 'Sound Off'}
            </div>

            <button
              onClick={toggleAudio}
              className="w-12 h-12 flex items-center justify-center bg-mist-green/80 backdrop-blur-md border border-gold-rune/30 rounded-full text-gold-rune hover:border-gold-rune/80 hover:scale-110 transition-all duration-300 shadow-lg shadow-black/40"
              aria-label={isPlaying ? 'Mute Music' : 'Unmute Music'}
            >
              {isPlaying ? (
                <div className="flex items-end gap-1 h-4">
                  <motion.div
                    animate={{ height: [4, 16, 8, 14, 4] }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-1 bg-gold-rune rounded-full"
                  />
                  <motion.div
                    animate={{ height: [8, 4, 16, 6, 10] }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    className="w-1 bg-gold-rune rounded-full"
                  />
                  <motion.div
                    animate={{ height: [12, 8, 4, 12, 16] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                    className="w-1 bg-gold-rune rounded-full"
                  />
                </div>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-11 5.77v6h4l5 5v-16l-5 5h-4z" />
                </svg>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
