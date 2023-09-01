import { logger } from './logger.js';
import { Behaviors, removeEmpty } from './gops.js';
import { Octokit } from 'octokit';

const removeOrgOutsideCollaborator = async (octokit: Octokit, org: string, username: string) => {
  logger.verbose(`Removing outside collaborator ${username} from ${org}`);
  return await octokit
    .request('DELETE /orgs/{org}/outside_collaborators/{username}', {
      org: org,
      username: username
    })
    .catch((error) => {
      throw error;
    });
};

const addOrgOutsideCollaborator = async (octokit: Octokit, org: string, username: string) => {
  logger.verbose(`Adding outside collaborator ${username} to ${org}`);
  return await octokit
    .request('PUT /orgs/{org}/outside_collaborators/{username}', {
      org: org,
      username: username
    })
    .catch((error) => {
      throw error;
    });
};

const getOrgCollaborators = async (octokit: Octokit, org: string) => {
  return await octokit
    .paginate('GET /orgs/{org}/outside_collaborators', {
      org: org,
      per_page: 100
    })
    .catch((error) => {
      throw error;
    });
};

export async function get(octokit: Octokit, login: string): Promise<string[]> {
  logger.verbose(`Getting collaborators for ${login}`);
  const collaborators = (await getOrgCollaborators(octokit, login)) as any[];
  return Promise.all([...collaborators.map(async (collaborator) => collaborator.login)]);
}

export async function apply(
  octokit: Octokit,
  login: string,
  dryrun: boolean = true,
  collaborators: string[],
  behaviours: Behaviors
): Promise<string[]> {
  logger.verbose(`Applying collaborator for ${login} dryrun ${dryrun}`);
  const currentCollaborator: string[] = await get(octokit, login);
  removeEmpty(currentCollaborator);
  logger.silly('currentCollaborator', currentCollaborator);

  // compare current collaborators with desired collaborators and return differences
  const differences = {
    remove: currentCollaborator.filter((cm) => !collaborators.find((m) => cm === m)),
    update: collaborators.filter((m) => !currentCollaborator.find((cm) => cm === m))
  };
  logger.debug('diff', differences);

  if (differences.remove.length > 0 || differences.update.length > 0) {
    logger.info(
      `Collaborators are out of sync, \n\tcollaborator to be added: ${differences.update} \n\tcollaborator to be removed: ${differences.remove}`
    );
    logger.verbose('diff', differences);

    if (!dryrun) {
      logger.verbose(`Updating org ${login} collaborators`);
      try {
        await Promise.all(
          differences.update.map(async (collaborator) => {
            await addOrgOutsideCollaborator(octokit, login, collaborator);
          })
        );

        switch (behaviours.unknown_collaborators) {
          case 'remove':
            await Promise.all(
              differences.remove.map(async (collaborator) => {
                await removeOrgOutsideCollaborator(octokit, login, collaborator);
              })
            );
            break;
          case 'warn':
            logger.warn(
              `Outside Collaborators ${differences.remove.map((m) => m)} not removed, please remove manually`
            );
            break;
        }

        return collaborators;
      } catch (error) {
        logger.error('Error updating collaborators', error);
        throw error;
      }
    } else {
      logger.verbose('Dry run, not applying changes');
      return collaborators;
    }
  } else {
    logger.info('Collaborators already in sync');
    return collaborators;
  }
}
