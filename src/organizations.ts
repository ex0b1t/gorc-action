import { getOrg } from './octokit';
import { logger } from './logger';
import diff from 'deep-diff';
import { removeEmpty } from './gops';

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
  members_can_create_internal_repositories?: boolean;
  members_can_create_private_repositories?: boolean;
  members_can_create_public_repositories?: boolean;
  members_can_create_pages?: boolean;
  members_can_create_public_pages?: boolean;
  members_can_create_private_pages?: boolean;
  members_can_fork_private_repositories?: boolean;
  web_commit_signoff_required?: boolean;
}

export async function get(login: string): Promise<Organization> {
  const org = await getOrg(login).then((res) => res.data);
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
    members_can_create_internal_repositories: org.members_can_create_internal_repositories,
    members_can_create_private_repositories: org.members_can_create_private_repositories,
    members_can_create_public_repositories: org.members_can_create_public_repositories,
    members_can_create_pages: org.members_can_create_pages,
    members_can_create_public_pages: org.members_can_create_public_pages,
    members_can_create_private_pages: org.members_can_create_private_pages,
    members_can_fork_private_repositories: org.members_can_fork_private_repositories,
    web_commit_signoff_required: org.web_commit_signoff_required
  } as Organization;
}

export async function apply(login: string, dryrun: boolean = true, org: Organization): Promise<Organization> {
  const currentOrg = await get(login);
  removeEmpty(currentOrg);
  const differences = diff(currentOrg, org);
  if (differences) {
    logger.info(`Org is out of sync, fields to be updated: ${differences.map((d) => d.path?.join('.')).join(', ')}`);
    logger.verbose('diff', differences);
    if (!dryrun) {
      logger.info('Applying changes to org');
      // todo: apply changes
      return org;
    } else {
      logger.info('Dry run, not applying changes');
      return org;
    }
  } else {
    logger.info('Org already in sync');
    return org;
  }
}
