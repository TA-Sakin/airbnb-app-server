const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const app = express();

const port = process.env.PORT || 5000;
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.yarvpbq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const usersCollection = client.db("airbnb-app").collection("users");
    const propertiesCollection = client
      .db("airbnb-app")
      .collection("properties");

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      const token = jwt.sign(
        { email: email },
        process.env.SECRET_ACCESS_TOKEN,
        { expiresIn: "1d" }
      );
      res.send({ result, token });
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});