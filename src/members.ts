import { logger } from './logger.js';
import { Behaviors, removeEmpty } from './gorc.js';
import { Octokit } from 'octokit';

export interface Member {
  login: string;
  role: string;
}

const getOrgMembers = async (octokit: Octokit, org: string, role: 'all' | 'admin' | 'member' = 'all') => {
  return await octokit
    .paginate('GET /orgs/{org}/members?role={role}', {
      org: org,
      role: role,
      per_page: 100
    })
    .catch((error) => {
      throw error;
    });
};

const removeOrgMember = async (octokit: Octokit, org: string, username: string) => {
  logger.verbose(`Removing member ${username} from ${org}`);
  return await octokit
    .request('DELETE /orgs/{org}/members/{username}', {
      org: org,
      username: username
    })
    .catch((error) => {
      throw error;
    });
};

const updateOrgMember = async (octokit: Octokit, org: string, username: string, role: any) => {
  logger.verbose(`Updating member ${username} to ${role} in ${org}`);
  return await octokit
    .request('PUT /orgs/{org}/memberships/{username}', {
      org: org,
      username: username,
      role: role
    })
    .catch((error) => {
      throw error;
    });
};

export async function get(octokit: Octokit, login: string): Promise<Member[]> {
  logger.verbose(`Getting members for ${login}`);
  const admins = (await getOrgMembers(octokit, login, 'admin')) as any[];
  const members = (await getOrgMembers(octokit, login, 'member')) as any[];
  return Promise.all([
    ...admins.map(async (member) => ({
      login: member.login?.toLowerCase(),
      role: 'admin'
    })),
    ...members.map(async (member) => ({
      login: member.login?.toLowerCase(),
      role: 'member'
    }))
  ]);
}

export async function apply(
  octokit: Octokit,
  login: string,
  dryrun: boolean = true,
  members: Member[],
  behaviours: Behaviors
): Promise<Member[]> {
  logger.verbose(`Applying members for ${login} dryrun ${dryrun}`);
  const currentMembers = await get(octokit, login);
  removeEmpty(currentMembers);
  logger.silly('currentMembers', currentMembers);

  const same = (a: Member, b: Member) => a.login?.toLowerCase() === b.login?.toLowerCase() && a.role === b.role;
  const exist = (a: Member, b: Member) => a.login?.toLowerCase() === b.login?.toLowerCase();

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
      logger.verbose(`Updating org ${login} members`);
      try {
        // Update member roles
        await Promise.all(
          differences.update.map(async (member) => {
            await updateOrgMember(octokit, login, member.login, member.role);
          })
        );

        // either just warn the member exists or remove it
        switch (behaviours.unknown_members) {
          case 'remove':
            await Promise.all(
              differences.remove.map(async (member) => {
                await removeOrgMember(octokit, login, member.login);
              })
            );
            break;
          case 'warn':
            logger.warn(`Members ${differences.remove.map((m) => m.login)} not removed, please remove manually`);
            break;
        }

        return members;
      } catch (error) {
        logger.error('Error updating members', error);
        throw error;
      }
    } else {
      logger.verbose('Dry run, not applying changes');
      return members;
    }
  } else {
    logger.info('Members already in sync');
    return members;
  }
}
