export interface Board {
  name: string;
  description?: string;
  version: 1;
  columns: ColumnDefinition[];
  labels: LabelDefinition[];
  cardOrder: Record<string, string[]>;
  settings: BoardSettings;
}

export interface ColumnDefinition {
  name: string;
  wipLimit?: number;
  done?: boolean;
  description?: string;
}

export interface LabelDefinition {
  name: string;
  color: string;
}

export type CardPriority = 'critical' | 'high' | 'medium' | 'low';

export interface BoardSettings {
  autoArchiveDays: number;
  defaultPriority: CardPriority;
  defaultColumn: string;
  idFormat: 'alphanumeric6';
}
