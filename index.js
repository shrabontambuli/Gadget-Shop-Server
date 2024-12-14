const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//  middleware

app.use(cors());
app.use(express.json());

// token verification

const verifyIWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.send({ error: 'No token provided' });
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_KEY_TOKEN, (err, decoded) => {
        if (err) {
            return res.send({ message: 'Invalid token' });
        }
        req.decoded = decoded;
        next();
    });
}


// verify seller

const verifySeller = async (req, res, next) => {
    const email = req.decoded.email;
    const query = { email: email };
    const user = await userCollection.findOne(query);
    if (user?.role !== "seller") {
        return res.send({ message: 'Forbidden access' });
    }
    next();
};

// mongodb 

const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ezafyme.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

const client = new MongoClient(url, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
})

const userCollection = client.db('gadgetShop').collection('users');
const productCollection = client.db('gadgetShop').collection('products');


const dbConnect = async () => {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        // get user information

        app.get("/user/:email", async (req, res) => {
            const query = { email: req.params.email };
            const user = await userCollection.findOne(query);
            res.send(user);
        });


        // insert user

        app.post("/users", async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const existingUser = await userCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: "User already exists" });
            }

            const result = await userCollection.insertOne(user);
            res.send(result);
        });


        // add products

        app.post("/add-products", verifyIWT, verifySeller, async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        });


        // End

    } catch (e) {
        console.log(error.name, error.message)
    }
};

dbConnect();

// api

app.get('/', (req, res) => {
    res.send('Hello, World!');
});


// jwt

app.post('/authentication', async (req, res) => {
    const userEmail = req.body
    const token = jwt.sign(userEmail, process.env.ACCESS_KEY_TOKEN, {
        expiresIn: "10d"
    });
    res.send({ token });
});





app.listen(port, () => console.log(`Server running on port ${port}`));