import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const pinoHttpFn: any =
  typeof pinoHttp === "function"
    ? pinoHttp
    : (pinoHttp as any)?.default || (pinoHttp as any)?.pinoHttp || (() => (_req: any, _res: any, next: any) => next?.());

app.use(
  pinoHttpFn({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api", router);

export default app;
