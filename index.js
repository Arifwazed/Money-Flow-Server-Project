const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 3000;

// middleware
app.use(cors())
app.use(express.json())

// money_flow_user
// izFbDgKiYGSEIDq0

const uri = "mongodb+srv://money_flow_user:izFbDgKiYGSEIDq0@cluster0.gafegcj.mongodb.net/?appName=Cluster0";


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get('/',(req,res)=> {
    res.send('Money Flow is running')
})

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userDB = client.db('money_flow_db');
    const transactionCollection = userDB.collection('transactions');
    const usersCollection = userDB.collection('users');

    // USERS APIs
    // find transaction based on email
    app.get('/transactions',async(req,res)=> {
        console.log(req.query)
        const email = req.query.email;
        const query = {};
        if(email){
            query.email = email;
        }

        const cursor = transactionCollection.find(query);
        const result = await cursor.toArray();
        res.send(result)
    })
    // find single transaction based on id
    app.get('/transactions/:id',async(req,res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await transactionCollection.findOne(query);
        res.send(result)
    })
    
    // create transaction
    app.post('/transactions',async(req,res)=> {
        const newTransaction = req.body;
        const result = await transactionCollection.insertOne(newTransaction);
        res.send(result)
    })
    // update transaction
    app.patch('/transactions/:id',async(req,res) => {
        const id = req.params.id;
        const updateTransaction = req.body;
        const query = {_id: new ObjectId(id)}
        const update = {
            $set: {
                amount: updateTransaction.amount,
                category: updateTransaction.category
            }
        }
        const result = await transactionCollection.updateOne(query,update)
        res.send(result)
    })
    // delete transaction
    app.delete('/transactions/:id',async(req,res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await transactionCollection.deleteOne(query)
        res.send(result)
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } 
  finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})