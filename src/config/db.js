require("dotenv").config();
const mongoose = require("mongoose");

const connectToDb = () => {
  mongoose
    .connect(process.env.DATABASE_URL)
    .then(() => console.log("Connected to Database Successfully"))
    .catch((err) => console.log("Error connecting to Database: ", err));
};

module.exports = connectToDb;
