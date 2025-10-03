import { formAction } from "./action";
import { formReaction } from "./reaction";

export interface Mapping {
  id: number;
  name: string;
  description: string;
  action: {
    type: string;
    config: object;
  };
  reactions: [
    {
      type: string;
      config: object;
      delay: number;
    },
  ];
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface formMapping {
  name: string,
  description: string,
  action?: formAction,
  reaction?: formReaction[],
  is_active: boolean,
}