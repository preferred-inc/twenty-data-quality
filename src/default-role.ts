import { defineApplicationRole } from 'twenty-sdk/define';

import {
  APP_DISPLAY_NAME,
  DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

/**
 * This app only ever reads. It never writes, deletes, or changes settings —
 * so the role it ships with grants read access and nothing else.
 *
 * `canBeAssignedToUsers` is false on purpose. The scaffolded default is true,
 * which would let an admin hand this role to a person and, with it, read access
 * to every record in the workspace. The role exists for the app, not for people.
 */
export default defineApplicationRole({
  universalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  label: `${APP_DISPLAY_NAME} (read-only)`,
  description: `${APP_DISPLAY_NAME} reads records to compute completeness. It never writes.`,
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToUsers: false,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: false,
});
