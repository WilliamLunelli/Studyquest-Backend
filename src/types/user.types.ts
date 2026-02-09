export type LoginResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    avatar: string | null;
    bio: string | null;
    level: number;
    xp: number;
  };
};
