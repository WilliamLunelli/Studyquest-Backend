import express from "express";
import helmet from "helmet";
import path from "path";
import routes from "./routes";

import "dotenv/config";

const server = express();
server.use(helmet());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(express.static(path.join(__dirname, "../public")));

server.use("/api", routes);

const PORT = process.env.PORT;

server.listen(Number(PORT), () => {
  console.log(`O servidor se encontra na porta http://localhost:${PORT}/`);
});
