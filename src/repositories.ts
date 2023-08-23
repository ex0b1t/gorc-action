import { getOrgRepos, getRepoCollaborators, getRepoTeams } from './octokit.js';
import { logger } from './logger.js';
import { removeEmpty } from './gops.js';

export interface Repository {
  name: string;
  description?: string;
  homepage?: string;
  visibility?: 'public' | 'private';
  has_issues?: boolean;
  has_projects?: boolean;
  has_wiki?: boolean;
  is_template?: boolean;
  allow_squash_merge?: boolean;
  allow_merge_commit?: boolean;
  delete_branch_on_merge?: boolean;
  members?: {
    login: string;
    permission: string;
  }[];
  teams?: {
    slug: string;
    permission: string;
  }[];
}

export async function get(login: string): Promise<Repository[]> {
  logger.verbose(`Getting repos for ${login}`);
  const repos = (await getOrgRepos(login)) as any[];
  return Promise.all(
    repos.map(async (repo) => ({
      name: repo.name,
      description: repo.description,
      homepage: repo.homepage,
      visibility: repo.private ? 'private' : 'public',
      has_issues: repo.has_issues,
      has_projects: repo.has_projects,
      has_wiki: repo.has_wiki,
      is_template: repo.is_template,
      allow_squash_merge: repo.allow_squash_merge,
      allow_merge_commit: repo.allow_merge_commit,
      delete_branch_on_merge: repo.delete_branch_on_merge,
      members: ((await getRepoCollaborators(login, repo.name)) as any[]).map((member) => ({
        login: member.login,
        permission: member.role_name
      })),
      teams: ((await getRepoTeams(login, repo.name)) as any[]).map((repo) => ({
        slug: repo.slug,
        permission: repo.permission
      }))
    }))
  );
}

export async function apply(login: string, dryrun: boolean = true, repos: Repository[]): Promise<Repository[]> {
  logger.verbose(`Applying repos for ${login} dryrun ${dryrun}`);
  const currentRepos = await get(login);
  removeEmpty(repos);
  removeEmpty(currentRepos);
  logger.silly('currentRepos', currentRepos);

  const exist = (a: Repository, b: Repository) => a.name === b.name;

  const same = (a: Repository, b: Repository) =>
    a.name === b.name &&
    a.description === b.description &&
    a.homepage === b.homepage &&
    a.visibility === b.visibility &&
    a.has_issues === b.has_issues &&
    a.has_projects === b.has_projects &&
    a.has_wiki === b.has_wiki &&
    a.is_template === b.is_template &&
    a.allow_squash_merge === b.allow_squash_merge &&
    a.allow_merge_commit === b.allow_merge_commit &&
    a.delete_branch_on_merge === b.delete_branch_on_merge;

  const sameMember = (a: any, b: any) => a.login === b.login && a.permission === b.permission;

  const existMember = (a: any, b: any) => a.login === b.login;

  const sameTeam = (a: any, b: any) => a.slug === b.slug && a.permission === b.permission;

  const existTeam = (a: any, b: any) => a.slug === b.slug;

  const differences = {
    remove: currentRepos.filter((cm) => !repos.find((t) => exist(cm, t))),
    update: repos.filter((t) => !currentRepos.find((cm) => same(cm, t))),
    members: [] as any[],
    teams: [] as any[]
  };

  repos.forEach((r) => {
    const currentRepo = currentRepos.find((ct) => ct.name === r.name);
    if (currentRepo) {
      const membersDifferencesForRepo = {
        repo: r.name,
        remove: currentRepo.members?.filter((cm) => !r.members?.find((m) => existMember(cm, m))) || [],
        update: r.members?.filter((m) => !currentRepo.members?.find((cm) => sameMember(cm, m))) || []
      };
      if (membersDifferencesForRepo.remove.length > 0 || membersDifferencesForRepo.update.length > 0) {
        differences.members.push(membersDifferencesForRepo);
      }

      // check teams
      const teamsDifferencesForRepo = {
        repo: r.name,
        remove: currentRepo.teams?.filter((cm) => !r.teams?.find((m) => existTeam(cm, m))) || [],
        update: r.teams?.filter((m) => !currentRepo.teams?.find((cm) => sameTeam(cm, m))) || []
      };
      if (teamsDifferencesForRepo.remove.length > 0 || teamsDifferencesForRepo.update.length > 0) {
        differences.teams.push(teamsDifferencesForRepo);
      }
    }
  });

  logger.debug('diff', differences);

  if (
    differences.remove.length > 0 ||
    differences.update.length > 0 ||
    differences.members.length > 0 ||
    differences.teams.length > 0
  ) {
    logger.info(
      `Repos are out of sync, \n\trepos to be updated: ${differences.update.map(
        (m) => m.name
      )} \n\trepos to be removed: ${differences.remove.map(
        (m) => m.name
      )} \n\tmembers to be updated: ${differences.members.map(
        (m) => m.repo
      )}, \n\tteams to be updated: ${differences.teams.map((m) => m.repo)}`
    );
    logger.verbose('diff', differences);
    if (!dryrun) {
      logger.verbose('Applying changes to repos');
      // todo: apply changes
      return repos;
    } else {
      logger.verbose('Dry run, not applying changes');
      return repos;
    }
  } else {
    logger.info('Repos already in sync');
    return repos;
  }
}
