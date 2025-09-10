import dotenv from 'dotenv';

dotenv.config();

interface MalConfig {
  clientId: string | undefined;
  clientSecret: string | undefined;
  redirectUri: string;
}

interface Config {
  mal: MalConfig;
}

const config: Config = {
  mal: {
    clientId: process.env.MAL_CLIENT_ID,
    clientSecret: process.env.MAL_CLIENT_SECRET,
    redirectUri: `${process.env.BASE_URL}/auth/mal/callback`
  }
};

export default config;
