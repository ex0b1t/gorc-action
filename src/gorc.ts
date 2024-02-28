import fs from 'fs';
import yaml from 'js-yaml';
import { Organization } from './organizations.js';
import { Member } from './members.js';
import { Team } from './teams.js';
import { get as getOrg, apply as applyOrg } from './organizations.js';
import { get as getOrgMembers, apply as applyMembers } from './members.js';
import { get as getOrgCollaborators, apply as applyCollaborators } from './collaborators.js';
import { get as getOrgTeams, apply as applyTeams } from './teams.js';
import Ajv, { ValidationError } from 'ajv';
import { logger } from './logger.js';
import { Octokit } from 'octokit';
import { Schema } from './schema.js';

export interface Behaviors {
  unknown_teams: 'remove' | 'warn';
  unknown_members: 'remove' | 'warn' | 'convert_to_outside_collaborator';
  unknown_collaborators: 'remove' | 'warn';
}

export interface Gorc {
  org: Organization;
  members: Member[];
  collaborators: string[];
  teams: Team[];
  behaviours: Behaviors;
}

export function removeEmpty(obj: any) {
  Object.keys(obj).forEach(function (key) {
    (obj[key] && typeof obj[key] === 'object' && removeEmpty(obj[key])) ||
      ((obj[key] === '' || obj[key] === null) && delete obj[key]);
  });
  return obj;
}

export const init = async (octokit: Octokit, gorc: Gorc, organization: string, configFile: string) => {
  logger.verbose('Running init');
  gorc.org = await getOrg(octokit, organization);
  gorc.members = await getOrgMembers(octokit, organization);
  gorc.collaborators = await getOrgCollaborators(octokit, organization);
  gorc.teams = await getOrgTeams(octokit, organization);

  removeEmpty(gorc);
  logger.verbose(`Writing gorc.yml at path '${configFile}'`);
  fs.writeFileSync(configFile, yaml.dump(gorc), { encoding: 'utf8' });
  logger.debug('gorc.yml written');
  return gorc;
};

/**
 * Validate the gorc.yml file against the schema
 */
export const validate = async (octokit: Octokit, gorc: Gorc): Promise<boolean> => {
  logger.verbose('Running validation');
  const ajv = new Ajv();
  const validate = ajv.compile(Schema);
  const valid = validate(gorc);

  if (!valid && validate.errors) {
    logger.error(JSON.stringify(validate.errors, null, 2));
    throw new ValidationError(validate.errors);
  }

  logger.info(`Gorc config is ${valid ? 'valid' : 'invalid'}`);
  return valid;
};

export const apply = async (octokit: Octokit, gorc: Gorc, organization: string, dryRun = true): Promise<Gorc> => {
  logger.verbose(`Running ${dryRun ? 'Dry-run' : 'Apply'}`);
  let updated: Gorc = { org: {}, members: [], collaborators: [], teams: [], behaviours: gorc.behaviours };

  // handle changes
  updated.org = await applyOrg(octokit, organization, dryRun, gorc.org);
  updated.members = await applyMembers(octokit, organization, dryRun, gorc.members, gorc.behaviours);
  // updated.collaborators = await applyCollaborators(octokit, organization, dryRun, gorc.collaborators, gorc.behaviours);
  // updated.teams = await applyTeams(octokit, organization, dryRun, gorc.teams, gorc.behaviours);

  return updated;
};

export const run = async (org: string, cmd: string, configFile: string, githubToken: string): Promise<any> => {
  logger.verbose(`Running gorc with org '${org}' and command '${cmd}' and configFile '${configFile}'!`);

  const gorc: Gorc = (yaml.load(fs.readFileSync(configFile, { encoding: 'utf8' })) as Gorc) || {};
  logger.debug(`Gorc config file read successfully!`);
  logger.silly('Gorc config content', gorc);

  const octokit: Octokit = new Octokit({
    auth: githubToken
  });
  logger.debug(`Octokit created successfully!`);

  let output: { org: string; gorc?: Gorc; valid?: boolean; errors?: any[] } = { org: org, errors: [] };

  try {
    switch (cmd) {
      case 'init':
        output.gorc = await init(octokit, gorc, org, configFile);
        break;
      case 'validate':
        output.valid = await validate(octokit, gorc);
        break;
      case 'dry-run':
        output.gorc = await apply(octokit, gorc, org, true);
        break;
      case 'apply':
        output.gorc = await apply(octokit, gorc, org, false);
        break;
      default:
        output.errors?.push(new Error(`Unknown command ${cmd}`));
    }
  } catch (err) {
    logger.error(err);
    output.errors?.push(err);
  }

  logger.debug('Output', output);
  return output;
};
