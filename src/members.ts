import { getOrgCollaborators, getOrgMembers } from './octokit.js';
import { logger } from './logger.js';
import { removeEmpty } from './gops.js';

export interface Member {
  login: string;
  role: string;
}

export async function get(login: string): Promise<Member[]> {
  logger.verbose(`Getting members for ${login}`);
  const admins = (await getOrgMembers(login, 'admin')) as any[];
  const members = (await getOrgMembers(login, 'member')) as any[];
  const collaborators = (await getOrgCollaborators(login)) as any[];
  return Promise.all([
    ...admins.map(async (member) => ({
      login: member.login,
      role: 'admin'
    })),
    ...members.map(async (member) => ({
      login: member.login,
      role: 'member'
    })),
    ...collaborators.map(async (member) => ({
      login: member.login,
      role: 'collaborator'
    }))
  ]);
}

export async function apply(login: string, dryrun: boolean = true, members: Member[]): Promise<Member[]> {
  logger.verbose(`Applying members for ${login} dryrun ${dryrun}`);
  const currentMembers = await get(login);
  removeEmpty(currentMembers);
  logger.silly('currentMembers', currentMembers);

  const same = (a: Member, b: Member) => a.login === b.login && a.role === b.role;

  const exist = (a: Member, b: Member) => a.login === b.login;

  // compare current members with desired members and return differences
  const differences = {
    remove: currentMembers.filter((cm) => !members.find((m) => exist(cm, m))),
    update: members.filter((m) => !currentMembers.find((cm) => same(cm, m)))
  };
  logger.debug('diff', differences);

  if (differences.remove.length > 0 || differences.update.length > 0) {
    logger.info(
      `Members are out of sync, \n\tmembers to be updated: ${differences.update.map(
        (m) => m.login
      )} \n\tmembers to be removed: ${differences.remove.map((m) => m.login)}`
    );
    logger.verbose('diff', differences);
    if (!dryrun) {
      logger.verbose('Applying changes to members');
      // todo: apply changes
      return members;
    } else {
      logger.verbose('Dry run, not applying changes');
      return members;
    }
  } else {
    logger.info('Members already in sync');
    return members;
  }
}
