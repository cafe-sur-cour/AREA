export interface AboutAREA {
  id: string;
  name: string;
  icon: string;
  actions: [
    {
      name: string;
      description: string;
      id: number;
    },
  ];
  reactions: [
    {
      name: string;
      description: string;
      id: number;
    },
  ];
}

export interface About {
  server: {
    services: AboutAREA[];
  };
}
