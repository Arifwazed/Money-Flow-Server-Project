const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 3000;

// middleware
app.use(cors())
app.use(express.json())



// money_flow_user
// izFbDgKiYGSEIDq0
// console.log(process.env)
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gafegcj.mongodb.net/?appName=Cluster0`;


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
    // await client.connect();

    const userDB = client.db('money_flow_db');
    const transactionCollection = userDB.collection('transactions');
    const usersCollection = userDB.collection('users');

    // middlewire
    const verifyAdmin = async (req, res, next) => {
      const email = req.query.email || req.headers.email;

      if (!email) {
        return res.status(401).send({ message: 'Unauthorized access' });
      }

      const user = await usersCollection.findOne({ email });

      if (!user || user.role !== 'admin') {
        return res.status(403).send({ message: 'Forbidden: Admin only' });
      }

      next();
    };

    /////----- USERS APIs -----//////
    // create user in db
    app.post('/users',async(req,res)=>{
      const newUser = req.body;
      newUser.role = 'user';
      newUser.createdAt = new Date();

      const email = newUser.email;
      const query = { email: email}
      // const query = { uid: newUser.uid };
      const existingUser = await usersCollection.findOne(query);
      if(existingUser){
        res.send({ message: 'user already exits. do not need to insert again' })
      }
      else{
        const result = await usersCollection.insertOne(newUser);
        res.send(result)
      }
    }) 
    // get user role by uid
    app.get('/users/:uid', async (req, res) => {
      const uid = req.params.uid;

      const user = await usersCollection.findOne({ uid });

      if (!user) {
        return res.status(404).send({ role: null });
      }

      res.send({
        uid: user.uid,
        role: user.role
      });
    });
    // get all users
    app.get('/users', async (req, res) => {
      const role = req.query.role;
      let query = {};

      if (role) {
        query.role = role;
      }

      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });
    // delete user
    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);

      res.send(result);
    });
    // /Promote user → admin
    app.patch('/users/:id/role', async (req, res) => {
      const id = req.params.id;
      const { role } = req.body;

      if (role !== 'admin') {
        return res.status(400).send({ message: 'Invalid role' });
      }

      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: { role: 'admin' }
      };

      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    });




    ////---- TRANSACTION APIs---- /////

    // find transaction based on email
    app.get('/transactions',async(req,res)=> {
        console.log(req.query)
        const email = req.query.email;
        const query = {};
        if(email){
            query.email = email;
        }

        const cursor = transactionCollection.find(query).sort({date: -1});
        const result = await cursor.toArray();
        res.send(result)
    })
    // Admin: fetch all transactions
    app.get('/transactions/admin', verifyAdmin, async (req, res) => {
      const cursor = transactionCollection.find({}).sort({date: -1});
      const result = await cursor.toArray();
      res.send(result);
    });
    // USER → own transactions only (email-based)
  // app.get('/transactions', async (req, res) => {
  //   const email = req.query.email;

  //   if (!email) {
  //     return res.status(400).send({ message: 'Email is required' });
  //   }

  //   const result = await transactionCollection
  //     .find({ email })
  //     .sort({ date: -1 })
  //     .toArray();

  //   res.send(result);
  // });


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
      const email = req.query.email;
      if (!email) {
        return res.status(401).send({ message: 'Unauthorized' });
      }
      const id = req.params.id;
      const updateTransaction = req.body;
      const query = {_id: new ObjectId(id)}
      const update = {
          $set: {
              // amount: updateTransaction.amount,
              // category: updateTransaction.category
              type: updateTransaction.type,
              category: updateTransaction.category,
              amount: updateTransaction.amount,
              description: updateTransaction.description,
              date: updateTransaction.date
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
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } 
  finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Money Flow is running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})