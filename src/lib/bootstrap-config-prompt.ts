import inquirer from 'inquirer';

export async function promptBootstrapCommands(): Promise<string[]> {
    const commands: string[] = [];
    let shouldContinue = true;

    while (shouldContinue) {
        const { command } = await inquirer.prompt<{ command: string }>([
            {
                type: 'input',
                name: 'command',
                message: commands.length === 0 ? 'Bootstrap command:' : 'Next bootstrap command:',
                validate: (value: string) => value.trim().length > 0 || 'Enter a command.',
            },
        ]);

        commands.push(command.trim());

        const answer = await inquirer.prompt<{ addAnother: boolean }>([
            {
                type: 'confirm',
                name: 'addAnother',
                message: 'Add another command?',
                default: false,
            },
        ]);
        shouldContinue = answer.addAnother;
    }

    return commands;
}
