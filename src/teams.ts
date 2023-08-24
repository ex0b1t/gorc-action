import { getOrgTeams, getTeamMembers } from './octokit.js';
import { Member } from './members.js';
import { logger } from './logger.js';
import { removeEmpty } from './gops.js';
import { Octokit } from 'octokit';

export interface Team {
  slug: string;
  name?: string;
  description?: string;
  privacy?: string;
  parent?: string;
  members?: Member[];
}

export async function get(octokit: Octokit, login: string): Promise<Team[]> {
  logger.verbose(`Getting teams for ${login}`);
  const teams = (await getOrgTeams(octokit, login)) as any[];
  return Promise.all(
    teams.map(async (team) => ({
      slug: team.slug,
      name: team.name,
      description: team.description,
      privacy: team.privacy,
      parent: team.parent?.slug,
      members: [
        ...((await getTeamMembers(octokit, login, team.slug, 'member')) as any[]).map((member) => ({
          login: member.login,
          role: 'member'
        })),
        ...((await getTeamMembers(octokit, login, team.slug, 'maintainer')) as any[]).map((member) => ({
          login: member.login,
          role: 'maintainer'
        }))
      ]
    }))
  );
}

export async function apply(octokit: Octokit, login: string, dryrun: boolean = true, teams: Team[]): Promise<Team[]> {
  logger.verbose(`Applying teams for ${login} dryrun ${dryrun}`);
  const currentTeams = await get(octokit, login);
  removeEmpty(teams);
  removeEmpty(currentTeams);
  logger.silly('currentTeams', currentTeams);

  const exist = (a: Team, b: Team) => a.slug === b.slug;

  const same = (a: Team, b: Team) =>
    a.name === b.name && a.privacy === b.privacy && a.parent === b.parent && a.description === b.description;

  const sameMember = (a: Member, b: Member) => a.login === b.login && a.role === b.role;

  const existMember = (a: Member, b: Member) => a.login === b.login;

  const differences = {
    remove: currentTeams.filter((cm) => !teams.find((t) => exist(cm, t))),
    update: teams.filter((t) => !currentTeams.find((cm) => same(cm, t))),
    members: [] as any[]
  };

  teams.forEach((t) => {
    const currentTeam = currentTeams.find((ct) => ct.slug === t.slug);
    if (currentTeam) {
      const membersDifferencesForTeam = {
        team: t.slug,
        remove: currentTeam.members?.filter((cm) => !t.members?.find((m) => existMember(cm, m))) || [],
        update: t.members?.filter((m) => !currentTeam.members?.find((cm) => sameMember(cm, m))) || []
      };
      if (membersDifferencesForTeam.remove.length > 0 || membersDifferencesForTeam.update.length > 0) {
        differences.members.push(membersDifferencesForTeam);
      }
    }
  });
  logger.debug('diff', differences);

  if (differences.remove.length > 0 || differences.update.length > 0 || differences.members.length > 0) {
    logger.info(
      `Teams are out of sync, \n\tteams to be updated: ${differences.update.map(
        (m) => m.slug
      )} \n\tteams to be removed: ${differences.remove.map(
        (m) => m.slug
      )} \n\tmembers to be updated: ${differences.members.map((m) => m.team)}`
    );
    logger.debug('diff', differences);
    if (!dryrun) {
      logger.verbose('Applying changes to teams');
      // todo: apply changes
      return teams;
    } else {
      logger.verbose('Dry run, not applying changes');
      return teams;
    }
  } else {
    logger.info('Teams already in sync');
    return teams;
  }
}
