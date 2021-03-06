const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
require('dotenv').config();
const fileUpload = require('express-fileupload');

const app = express();
const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wipcb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        console.log('connected successfully');
        const database = client.db("smart_waste_management_system");
        const truckDriverUsers = database.collection("truckDriverUsers");
        const cityCorporationUsers = database.collection("cityCorporationUsers");

        //save to city corporation users database collection
        app.post('/cityCorporationUsers', async (req, res) => {
            const email = req.body.email;
            const query = { email: email };
            const existingUser = await cityCorporationUsers.findOne(query);
            if (existingUser) {
                res.json({ message: 'এই ইমেইল আইডি দিয়ে ইতিমধ্যে এডমিন ইউজার তৈরি হয়েছে' })
            }
            else {
                const displayName = req.body.name;
                const pic = req.files.photo;
                const picData = pic.data;
                const enCodedPic = picData.toString('base64');
                const photoBuffer = Buffer.from(enCodedPic, 'base64');
                const cityCorpUserInfos = {
                    displayName,
                    email,
                    photo: photoBuffer
                }
                const result = await cityCorporationUsers.insertOne(cityCorpUserInfos);
                res.json(result);
            }
        });

        //load specific city corporation user info by email from database collection for navbar for login
        app.get('/cityCorporationUsers/searchByEmail/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const specificCityCorpUser = await cityCorporationUsers.findOne(query);
            if (!specificCityCorpUser) {
                res.json({ message: 'এই ইমেইল আইডি কোন এডমিন ইউজার তৈরি হয়নি' })
            }
            else {
                res.send(specificCityCorpUser);
            }
        })

        //load specific city corporation user info by id from database collection for navbar for display photo
        app.get('/cityCorporationUsers/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const specificCityCorpUser = await cityCorporationUsers.findOne(query);
            res.send(specificCityCorpUser);
        })

        //load city corporation users from database collection for dashboard
        app.get('/cityCorporationUsers', async (req, res) => {
            console.log(req.deCodedEmail);
            const cursor = cityCorporationUsers.find({});
            const cityCorpUsers = await cursor.toArray();
            res.send(cityCorpUsers);
        })


        //save to truck drivers users database collection
        app.post('/truckDriverUsers', async (req, res) => {
            const nid = req.body.nid;
            const query = { nid: nid };
            const existingUser = await truckDriverUsers.findOne(query);
            if (existingUser) {
                res.json({ message: 'এই এন আই ডি দিয়ে ইতিমধ্যে ইউজার তৈরি হয়েছে' })
            }
            else {
                const displayName = req.body.name;
                const age = req.body.age;
                const gender = req.body.gender;
                const phone = req.body.phone;
                const pin = req.body.pin;
                const dln = req.body.dln;
                const address = req.body.address;
                const pic = req.files.photo;
                const picData = pic.data;
                const enCodedPic = picData.toString('base64');
                const photoBuffer = Buffer.from(enCodedPic, 'base64');
                const truckDriverInfos = {
                    displayName,
                    age,
                    gender,
                    phone,
                    pin,
                    nid,
                    dln,
                    address,
                    photo: photoBuffer
                }
                const result = await truckDriverUsers.insertOne(truckDriverInfos);
                res.json(result);
            }
        });

        //load specific truck driver info by nid from database collection for login for truck driver in navbar and also for searching specific driver
        app.get('/truckDriverUsers/storeAndUpdateInfo/:nid', async (req, res) => {
            const nid = req.params.nid;
            const query = { nid: nid };
            const specificTruckDriver = await truckDriverUsers.findOne(query);
            if (!specificTruckDriver) {
                res.json({ message: 'এই এন আই ডি দিয়ে কোন ইউজার তৈরি হয়নি' })
            }
            else {
                res.send(specificTruckDriver);
            }
        })

        //update specific truckDriver infos
        app.put('/truckDriverUsers/storeAndUpdateInfo/:nid', async (req, res) => {
            const nid = req.params.nid;
            const updatedDriverInfo = req.body;
            const pic = req.files.photo;
            const picData = pic.data;
            const enCodedPic = picData.toString('base64');
            const photoBuffer = Buffer.from(enCodedPic, 'base64');
            const filter = { nid: nid };
            const updateDoc = {
                $set: {
                    displayName: updatedDriverInfo.displayName,
                    age: updatedDriverInfo.age,
                    gender: updatedDriverInfo.gender,
                    phone: updatedDriverInfo.phone,
                    pin: updatedDriverInfo.pin,
                    nid: updatedDriverInfo.nid,
                    dln: updatedDriverInfo.dln,
                    address: updatedDriverInfo.address,
                    photo: photoBuffer
                },
            };
            const result = await truckDriverUsers.updateOne(filter, updateDoc);
            res.json(result);
        })

        //delete specific driver
        app.delete('/truckDriverUsers/storeAndUpdateInfo/:nid', async (req, res) => {
            const nid = req.params.nid;
            const query = { nid: nid };
            const result = await truckDriverUsers.deleteOne(query);
            res.json(result);
        })

        //update and insert specific truckDriver info (stsArea, truckNo, cityCorp)
        app.put('/truckDriverUsers/updateDailyTask', async (req, res) => {
            const updatedDriverInfo = req.body;
            const filter = { nid: updatedDriverInfo?.nid };
            const updateDoc = {
                $set: {
                    stsArea: updatedDriverInfo.stsArea,
                    truckNo: updatedDriverInfo.truckNo,
                    cityCorp: updatedDriverInfo.cityCorp,
                },
            };
            const result = await truckDriverUsers.updateOne(filter, updateDoc);
            res.json(result);
        })

        //load specific truck driver info by id from database collection for navbar for displaying photo
        app.get('/truckDriverUsers/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const specificTruckDriver = await truckDriverUsers.findOne(query);
            res.send(specificTruckDriver);
        })

        //load all truck driver users from database collection for dashboard
        app.get('/truckDriverUsers', async (req, res) => {
            const cursor = truckDriverUsers.find({});
            const truckDrivers = await cursor.toArray();
            res.send(truckDrivers);
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