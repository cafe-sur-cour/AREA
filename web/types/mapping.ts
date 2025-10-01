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
