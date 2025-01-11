import * as vscode from 'vscode';
import { printAllBranches } from '../services/printAllBranches';
import { GitExtension, Repository } from '../types/git';
import { getAllStaleBranches, getWorkspaceGithubRepository } from '../services/scanForStaleBranchesService';
import { getRepositoryName } from '../utils/utils';

export async function scanForStaleBranches(context: vscode.ExtensionContext) {
    const gitRepo = await getWorkspaceGithubRepository()

    const staleBranches = await getAllStaleBranches(gitRepo)

    const repositoryName = getRepositoryName(gitRepo)

    if (staleBranches.length === 0) {
        vscode.window.showInformationMessage(`No branches found in the repository: ${repositoryName}`);
        return;
    }

    const transformedStaleBranches = staleBranches.map(branch => branch.name ?? "")

    vscode.window.showQuickPick(transformedStaleBranches, {
        title: `Branches in ${repositoryName}`,
        canPickMany: true,
        placeHolder: 'Select a branch to view or press Esc to dismiss.',
    });


}