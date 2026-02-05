import express from "express";
import helmet from "helmet";
import path from "path";

require("dotenv").config();

const server = express();
server.use(helmet());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(express.static(path.join(__dirname, "../public")));

server.use("/", (req, res) => {
  res.json("Olá mundo!");
});

server.listen(process.env.PORT, () => {
  console.log(
    `O servidor se encontra na porta http://localhost:${process.env.PORT}/`,
  );
});
