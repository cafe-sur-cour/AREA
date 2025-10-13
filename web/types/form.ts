import { PayloadField, Action } from './action';
import { Reaction } from './reaction';

export interface ReactionInstance {
  id: string;
  reaction: Reaction | null;
  config: Record<string, unknown>;
  delay: number | null;
  selectedService: string | null;
  dynamicFields: Record<string, boolean>;
}

export interface DynamicTextareaProps {
  name: string;
  placeholder: string;
  required: boolean;
  value: string;
  onChange: (value: string) => void;
  payloadFields: PayloadField[];
  rows?: number;
}

export interface ReactionFormProps {
  onReactionsChange: (reactions: Reaction[]) => void;
  onConfigChange: (config: Record<string, unknown>[]) => void;
  selectedAction?: Action | null;
}
