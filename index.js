const express = require("express");
const cors = require("cors");
var jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//middlewares
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.pqcfxjd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const propertCollection = client
      .db("allProperties")
      .collection("properties");
    const reviewsCollection = client.db("allProperties").collection("reviews");
    const wishlistCollection = client
      .db("allProperties")
      .collection("wishlists");
    const usersCollection = client.db("allProperties").collection("users");
    const offeredCollection = client.db("allProperties").collection("offered");

    //jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1hr",
      });
      res.send({ token });
    });

    //Offered property related api
    app.post('/offered', async(req, res) => {
      const item = req.body;
      const result = await offeredCollection.insertOne(item)
      res.send(result)
    })

    app.get('/offered', async(req, res) => {
      const result = await offeredCollection.find().toArray()
      res.send(result)
    })

    app.get('/offered/buyer_email/:email', async(req, res) => {
      const email = req.params.email;
      const query = {buyer_email: email}
      const result = await offeredCollection.find(query)
      res.send(result)
    })

    app.patch("/offered/accept/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: 'accepted'
        },
      };
      const result = await offeredCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    app.patch("/offered/reject/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: 'rejected'
        },
      };
      const result = await offeredCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    //users related api
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const userExists = await usersCollection.findOne(query);
      if (userExists) {
        return res.send({ message: "User Already Exists" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Verify Token
    const verifyToken = (req, res, next) => {
      console.log(req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Unauthorize Access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "Unauthorize Access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    app.get("/users", verifyToken, async (req, res) => {
      // console.log(req.headers);
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/admin/:email",verifyToken, async (req, res) => {
      const email = req.params?.email;
      if (email !== req.decoded?.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      // res.send(result)
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    app.get("/users/agent/:email",verifyToken, async (req, res) => {
      const email = req.params?.email;
      if (email !== req.decoded?.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      // res.send(result)
      let agent = false;
      if (user) {
        agent = user?.role === "agent";
      }
      res.send({ agent });
    });

    app.delete("/users/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewsCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    app.patch("/users/agent/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "agent",
        },
      };
      const result = await usersCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    //Propert section CRUD Operation
    app.get("/properties", async (req, res) => {
      const result = await propertCollection.find().toArray();
      res.send(result);
    });

    app.get("/properties/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await propertCollection.findOne(query);
      res.send(result);
    });

    app.get('/properties/:email', async(req, res) => {
      const email = req.params.email;
      const filter = {agent_email: email}
      const result = await propertCollection.find(filter)
      res.send(result)
    })

    app.put('/properties/:id', async(req, res) => {
      const id = req.params.id;
        const data = req.body;
        const filter = {
            _id: new ObjectId(id)
        };
        const option = {upsert: true}
        const updateData = {
            $set: {
                property_title: data.property_title,
                property_image: data.property_image,
                property_location: data.property_location,
                agent_name: data.agent_name,
                agent_image: data.agent_image,
                agent_email: data.agent_email,
                price_range: data.price_range
            }
        }
        const result = await propertCollection.updateOne(filter, updateData, option)
        res.send(result)
    })

    app.patch("/properties/verified/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          verification: 'verified'
        },
      };
      const result = await propertCollection.updateOne(query, updatedDoc);
      res.send(result);
    });
    app.patch("/properties/rejected/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          verification: 'rejected'
        },
      };
      const result = await propertCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    app.delete('/properties/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await propertCollection.deleteOne(query)
      res.send(result)
    })

    app.post('/properties', async(req, res) => {
      const property = req.body;
      const result = await propertCollection.insertOne(property);
      res.send(result);
    })

    

    //Review section CRUD Operation

    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { __id: new ObjectId(id) };
      const result = reviewsCollection.find(filter);
      res.send(result);
    });

    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { __id: new ObjectId(id) };
      const result = reviewsCollection.deleteOne(filter);
      res.send(result);
    });

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    //Wishlist section Backend work
    app.post("/wishlists", async (req, res) => {
      const propert = req.body;
      const result = await wishlistCollection.insertOne(propert);
      res.send(result);
    });

    app.get("/wishlists", async (req, res) => {
      const result = await wishlistCollection.find().toArray();
      res.send(result);
    });

    app.get("/wishlists/:id", async (req, res) => {
      const id = res.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishlistCollection.find(query);
      res.send(result);
    });

    app.delete("/wishlists/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishlistCollection.deleteOne(query);
      res.send(result);
    });


    //payment
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100)
    
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types:['card'],
        
      });
    
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("final assignment server is running");
});

app.listen(port, () => {
  console.log(`Final Assignment Server Is Running On Port: ${port}`);
});
