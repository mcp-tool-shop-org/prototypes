export interface ProjectConfig {
  name: string;
  ueVersion?: string;
  description?: string;
  conventions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
