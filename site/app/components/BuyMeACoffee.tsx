'use client';

import { motion } from 'motion/react';
import { useState } from 'react';

export function BuyMeACoffee() {
  const [hoveredAmount, setHoveredAmount] = useState<string | null>(null);

  const suggestions = [
    { 
      amount: 5, 
      label: 'Buy me a coffee', 
      icon: '☕',
      description: 'A quick boost'
    },
    { 
      amount: 15, 
      label: 'Buy me lunch', 
      icon: '🍜',
      description: 'Keep me fueled'
    },
    { 
      amount: 30, 
      label: 'Buy me dinner', 
      icon: '🍱',
      description: 'A hearty meal'
    },
  ];

  return (
    <section className="relative py-16 px-6 bg-mist-green/20 border-y border-gold-rune/20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 border border-gold-rune rounded-full" />
        <div className="absolute bottom-10 right-10 w-48 h-48 border border-cosmic-purple rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-frost-white mb-4">
            Support the Journey
          </h2>
          <p className="text-parchment/80 text-lg max-w-2xl mx-auto">
            If Yggdrasil has helped you grow your worlds, consider fueling the next realm.
          </p>
        </motion.div>

        {/* Suggestion Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-4 mb-8"
        >
          {suggestions.map((suggestion) => (
            <motion.a
              key={suggestion.amount}
              href={`https://ko-fi.com/logbookfordevs?amount=${suggestion.amount}`}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setHoveredAmount(suggestion.label)}
              onMouseLeave={() => setHoveredAmount(null)}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative group"
            >
              <div className={`
                relative overflow-hidden
                bg-linear-to-br from-mist-green/60 to-deep-forest/80
                backdrop-blur-sm
                border-2 transition-all duration-300
                rounded-xl p-6
                ${hoveredAmount === suggestion.label 
                  ? 'border-gold-rune shadow-lg shadow-gold-rune/20' 
                  : 'border-gold-rune/30 hover:border-gold-rune/60'
                }
              `}>
                {/* Shine effect */}
                <div className="absolute inset-0 bg-linear-to-br from-gold-rune/0 via-gold-rune/5 to-gold-rune/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 text-center">
                  <div className="text-4xl mb-3">{suggestion.icon}</div>
                  <div className="text-2xl font-display font-bold text-gold-rune mb-2">
                    {suggestion.amount}
                  </div>
                  <div className="text-frost-white font-semibold mb-1">
                    {suggestion.label}
                  </div>
                  <div className="text-parchment/60 text-sm">
                    {suggestion.description}
                  </div>
                </div>

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-16 h-16 opacity-20">
                  <svg viewBox="0 0 100 100" className="text-gold-rune">
                    <path
                      d="M 0 0 L 100 0 L 100 100 Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>

        {/* Platform Choice Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-parchment/60 mb-6">Or choose your own amount on your preferred platform:</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
            {/* Ko-fi Button */}
            <motion.a
              href="https://ko-fi.com/logbookfordevs"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="
                w-full sm:w-auto
                inline-flex items-center justify-center gap-3 px-8 py-4
                bg-linear-to-r from-gold-rune to-gold-rune/80
                hover:from-gold-rune/90 hover:to-gold-rune/70
                text-deep-forest font-semibold
                rounded-lg
                transition-all duration-300
                shadow-lg hover:shadow-xl
                shadow-gold-rune/20 hover:shadow-gold-rune/30
                border-2 border-gold-rune/50
              "
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-1.735 1.904.047 2.276 1.103 2.276 1.103.296.53.371 1.164.336 1.787-.344 1.278-1.889 2.193-1.889 2.193z"/>
              </svg>
              <span>Support on Ko-fi</span>
            </motion.a>

            {/* Buy Me a Coffee Button */}
            <motion.a
              href="https://buymeacoffee.com/logbookfordevs"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="
                w-full sm:w-auto
                inline-flex items-center justify-center gap-3 px-8 py-4
                bg-linear-to-r from-gold-rune to-gold-rune/80
                hover:from-gold-rune/90 hover:to-gold-rune/70
                text-deep-forest font-semibold
                rounded-lg
                transition-all duration-300
                shadow-lg hover:shadow-xl
                shadow-gold-rune/20 hover:shadow-gold-rune/30
                border-2 border-gold-rune/50
              "
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.2-1.756.205-.656.004-1.31-.025-1.966-.022-.699.004-1.556-.06-2.095-.58-.475-.458-.54-1.174-.605-1.793l-.731-7.013-.322-3.094c-.037-.351-.286-.695-.678-.678-.336.015-.718.3-.678.679l.228 2.185.949 9.112c.147 1.344 1.174 2.068 2.446 2.272.742.12 1.503.144 2.257.156.966.016 1.942.053 2.892-.122 1.408-.258 2.465-1.198 2.616-2.657.34-3.332.683-6.663 1.024-9.995l.215-2.087a.484.484 0 01.39-.426c.402-.078.787-.212 1.074-.518.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233-2.416.359-4.866.54-7.308.46-1.748-.06-3.477-.254-5.207-.498-.17-.024-.353-.055-.47-.18-.22-.236-.111-.71-.054-.995.052-.26.152-.609.463-.646.484-.057 1.046.148 1.526.22.577.088 1.156.159 1.737.212 2.48.226 5.002.19 7.472-.14.45-.06.899-.13 1.345-.21.399-.072.84-.206 1.08.206.166.281.188.657.162.974a.544.544 0 01-.169.364zm-6.159 3.9c-.862.37-1.84.788-3.109.788a5.884 5.884 0 01-1.569-.217l.877 9.004c.065.78.717 1.38 1.5 1.38 0 0 1.243.065 1.658.065.447 0 1.786-.065 1.786-.065.783 0 1.434-.6 1.499-1.38l.94-9.95a3.996 3.996 0 00-1.322-.238c-.826 0-1.491.284-2.26.613z"/>
              </svg>
              <span>Buy Me a Coffee</span>
            </motion.a>
          </div>
        </motion.div>

        {/* Gratitude Message */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-8"
        >
          <p className="text-parchment/50 text-sm italic">
            ✨ Every contribution helps nurture the tree and grow new branches ✨
          </p>
        </motion.div>
      </div>
    </section>
  );
}
