import { createConsola } from "consola";

export default function createLogger() {
  return createConsola({
    reporters: [
      {
        log: (logObj) => {
          console.log(JSON.stringify(logObj));
        }
      }
    ]
  });
}
