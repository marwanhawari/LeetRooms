# Contributing Guidelines

## How to contribute
1. Fork this repository and clone it onto your machine.
    ```sh
    git clone https://github.com/<my_account>/LeetRooms
    ```
    
1. Create a new branch and switch to it.

    ```sh
    cd LeetRooms
    git checkout -b <new_branch_name>
    ```

1. Make changes to the code on that branch and commit.
1. Push the commit to GitHub.
    ```sh
    git push origin <new_branch_name>
    ```

1. Make a pull request on GitHub.

## Tech stack
* #### Extension web app
    * React
    * TypeScript
    * Vite
    * Tailwind
* #### Landing page website
    * Astro
    * Tailwind
* #### Backend
    * Node.js
    * Express
    * TypeScript
    * Socket.io
    * PostgreSQL
    * Redis

## Set up the development environment

1. Create a `.env` file

```sh
###########################################################################################################
################################################ Variables ################################################
###########################################################################################################

TLD="localhost"
NODE_ENV="development"
EXPRESS_SESSION_SECRET="keyboard cat"

# Database credentials
DATABASE_USER="postgres"
DATABASE_PASSWORD="postgres"
REDIS_PASSWORD="redis"

# OAuth app credentials
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
TWITCH_CLIENT_ID=""
TWITCH_CLIENT_SECRET=""

# Production specific variables - leave blank in development
COOKIE_DOMAIN=""
SOCKETIO_USER=""
SOCKETIO_PASSWORD=""
LOKI_URL=""


###########################################################################################################
################################################ Constants ################################################
###########################################################################################################

# DB connection URLs
DATABASE_NAME="leetrooms"
DATABASE_PORT="5432"
REDIS_USER="default"
REDIS_PORT="6379"
DATABASE_URL="postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@localhost:${DATABASE_PORT}/${DATABASE_NAME}"
REDIS_URL="redis://${REDIS_USER}:${REDIS_PASSWORD}@localhost:${REDIS_PORT}"

# Domain configuration
BASE_URL="leetrooms.${TLD}"
WEBSITE_URL="https://${BASE_URL}"
APP_URL="https://app.${BASE_URL}"
SERVER_URL="https://api.${BASE_URL}"

# Vite env variables
VITE_SERVER_URL="${SERVER_URL}"
VITE_APP_URL="${APP_URL}"

# Server configuration
SUCCESS_REDIRECT_URL="${WEBSITE_URL}/sign-in-success"
FAILURE_REDIRECT_URL="${WEBSITE_URL}/sign-in-failure" 
CORS_ORIGIN="${APP_URL}"

# Retain color in Turborepo output
FORCE_COLOR="1"
```

2. Create an OAuth app for development

You will need to create at least one OAuth app for development purposes. Use these links to get a `CLIENT_ID` and `CLIENT_SECRET` and fill in the corresponding values in your `.env` file. When you register an app, set the callback URL to https://api.leetrooms.localhost/auth/github/callback

Note: Google doesn't like the `.localhost` domain we use for development, so I don't include Google here.

* GitHub: https://github.com/settings/developers
* Discord: https://discord.com/developers/applications
* Twitch: https://dev.twitch.tv/console/apps

3. Load the environment variables into your current environment and install application dependencies separately.

```sh
# LeetRooms/

source env.sh
```

```sh
# LeetRooms/server
# LeetRooms/extension
# LeetRooms/website

npm install
```

4. Start the PostgreSQL and Redis docker containers
```sh
# LeetRooms/server

docker-compose up
```

5. Initialize the database and seed the database with questions
```sh
# LeetRooms/server

npm run prisma-migrate && npm run prisma-seed
```

> [!TIP]
> Sometimes the `npm run prisma-seed` command will fail with a 403 response. If this is the case, just run it again and it should eventually work.

6. Start all the dev servers separately
```sh
# LeetRooms/server
# LeetRooms/extension
# LeetRooms/website

npm run dev
```

7. Start the HTTPS reverse-proxy server

* LeetRooms needs to set the `SameSite` cookie attribute to `none` in order to send the LeetRooms cookies from https://leetcode.com to the LeetRooms server. Setting it to `none` also requires you to use secure cookies (`https` only). This is fine in production, but in development `localhost` is not `https`. To make this work in development, I use a Caddy proxy server that will automatically generate self signed certificates to serve `localhost` over `https`. Read about local `https` [here](`https://caddyserver.com/docs/automatic-https`) and about Caddy [here](https://web.dev/when-to-use-local-https/).
* Install caddy then run the server:
```sh
# LeetRooms/

caddy run
```

You're done! You should now be able to access 3 different services:
* React app: https://app.leetrooms.localhost
* Astro website: https://leetrooms.localhost
* Express server: https://api.leetrooms.localhost

You might get a `Your connection is not private` warning in Chrome, but it's okay to proceed.

The extension itself mostly just adds an iframe to the LeetCode problem page, so you can do most frontend development just through https://app.leetrooms.localhost. However, if you want to test something about the extension itself or if you want to see how your changes will look on a LeetCode problem page, you need to build it and load the unpacked extension:
* If you have the official version of the extension installed, make sure to disable it.
* Run `npm run build:dev` to create a `extension/dist/` folder.
* Open chrome to chrome://extensions.
* Enable "Developer mode" in the top right corner.
* Click the "Load unpacked" button in the top left and select the `dist/` folder you just created.
    * Note: You might get this warning `Unrecognized manifest key 'browser_specific_settings'`, but this is safe to ignore. The manifest key `browser_specific_settings` is required in some browsers (like Firefox) but not Chrome so Chrome gives a warning.
* Now when you make changes, you will need to rebuild - however, all you need to do after generating a new `dist/` folder is press the refresh icon on the extension card on chrome://extensions (you don't need to "Load unpacked" again).
* Refresh the LeetCode page and you should see your changes.
