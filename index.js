require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
  }),
);

app.get("/api", (req, res) => {
  res.status(200).json({
    message: "Welcome to ABNovaMart APIs!",
  });
});

app.use("/api/auth", require("./src/routes/auth.routes"));

app.use("/api/product-categories", require("./src/routes/category.routes"));

app.use("/api/products", require("./src/routes/product.routes"));

require("./src/config/db")();

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

module.exports = app;
