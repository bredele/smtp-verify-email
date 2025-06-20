import { Socket } from "node:net";
import { CONFIG, SMTP_CODES } from "./constants";


const createCommand = {
  helo: (hostname: string) => `EHLO ${hostname}\r\n`,
  mailFrom: (email: string) => `MAIL FROM:<${email}>\r\n`,
  rcptTo: (email: string) => `RCPT TO:<${email}>\r\n`,
  quit: () => "QUIT\r\n",
};

export default async (mailServer: string, email: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    let buffer = "";
    let currentStep = 0; // 0: connecting, 1: helo, 2: mail from, 3: rcpt to

    const cleanup = () => {
      socket.removeAllListeners();
      socket.destroy();
    };

    const handleResponse = (expectedCode: number, nextStep: () => void) => {
      const lines = buffer.split("\r\n");
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        if (line.length >= 3) {
          const code = parseInt(line.substring(0, 3));
          if (code === expectedCode) {
            buffer = lines.slice(i + 1).join("\r\n");
            nextStep();
            return;
          } else if (code >= SMTP_CODES.ERROR_START) {
            cleanup();
            resolve(false);
            return;
          }
        }
      }
    };

    socket.setTimeout(CONFIG.TIMEOUT);

    socket.on("timeout", () => {
      cleanup();
      reject(new Error("Connection timeout"));
    });

    socket.on("error", (error) => {
      cleanup();
      reject(error);
    });

    socket.on("data", (data) => {
      buffer += data.toString();

      switch (currentStep) {
        case 0: // Wait for server greeting (220)
          handleResponse(SMTP_CODES.SERVICE_READY, () => {
            currentStep = 1;
            socket.write(createCommand.helo(CONFIG.HOSTNAME));
          });
          break;
        case 1: // Wait for HELO response (250)
          handleResponse(SMTP_CODES.OK, () => {
            currentStep = 2;
            socket.write(createCommand.mailFrom(CONFIG.FROM_EMAIL));
          });
          break;
        case 2: // Wait for MAIL FROM response (250)
          handleResponse(SMTP_CODES.OK, () => {
            currentStep = 3;
            socket.write(createCommand.rcptTo(email));
          });
          break;
        case 3: // Wait for RCPT TO response (250) - this verifies the email
          handleResponse(SMTP_CODES.OK, () => {
            socket.write(createCommand.quit());
            cleanup();
            resolve(true);
          });
          break;
      }
    });

    socket.on("close", () => {
      if (currentStep < 3) {
        resolve(false);
      }
    });

    socket.connect(CONFIG.PORT, mailServer);
  });
};
