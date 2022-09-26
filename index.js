const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const usersCollection = client.db("airbnb-app").collection("users");
    const reserveCollection = client.db("airbnb-app").collection("reserves");
    const reviewsCollection = client.db("airbnb-app").collection("reviews");
    const propertiesCollection = client
      .db("airbnb-app")
      .collection("properties");

    app.get("/properties", async (req, res) => {
      const resultsQuery = req.query;
      const { query, page } = resultsQuery;
      if (query) {
        const properties = await propertiesCollection.find({}).toArray();
        const filteredData = properties?.filter((property) =>
          property.fields.property_type.toLowerCase().includes(query)
        );
        res.send(filteredData);
      } else {
        const properties = await propertiesCollection
          .find({})
          .limit(parseInt(page))
          .toArray();
        res.send(properties);
      }
    });

    app.get("/reserve/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const property = await propertiesCollection.findOne(query);
      res.send(property);
    });

    app.get("/reserve", async (req, res) => {
      const email = req.query.email;
      const query = { customerEmail: email };
      const orders = await reserveCollection.find(query).toArray();
      return res.send(orders);
    });

    app.post("/reserve", async (req, res) => {
      const reserve = req.body;
      const result = await reserveCollection.insertOne(reserve);
      res.send({ success: true, result });
    });

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

    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });
    app.get("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { propertyId: id };
      const reviews = await reviewsCollection.find(query).toArray();
      res.send(reviews);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running airbnb app");
});
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
