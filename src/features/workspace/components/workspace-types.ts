export type WorkspaceApplication = {
  id: string;
  vacancy: { title: string; company: string | null };
  tags?: Array<{ tag: WorkspaceTag }>;
};

export type WorkspaceCompany = {
  id: string;
  name: string;
  website: string | null;
  location: string | null;
  notes: string | null;
  _count?: { contacts: number };
};

export type WorkspaceTag = {
  id: string;
  name: string;
  color: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'neutral';
  _count: { applications: number };
};

export type PendingDelete = { id: string; label: string } | null;
