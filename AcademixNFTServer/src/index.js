require("express-async-errors");
const express = require("express");
const cors = require("cors");
const app = express();

// require("./db")();

const academixRouter = require("./academix-router");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors());

app.use("/ping", (req, res) => res.send(`Live`));
app.use("/api/v1", academixRouter());

app.use((req, res, next) => {
  res.status(404).send({
    status: 404,
    message: "Not Found",
    data: null,
  });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  const data = err.data || null;

  res.status(status).send({
    status,
    message,
    data,
  });
});

const PORT = process.env.PORT || 3500;
const mode = process.env.NODE_ENV;

app.listen(PORT, () => {
  console.log(`app listening at port ${PORT} in ${mode} mode`);
});
