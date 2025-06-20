# smtp-verify-email

Verify email deliverability using raw SMTP handshake and MX lookup.

## Installation

```sh
$ npm install @bredele/smtp-verify-email
```

## Usage

```ts
import verifySmtp from "@bredele/smtp-verify-email";
import getMailServer from "@bredele/get-mail-server";

const mailServer = await getMailServer("example.com");
await verifySmtp(mailServer, "john@example.com");
```
