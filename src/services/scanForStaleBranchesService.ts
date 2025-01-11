import * as vscode from 'vscode';
import { Branch, GitExtension, Repository } from '../types/git';


export async function getWorkspaceGithubRepository(): Promise<Repository> {
    const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');
    if (!gitExtension) {
        vscode.window.showErrorMessage('Git extension not found.');
        throw new Error('Git extension not found.');
    }

    const git = gitExtension.isActive ? gitExtension.exports : await gitExtension.activate();
    const api = git.getAPI(1);

    // Get the first repository (if available)
    const repository = api.repositories[0];
    if (!repository) {
        vscode.window.showErrorMessage('No Git repository found in the workspace.');
        throw Error("No Git repository found in the workspace")
    }
    return repository;
}


export async function getAllStaleBranches(repository: Repository): Promise<Branch[]> {
    const staleBranches: Branch[] = [];
    const branches = await repository.getBranches({});
    
    // Use Promise.all to fetch commits in parallel instead of awaiting inside loop
    const branchCommits = await Promise.all(branches.map(async (ref) => {
        if (ref.commit) {
            const branchLastCommit = await repository.getCommit(ref.commit);
            return { ref, branchLastCommit };
        }
        return { ref, branchLastCommit: null };
    }));

    // Filter and push stale branches
    for (const { ref, branchLastCommit } of branchCommits) {
        if (branchLastCommit?.commitDate && isStale(branchLastCommit.commitDate)) {
            const branch = await repository.getBranch(ref.name ?? "");
            staleBranches.push(branch);
        }
    }

    return staleBranches;
}

// function isStale(date: Date): boolean {
//     const currentDate = new Date();

//     // Calculate the difference in milliseconds
//     const diffInMs = currentDate.getTime() - date.getTime();

//     // Convert milliseconds to days
//     const diffInDays = diffInMs / (1000 * 3600 * 24);

//     // Return true if the difference is more than 20 days
//     return diffInDays > 500;
// }

function isStale(lastCommitDate: Date, staleThresholdDays: number = 20): boolean {
    const currentDate = new Date();
    const timeDifference = currentDate.getTime() - lastCommitDate.getTime();
    const daysDifference = timeDifference / (1000 * 60 * 60 * 24);
    
    return daysDifference >= staleThresholdDays;
}