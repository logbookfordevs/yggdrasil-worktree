import chalk from 'chalk';
import gradient from 'gradient-string';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A collection of legendary quotes (mix of Poetic Edda and developer humor)
const quotes = [
    "I say thee NAY to unhandled promises!",
    "Even the All-Father tests in production sometimes.",
    "A wise developer commits early, and commits often.",
    "Bugs are just frost giants hiding in your codebase.",
    "May your builds be as swift as Mjölnir's flight.",
    "Do not trust a tree without deep roots, nor code without tests.",
    "Yggdrasil connects all realms; git connects all branches.",
    "A clean working tree is acceptable to the gods.",
    "The Bifrost is open, but did you remember to push?",
    "Verily, thou shalt not force push to main."
];

export async function thorCommand() {
    console.clear();

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    // Static Thor ASCII art
    const thorArt = `
      / \\
     /___\\
     (o_o)   "Hello from Asgard!"
    /|||||\\ 
   | |   | |
    \\=====//
      | |
      | |
     _|_|_
    `;

    console.log(chalk.gray.bold(thorArt));
    
    // Typewriter effect for the quote
    process.stdout.write(chalk.cyan('Thor says: '));
    for (let i = 0; i < randomQuote.length; i++) {
        process.stdout.write(chalk.bold.yellow(randomQuote.charAt(i)));
        await sleep(30); // Typing speed
    }
    console.log('\n');
}
