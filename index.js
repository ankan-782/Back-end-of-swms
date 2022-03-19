const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const admin = require("firebase-admin");
const cors = require('cors');
require('dotenv').config();
const serviceAccount = require('./smart-waste-management-firebase-adminsdk.json');

const app = express();
const port = process.env.PORT || 5000;


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wipcb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const idToken = req.headers?.authorization.split(' ')[1];
        try {
            const deCodedUser = await admin.auth().verifyIdToken(idToken);
            req.deCodedEmail = deCodedUser?.email;
        }
        catch {

        }
    }
    next();
}

async function run() {
    try {
        await client.connect();
        console.log('connected successfully');
        const database = client.db("smart_waste_management_system");
        const truckDriverUsers = database.collection("truckDriverUsers");
        const cityCorporationUsers = database.collection("cityCorporationUsers");

        //save to city corporation users database collection
        app.post('/cityCorporationUsers', async (req, res) => {
            const cityCorpUserInfos = req.body;
            const result = await cityCorporationUsers.insertOne(cityCorpUserInfos);
            res.json(result);
        });

        //load city corporation users from database collection
        app.get('/cityCorporationUsers', verifyToken, async (req, res) => {
            console.log(req.deCodedEmail);
            const cursor = cityCorporationUsers.find({});
            const cityCorpUsers = await cursor.toArray();
            res.send(cityCorpUsers);
        })

        //save to truck drivers users database collection
        app.post('/truckDriverUsers', async (req, res) => {
            const truckDriverInfos = req.body;
            const query = { nid: truckDriverInfos.nid };
            const existingUser = await truckDriverUsers.findOne(query);
            if (existingUser) {
                res.json({ message: 'User is already exist' })
            }
            else {
                const result = await truckDriverUsers.insertOne(truckDriverInfos);
                console.log(result);
                res.json(result);
            }
        });

        //load truck driver users from database collection
        app.get('/truckDriverUsers', async (req, res) => {
            const cursor = truckDriverUsers.find({});
            const truckDrivers = await cursor.toArray();
            res.send(truckDrivers);
        })

        //load specific truck driver info by id from database collection for navbar
        app.get('/truckDriverUsers/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const specificTruckDriver = await truckDriverUsers.findOne(query);
            res.send(specificTruckDriver);
        })

        //load specific truck driver info by nid from database collection for login for truck driver
        app.get('/truckDriverUsers/details/:nid', async (req, res) => {
            const nid = req.params.nid;
            const query = { nid: nid };
            const specificTruckDriver = await truckDriverUsers.findOne(query);
            res.send(specificTruckDriver);
        })

    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('hello from node and express')
})

app.listen(port, () => {
    console.log('listening to port', port);
})