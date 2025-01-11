import * as vscode from 'vscode';
import { Branch, Commit, Repository } from '../types/git';
import { exec } from 'child_process';
import { promisify } from 'util';


export const printAllBranches = async (): Promise<void> => {
    // Get the Git extension
    // deleteRemoteBranch('feat-modify-triggers', "origin")
    const gitExtension = vscode.extensions.getExtension('vscode.git');
    if (!gitExtension) {
        vscode.window.showErrorMessage('Git extension not found.');
        return;
    }

    // Activate and get the Git API
    const git = gitExtension.isActive ? gitExtension.exports : await gitExtension.activate();
    const api = git.getAPI(1);

    // Get the first repository (if available)
    const repository = api.repositories[0];
    console.log('respository', repository)
    if (!repository) {
        vscode.window.showErrorMessage('No Git repository found in the workspace.');
        return;
    }

    // // Get the repository name
    const repositoryName = repository.rootUri.fsPath.split('/').pop(); // Get the last part of the path as the repo name

    const branches = await repository.getBranches();

    const _branch = await repository.getBranch("test-extension-branch")
    console.log("_Branch>>>>> ", _branch)

    // const commits = await getBranchesLastCommit(branches, repository)

    // await repository.deleteBranch("feat-point-to-master-pipeline")



    console.log('branchInfo', branches)

    // Fetch all branches (local and remote)
    const filteredBranches = branches
        // .filter((ref: { type: number; }) => ref.type === 0 || ref.type === 1) // Filter local (type 0) and remote (type 1) branches
        .map((ref: any) => ({
            name: ref.name,
            lastCommitDate: new Date(ref.commit.commitDate),
            remote: ref?.remote?.upstream
        }));
        // .map((ref: { name: any; }) => ref.name); // Extract branch names

    console.log('filteredBranche', filteredBranches)

    // for(var _branch of filteredBranches){
    //     console.log("Branche's remote: ", _branch?.remote)
    // }

    if (filteredBranches.length === 0) {
        vscode.window.showInformationMessage(`No branches found in the repository: ${repositoryName}`);
        return;
    }

    // Display the repository name along with the branches
    vscode.window.showQuickPick(filteredBranches, {
        title: `Branches in ${repositoryName}`,
        canPickMany: true,
        placeHolder: 'Select a branch to view or press Esc to dismiss.',
    });
};

export const getBranchesLastCommit = async (branches: Branch [], repository: Repository): Promise<Commit[]> => {

    const commits: Commit[] = []

    const branchCommitIds = branches.map(branch => branch.commit)

    console.log('branch commits', branchCommitIds)

    for(const commitId of branchCommitIds) {
        if(commitId){
            const commit = await repository.getCommit(commitId)
            commits.push(commit)
        }
    }

    return commits;
}

const execAsync = promisify(exec);

export async function deleteRemoteBranch(
    branchName: string,
    remoteName: string = 'origin',
    workspaceRoot?: string
): Promise<{ success: boolean; message: string }> {
    try {
        // Validate inputs
        if (!branchName) {
            throw new Error('Branch name is required');
        }

        // Get workspace root path
        const rootPath = workspaceRoot || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!rootPath) {
            throw new Error('No workspace folder found');
        }

        // First fetch to ensure we have latest remote info
        await execAsync('git fetch', { cwd: rootPath });

        // Check if branch exists remotely
        const { stdout: branchCheck } = await execAsync(
            `git ls-remote --heads ${remoteName} ${branchName}`,
            { cwd: rootPath }
        );

        if (!branchCheck) {
            throw new Error(`Branch "${branchName}" does not exist on remote "${remoteName}"`);
        }

        // Delete the remote branch
        const { stdout, stderr } = await execAsync(
            `git push ${remoteName} --delete ${branchName}`,
            { cwd: rootPath }
        );

        // Show success message
        const successMessage = `Successfully deleted remote branch "${branchName}" from "${remoteName}"`;
        vscode.window.showInformationMessage(successMessage);

        return {
            success: true,
            message: successMessage
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        vscode.window.showErrorMessage(`Failed to delete remote branch: ${errorMessage}`);
        
        return {
            success: false,
            message: errorMessage
        };
    }
}
