
const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//middlewares
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.pqcfxjd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const propertCollection = client.db('allProperties').collection('properties')
    const reviewsCollection = client.db('allProperties').collection('reviews')
    const wishlistCollection = client.db('allProperties').collection('wishlists')

    //Propert section CRUD Operation
    app.get('/properties', async(req, res) => {
        const result = await propertCollection.find().toArray()
        res.send(result)
    })

    app.get('/properties/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await propertCollection.findOne(query)
        res.send(result)
    })


    //Review section CRUD Operation

    app.get('/reviews', async(req, res) => {
        const result = await reviewsCollection.find().toArray()
        res.send(result)
    })

    app.get('/reviews/:id', async(req,res) => {
      const id = req.params.id;
      const filter = {__id: new ObjectId(id)}
      const result = reviewsCollection.find(filter)
      res.send(result)
    })

    app.post('/reviews', async(req, res) => {
        const review = req.body;
        const result = await reviewsCollection.insertOne(review)
        res.send(result);
    })

    //Wishlist section Backend work
    app.post('/wishlists',async(req, res) => {
      const propert = req.body;
      const result = await wishlistCollection.insertOne(propert);
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('final assignment server is running')
})

app.listen(port, () => {
    console.log(`Final Assignment Server Is Running On Port: ${port}`);
})
