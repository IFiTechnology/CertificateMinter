const mongoose = require("mongoose");

const db = `mongodb://localhost:27017/web3-lms`;

module.exports = () => {
  mongoose
    .connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(() => {
      console.log(`Connected to ${db}`);
    })
    .catch((err) => {
      return console.log(err.message);
    });
};
