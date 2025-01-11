import * as vscode from 'vscode';
import { scanForStaleBranches } from './scanForStaleBranchesCommand';

export function registerCommands(context: vscode.ExtensionContext) {
    const commands = [
        vscode.commands.registerCommand('git-pruner.scanForStaleBranch', scanForStaleBranches),
    ];

    context.subscriptions.push(...commands);
}