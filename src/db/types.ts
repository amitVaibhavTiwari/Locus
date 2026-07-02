export interface UsersTable {
  id: string;
  email: string;
  username: string;
  password_hash: string | null;
  avatar_url: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountsTable {
  id: string;
  user_id: string;
  type: string;
  provider: string;
  provider_account_id: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
}

export interface EmailVerificationTokensTable {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface PasswordResetTokensTable {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface OrganizationsTable {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMembersTable {
  id: string;
  organization_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  last_active_at: string | null;
}

export interface OrganizationInvitationsTable {
  id: string;
  organization_id: string;
  email: string;
  role: "admin" | "member";
  token: string;
  invited_by: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface WorkspacePreferencesTable {
  id: string;
  organization_id: string;
  display_name: string | null;
  brand_color: string | null;
  logo_url: string | null;
  allow_admin_invite: number;
  updated_at: string;
}

export interface UserPreferencesTable {
  id: string;
  user_id: string;
  pinned_project_ids: string;
  active_organization_id: string | null;
  updated_at: string;
}

export interface PendingVerificationsTable {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  otp_hash: string;
  invite_token: string | null;
  expires_at: string;
  created_at: string;
}

export interface Database {
  users: UsersTable;
  accounts: AccountsTable;
  email_verification_tokens: EmailVerificationTokensTable;
  password_reset_tokens: PasswordResetTokensTable;
  organizations: OrganizationsTable;
  organization_members: OrganizationMembersTable;
  organization_invitations: OrganizationInvitationsTable;
  workspace_preferences: WorkspacePreferencesTable;
  user_preferences: UserPreferencesTable;
  pending_verifications: PendingVerificationsTable;
}
