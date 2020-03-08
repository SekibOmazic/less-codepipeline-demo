const express = require("express");

const app = express();

const HOST = "0.0.0.0";
const PORT = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (_req, res) => {
  res.send('<h1 style="color:green;">Hello from Fargate</h1> \n');
});

app.listen(PORT, HOST);
console.log(`Running on http://localhost:${PORT}`);

module.exports = app;
