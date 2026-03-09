import chalk from 'chalk';
import gradient from 'gradient-string';
import figlet from 'figlet';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function bifrostCommand() {
    console.clear();
    process.stdout.write('\x1b[?25l'); // Hide cursor

    // Animated clouds blowing across the sky
    const cloudArt = '         ☁️         ☁️                 ☁️     ';
    const skyWidth = 40;
    
    console.log(chalk.dim('\n  The sky darkens...\n'));
    
    // Print a placeholder for the animated line so we can cursor-up over it
    console.log(''); 
    
    for (let i = 0; i < 20; i++) {
        // Shift the clouds by slicing from an ever-changing offset of a repeated string
        const offset = i % cloudArt.length;
        const visibleClouds = (cloudArt.repeat(3)).substring(offset, offset + skyWidth);
        
        process.stdout.write('\x1b[1A'); // Move cursor up 1 line
        process.stdout.write('\r  ' + chalk.gray(visibleClouds) + '\n');
        
        await sleep(100);
    }
    
    console.clear();

    // 6-Frame Cutscene: The Bifrost Opening (Bigger & Stronger)
    const bifrostFrames = [
        // Frame 1: Empty sky
        chalk.gray(`
               ☁️                               ☁️     
                                                       
                                                       
                                                       
                                                       
                                                       
                                                       
                                                       
                                                       
                                                       
                                                       
        `),
        // Frame 2: Small beam of light
        chalk.cyan(`
               ☁️               |               ☁️     
                                |                      
                                |                      
                                |                      
                                |                      
                                |                      
                                |                      
                                |                      
                                |                      
                                |                      
                                v                      
        `),
        // Frame 3: Wider beam reaching the ground
        gradient.rainbow(`
               ☁️              |||              ☁️     
                               |||                     
                               |||                     
                               |||                     
                               |||                     
                               |||                     
                               |||                     
                               |||                     
                               |||                     
                               |||                     
                            ---------                  
        `),
        // Frame 4: Giant beam hitting the ground
        gradient.rainbow(`
               ☁️          |||||||||||          ☁️     
                           |||||||||||                 
                           |||||||||||                 
                           |||||||||||                 
                           |||||||||||                 
                           |||||||||||                 
                           |||||||||||                 
                           |||||||||||                 
                           |||||||||||                 
                           |||||||||||                 
                        -----------------              
        `),
        // Frame 5: MASSIVE beam
        gradient.rainbow(`
               ☁️     |||||||||||||||||||||     ☁️     
                      |||||||||||||||||||||            
                      |||||||||||||||||||||            
                      |||||||||||||||||||||            
                      |||||||||||||||||||||            
                      |||||||||||||||||||||            
                      |||||||||||||||||||||            
                      |||||||||||||||||||||            
                      |||||||||||||||||||||            
                      |||||||||||||||||||||            
                   ---------------------------         
        `),
        // Frame 6: Silhouette of Thor in the massive beam
        gradient.rainbow(`
               ☁️     |||||||||||||||||||||     ☁️     
                      |||||||||||||||||||||            
                      |||||||||||||||||||||            
                      |||||||||||||||||||||            
                      |||||||||||||||||||||            
                      |||||||||||||||||||||            
                      |||||||||||||||||||||            
                      |||||||||||||||||||||            
                      |||||||||||||||||||||            
                      ||||||||| 𖨆 |||||||||            
                   ---------------------------         
        `)
    ];

    // Give the user more time to digest each step of the expanding Bifrost
    const frameDelays = [400, 300, 300, 300, 400, 1000];

    for (let i = 0; i < bifrostFrames.length; i++) {
        console.clear();
        console.log(chalk.bold.italic('\n  Opening the Bifrost...\n'));
        console.log(bifrostFrames[i]);
        await sleep(frameDelays[i]); // Custom timing per frame for better impact
    }
    
    await sleep(200);

    // Lightning Flash
    // We use standard ANSI terminal invert colors to simulate lightning
    process.stdout.write('\x1b[?5h'); // Inverse Video On
    console.log(chalk.yellow.bold('\n\n                ⚡  \n          ⚡        ⚡\n                ⚡\n\n'));
    await sleep(150);
    process.stdout.write('\x1b[?5l'); // Inverse Video Off
    console.clear();

    const frames = [
        chalk.gray.bold(`
            ___________
           |           |
           |  MJÖLNIR  |
           |___________|
                | |
                | |
               _|_|_
        `),
        chalk.gray.bold(`
     
             _____________
      ======|   MJÖLNIR   |
             -------------
     
        `),
        chalk.gray.bold(`
               _|_|_
                | |
                | |
            ___________
           |           |
           |  MJÖLNIR  |
           |___________|
        `),
        chalk.gray.bold(`
     
             _____________
            |   MJÖLNIR   |======
             -------------
     
        `)
    ];

    // Let the hammer fall down and spin from right to left
    const animationSteps = 15;
    for (let i = 0; i < animationSteps; i++) {
        console.clear();
        console.log('\x1b[?25l'); // Hide cursor
        
        const yPadding = '\n'.repeat(i);
        const xPaddingLength = Math.max(0, (animationSteps - i) * 6);
        const xPadding = ' '.repeat(xPaddingLength);
        
        const frame = frames[i % frames.length];
        const paddedFrame = frame.split('\n').map(line => xPadding + line).join('\n');
        
        console.log(yPadding + paddedFrame);
        await sleep(70);
    }
    
    // Final pose upright!
    console.clear();
    const finalYPadding = '\n'.repeat(animationSteps);
    console.log(finalYPadding + frames[0]);
    await sleep(200);

    // THOOM text
    const thoomArt = figlet.textSync('THOOM!', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default',
    });

    console.log(gradient.fruit(thoomArt));
    console.log(chalk.yellow.bold('\n  ⚡ The son of Odin has entered the realm ⚡ \n'));
    console.log('\x1b[?25h'); // Show cursor
}
