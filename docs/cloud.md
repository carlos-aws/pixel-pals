# Cloud mode: play on any device with progress saved online

Pixel Pals has two ways to run:

| | Local mode (default) | Cloud mode |
|---|---|---|
| Where progress lives | In the browser of one device | In your own AWS account (DynamoDB) |
| Sign-in | None | Google account (parents), via Amazon Cognito |
| Devices | One device per copy of the game | Any device; each player open on **one device at a time** |
| Hosting | GitHub Pages, any static host, or `npm start` | S3 + CloudFront created by the stack |
| Cost | Free | Free tier covers a family; a few cents a month at most |

Nothing changes in the game itself: the same files are served, plus a small
`config.json` that tells the game to use the cloud. The deploy script creates
that file for you.

## What gets created in AWS

One CloudFormation stack (`infra/template.yaml`) with:

- **S3 bucket + CloudFront distribution**: serves the game over HTTPS.
- **Cognito user pool** with **Google** as identity provider: sign-in. A tiny
  Lambda "pre-sign-up" trigger only lets the Google accounts you list in
  `ALLOWED_EMAILS` in, so nobody else can use your backend.
- **DynamoDB table**: one item per player profile (about 10-20 KB each).
- **Lambda + API Gateway (HTTP API)**: the profile API, protected by a JWT
  authorizer that checks the Cognito token on every request.

The "one device at a time" rule works with **leases**: opening a player takes
a 3-minute lease for that device, and every save renews it. Another device
sees the player as *IN USE* and can *Play here instead* (take over); the first
device is then sent back to the player list on its next save. When a device
puts the app in the background or the player switches, the lease is released
right away, so moving from the tablet to the phone is instant. If a device
crashes or loses connectivity, the lease simply expires after 3 minutes.

## Deploy (about 15 minutes the first time)

### 1. Google OAuth client

1. Go to <https://console.cloud.google.com/apis/credentials> (create a project
   if you have none).
2. Configure the *OAuth consent screen* (External, add your own emails as test
   users, or publish it; scopes: email, profile, openid).
3. *Create credentials → OAuth client ID → Web application*.
4. Under **Authorized JavaScript origins** add
   `https://<prefix>.auth.<region>.amazoncognito.com`
   and under **Authorized redirect URIs** add
   `https://<prefix>.auth.<region>.amazoncognito.com/oauth2/idpresponse`,
   where `<prefix>` is the `COGNITO_DOMAIN_PREFIX` you will choose below and
   `<region>` your AWS region (e.g. `eu-west-1`).
5. Copy the client ID and secret.

### 2. AWS

Install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
and run `aws configure` with an account/user that can create the resources
above (an administrator user of your own account is the simplest).

```
cp infra/.env.example infra/.env   # then edit it
./infra/deploy.sh
```

The script packages the Lambda code, creates or updates the stack, uploads the
game to S3 with a generated `config.json`, and invalidates the CloudFront cache.
At the end it prints the game URL. Open it on each device, sign in with an
allowed Google account, and add the players.

Later updates: run `./infra/deploy.sh` again (or `./infra/deploy.sh --site-only`
when only the game files changed). `./infra/deploy.sh --outputs` prints the URLs.

### 3. On the devices

Open the game URL in Chrome and choose *Add to Home screen*. Each device keeps
its own sign-in (60 days), so the children never see the Google screen after
the first time.

## Moving existing progress to the cloud

In the local version: *Parents → Export save file*. In the cloud version:
*Parents → Import save file*. Players from the file are added to the cloud.

## Trying cloud mode without AWS

`npm run mock-cloud` starts a local server (http://localhost:8090) that mimics
the backend with a fake sign-in and an in-memory store. Open it in two
browsers to see the *IN USE* / take-over behaviour. It is also what
`npm run e2e` uses to test cloud mode.

## Removing everything

Delete the stack with `aws cloudformation delete-stack --stack-name pixel-pals`
(after emptying the S3 buckets), or from the CloudFormation console. Delete the
OAuth client in Google Cloud Console.

## Notes

- Progress is only saved while online; the game needs a connection to open a
  player in cloud mode. Short drops are fine: saves are retried and the lease
  is kept for 3 minutes.
- Tokens are stored in the browser's localStorage of each device; use *Sign
  out* on a device you give away.
- API requests are only accepted with a valid Cognito token, and each account
  can only read and write its own profiles.
