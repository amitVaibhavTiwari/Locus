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

export interface ProjectsTable {
  id: string;
  organization_id: string;
  name: string;
  key: string;
  slug: string;
  description: string | null;
  visibility: "public" | "private";
  priority: string | null;
  archived: number;
  allow_delete_tickets: number;
  allow_manage_sprint: number;
  allow_members_edit: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMembersTable {
  id: string;
  project_id: string;
  user_id: string;
  role: "manager" | "member";
  joined_at: string;
}

export interface BoardsTable {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
}

export interface ColumnsTable {
  id: string;
  board_id: string;
  name: string;
  key: string | null;
  order_index: number;
  wip_limit: number | null;
  created_at: string;
}

export interface LabelsTable {
  id: string;
  organization_id: string;
  project_id: string | null;
  name: string;
  color: string;
  created_at: string;
}

export interface EpicsTable {
  id: string;
  project_id: string;
  organization_id: string;
  name: string;
  description: string | null;
  priority: string;
  status: string;
  owner_id: string | null;
  start_date: string | null;
  end_date: string | null;
  archived: number;
  archived_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SprintsTable {
  id: string;
  project_id: string;
  organization_id: string;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "planned" | "active" | "completed";
  velocity: number | null;
  created_at: string;
  updated_at: string;
}

export interface IssuesTable {
  id: string;
  organization_id: string;
  project_id: string;
  sprint_id: string | null;
  epic_id: string | null;
  board_id: string | null;
  column_id: string | null;
  parent_issue_id: string | null;
  issue_number: number;
  title: string;
  description: string | null;
  type: "task" | "story" | "bug" | "subtask";
  status: string;
  priority: string;
  reporter_id: string;
  assignee_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  edit_permission: "anyone" | "assignee_only" | "reporter_only";
  archived: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueLabelsTable {
  id: string;
  issue_id: string;
  label_id: string;
}

export interface ActivitiesTable {
  id: string;
  organization_id: string;
  project_id: string;
  issue_id: string | null;
  user_id: string;
  type: string;
  payload: string;
  created_at: string;
}

export interface AttachmentsTable {
  id: string;
  issue_id: string;
  organization_id: string;
  filename: string;
  storage_key: string;
  mime_type: string;
  size: number;
  uploaded_by: string;
  created_at: string;
}

export interface IssueCommentsTable {
  id: string;
  issue_id: string;
  organization_id: string;
  user_id: string;
  body: string;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotesTable {
  id: string;
  user_id: string;
  organization_id: string;
  type: "text" | "checklist";
  title: string;
  content: string | null;
  rank: number;
  created_at: string;
  updated_at: string;
}

export interface NoteItemsTable {
  id: string;
  note_id: string;
  text: string;
  checked: number;
  rank: number;
  created_at: string;
}

export interface LinksTable {
  id: string;
  user_id: string;
  organization_id: string;
  label: string;
  url: string;
  tags: string | null;
  rank: number;
  created_at: string;
  updated_at: string;
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
  projects: ProjectsTable;
  project_members: ProjectMembersTable;
  boards: BoardsTable;
  columns: ColumnsTable;
  labels: LabelsTable;
  epics: EpicsTable;
  sprints: SprintsTable;
  issues: IssuesTable;
  issue_labels: IssueLabelsTable;
  activities: ActivitiesTable;
  attachments: AttachmentsTable;
  issue_comments: IssueCommentsTable;
  notes: NotesTable;
  note_items: NoteItemsTable;
  links: LinksTable;
}
