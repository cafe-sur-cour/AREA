export interface Mapping {
  id: number,
  name: String,
  description: String,
  action: {
    type: String,
    config: {}
  },
  reactions: [
    {
      type: String,
      config: {},
      delay: number
    }
  ],
  is_active: boolean,
  created_by: number,
  created_at: String,
  updated_at: String
}
