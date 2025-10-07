export interface Service {
  id: string;
  name: string;
  description: string;
  version: string;
  icon: string;
  isSubscribed: boolean;
  endpoints: {
    auth: string;
    status: string;
    loginStatus: string;
    subscribe: string;
    unsubscribe: string;
  };
  oauthConnected?: boolean;
  subscribed?: boolean;
}
