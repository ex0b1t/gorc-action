export const Schema = {
  title: 'Describes the configuration of a GitHub Organization\n',
  description: 'Describes the configuration of a GitHub Organization via a YAML file\n',
  type: 'object',
  properties: {
    org: {
      description: 'Organizational level configuration\n',
      type: 'object',
      properties: {
        billing_email: {
          description: 'The billing email for the organization\n',
          type: 'string'
        },
        company: {
          description: 'The company name for the organization\n',
          type: 'string'
        },
        email: {
          description: 'The publicly visible email for the organization\n',
          type: 'string'
        },
        twitter_username: {
          description: 'The twitter username for the organization\n',
          type: 'string'
        },
        location: {
          description: 'The location of the organization\n',
          type: 'string'
        },
        name: {
          description: 'The name of the organization\n',
          type: 'string'
        },
        description: {
          description: 'The description of the organization\n',
          type: 'string'
        },
        has_organization_projects: {
          description: 'Whether or not the organization has projects enabled\n',
          type: 'boolean'
        },
        has_repository_projects: {
          description: 'Whether or not the organization has repository projects enabled\n',
          type: 'boolean'
        },
        default_repository_permission: {
          description: 'The default repository permission for the organization\n',
          type: 'string',
          enum: ['read', 'write', 'admin', 'none']
        },
        members_can_create_repositories: {
          description: 'Whether or not members can create repositories in the organization\n',
          type: 'boolean'
        },
        members_can_create_internal_repositories: {
          description: 'Whether or not members can create internal repositories in the organization\n',
          type: 'boolean'
        },
        members_can_create_private_repositories: {
          description: 'Whether or not members can create private repositories in the organization\n',
          type: 'boolean'
        },
        members_can_create_public_repositories: {
          description: 'Whether or not members can create public repositories in the organization\n',
          type: 'boolean'
        },
        members_can_create_pages: {
          description: 'Whether or not members can create pages in the organization\n',
          type: 'boolean'
        },
        members_can_create_public_pages: {
          description: 'Whether or not members can create public pages in the organization\n',
          type: 'boolean'
        },
        members_can_create_private_pages: {
          description: 'Whether or not members can create private pages in the organization\n',
          type: 'boolean'
        },
        members_can_fork_private_repositories: {
          description: 'Whether or not members can fork private repositories in the organization\n',
          type: 'boolean'
        },
        web_commit_signoff_required: {
          description: 'Whether or not web commit signoff is required in the organization\n',
          type: 'boolean'
        }
      }
    },
    members: {
      type: 'array',
      description: 'A list of members of the organization\n',
      items: {
        type: 'object',
        properties: {
          login: {
            description: 'The username of the member\n',
            type: 'string'
          },
          role: {
            description: 'The role of the member\n',
            type: 'string',
            enum: ['admin', 'member']
          }
        },
        required: ['login', 'role']
      }
    },
    collaborators: {
      type: 'array',
      description: 'A list of collaborators of the organization\n',
      items: {
        type: 'string'
      }
    },
    teams: {
      type: 'array',
      description: 'A list of teams in the organization\n',
      items: {
        type: 'object',
        properties: {
          slug: {
            description: 'The slug of the team\n',
            type: 'string'
          },
          name: {
            description: 'The name of the team\n',
            type: 'string'
          },
          description: {
            description: 'The description of the team\n',
            type: 'string'
          },
          privacy: {
            description: 'The privacy of the team\n',
            type: 'string',
            enum: ['secret', 'closed']
          },
          parent: {
            description: 'The slug of the parent team\n',
            type: 'string'
          },
          members: {
            description: 'A list of members of the team\n',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                login: {
                  description: 'The username of the member\n',
                  type: 'string'
                },
                role: {
                  description: 'The role of the member\n',
                  type: 'string',
                  enum: ['member', 'maintainer']
                }
              },
              required: ['login', 'role']
            }
          }
        },
        required: ['name', 'privacy']
      }
    },
    behaviours: {
      type: 'object',
      description: 'A list of behaviours to apply to the organization\n',
      properties: {
        unknown_teams: {
          description: 'Behaviour to apply if an unknown teams is found\n',
          type: 'string',
          enum: ['remove', 'warn'],
          default: 'remove'
        },
        unknown_members: {
          description: 'Behaviour to apply if an unknown member is found\n',
          type: 'string',
          enum: ['remove', 'warn'],
          default: 'remove'
        },
        unknown_collaborator: {
          description: 'Behaviour to apply if an unknown member is found\n',
          type: 'string',
          enum: ['remove', 'warn'],
          default: 'remove'
        }
      }
    }
  },
  required: ['org'],
  additionalProperties: false
};
