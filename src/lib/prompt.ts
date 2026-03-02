import inquirer from 'inquirer';
import autocompletePrompt from 'inquirer-autocomplete-prompt';

let autocompleteRegistered = false;

export function ensureAutocompletePrompt(): void {
    if (!autocompleteRegistered) {
        inquirer.registerPrompt('autocomplete', autocompletePrompt as any);
        autocompleteRegistered = true;
    }
}
