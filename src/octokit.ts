import dotenv from 'dotenv';

dotenv.config();

import { Octokit } from 'octokit';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export const getOrg = async (org: string) => {
  return octokit.request('GET /orgs/{org}', {
    org: org,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
};

export const getOrgMembers = async (org: string, role: 'all' | 'admin' | 'member' = 'all') => {
  return await octokit.paginate('GET /orgs/{org}/members?role={role}', {
    org: org,
    role: role,
    per_page: 100
  });
};

export const getOrgCollaborators = async (org: string) => {
  return await octokit.paginate('GET /orgs/{org}/outside_collaborators', {
    org: org,
    per_page: 100
  });
};

export const getUser = async (username: string) => {
  return await octokit.request('GET /users/{username}', {
    username: username
  });
};

export const getOrgTeams = async (org: string) => {
  return await octokit.paginate('GET /orgs/{org}/teams', {
    org: org,
    per_page: 100
  });
};

export const getTeamMembers = async (org: string, slug: string, role: string = 'all') => {
  return await octokit.paginate('GET /orgs/{org}/teams/{slug}/members?role={role}', {
    org: org,
    slug: slug,
    role: role,
    per_page: 100
  });
};

export const getOrgRepos = async (org: string) => {
  return await octokit.paginate('GET /orgs/{org}/repos', {
    org: org,
    per_page: 100
  });
};

export const getRepoCollaborators = async (
  owner: string,
  repo: string,
  affiliation: 'all' | 'direct' | 'outside' = 'direct'
) => {
  return await octokit.paginate('GET /repos/{owner}/{repo}/collaborators?affiliation={affiliation}', {
    owner: owner,
    repo: repo,
    affiliation: affiliation,
    per_page: 100
  });
};

export const getRepoTeams = async (owner: string, repo: string) => {
  return await octokit.paginate('GET /repos/{owner}/{repo}/teams', {
    owner: owner,
    repo: repo,
    per_page: 100
  });
};
