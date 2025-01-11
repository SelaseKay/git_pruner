import { Repository } from "../types/git";

export function getRepositoryName (repo: Repository) {
    return repo.rootUri.fsPath.split('/').pop();
}