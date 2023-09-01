import { logger } from './logger.js';
import diff from 'deep-diff';
import { removeEmpty } from './gorc.js';
import { Octokit } from 'octokit';

export interface Organization {
  billing_email?: string;
  company?: string;
  email?: string;
  twitter_username?: string;
  location?: string;
  name?: string;
  description?: string;
  has_organization_projects?: boolean;
  has_repository_projects?: boolean;
  default_repository_permission?: string;
  members_can_create_repositories?: boolean;
  members_can_create_private_repositories?: boolean;
  members_can_create_public_repositories?: boolean;
  members_can_create_pages?: boolean;
  members_can_create_public_pages?: boolean;
  members_can_create_private_pages?: boolean;
  members_can_fork_private_repositories?: boolean;
  web_commit_signoff_required?: boolean;
}

export const mapper = (org: any): Organization => {
  return {
    billing_email: org.billing_email,
    company: org.company,
    email: org.email,
    twitter_username: org.twitter_username,
    location: org.location,
    name: org.name,
    description: org.description,
    has_organization_projects: org.has_organization_projects,
    has_repository_projects: org.has_repository_projects,
    default_repository_permission: org.default_repository_permission,
    members_can_create_repositories: org.members_can_create_repositories,
    members_can_create_private_repositories: org.members_can_create_private_repositories,
    members_can_create_public_repositories: org.members_can_create_public_repositories,
    members_can_create_pages: org.members_can_create_pages,
    members_can_create_public_pages: org.members_can_create_public_pages,
    members_can_create_private_pages: org.members_can_create_private_pages,
    members_can_fork_private_repositories: org.members_can_fork_private_repositories,
    web_commit_signoff_required: org.web_commit_signoff_required
  } as Organization;
};

const getOrg = async (octokit: Octokit, org: string) => {
  return octokit.request('GET /orgs/{org}', {
    org: org,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
};

const updateOrg = async (octokit: Octokit, org: string, update: any) => {
  return octokit.request('PATCH /orgs/{org}', {
    org: org,
    ...update
  });
};

export const get = async (octokit: Octokit, login: string): Promise<Organization> => {
  logger.verbose(`Getting org ${login}`);
  try {
    const { data: org } = await getOrg(octokit, login);
    logger.silly('org', org);
    return mapper(org);
  } catch (error) {
    logger.error('Error getting org', error);
    throw error;
  }
};

export const apply = async (
  octokit: Octokit,
  login: string,
  dryrun: boolean = true,
  org: Organization
): Promise<Organization> => {
  logger.verbose(`Applying org ${login} dryrun ${dryrun}`);
  const currentOrg = await get(octokit, login);
  removeEmpty(currentOrg);
  const differences = diff(currentOrg, org);
  logger.debug('diff', differences);
  if (differences) {
    logger.info(`Org is out of sync, fields to be updated: ${differences.map((d) => d.path?.join('.')).join(', ')}`);
    logger.verbose('diff', differences);
    if (!dryrun) {
      logger.verbose(`Updating org ${login}`);
      try {
        const { data: updatedOrg } = await updateOrg(octokit, login, org);
        logger.silly('updatedOrg', updatedOrg);
        return mapper(updatedOrg);
      } catch (error) {
        logger.error('Error updating org', error);
        throw error;
      }
    } else {
      logger.verbose('Dry run, not applying changes');
      return org;
    }
  } else {
    logger.info('Org already in sync');
    return org;
  }
};
