/*      
This module, Ward Management Module consists of this code "wardmodule.js" 
and another two MonogoDB schema files "wardops.js" & "dischargeops.js" and other libraries
The module is functioning in a way to receive API requests to:
1. Add/update ward details
2. Add ward maintenance history
3. Add/update ward medical equipment
4. Add/update nurse assignment to wards along with the shifts details
5. Add/Update Room to wards and bedrooms to rooms and furniture details to rooms
6. Patient addmission and discharge from the ward
*/

//Create the necessary libraries, dotenv is used for hiding the DB credentials while express & mangoose are used for API communicaiton
const express = require('express');
const wardapp = express();
wardapp.use(express.json())
const mongoose = require('mongoose');
const { MongoClient,ObjectId } = require("mongodb");
require('dotenv/config');
const bodyParser = require('body-parser');
const { verifyToken, verifyClerkRole } = require('./middleware/authMiddleware');

//Two schemas are used under the Mongo collection for storing and retreiving the records.
const wardops = require('../DEVOPSCW/dbops/wardops');
const dischargeops = require('../DEVOPSCW/dbops/dischargeops');

//Here connection to DB using the variables from the .env
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log('DB is connected!'))
    .catch((err) => console.error('Unable to connect to DB.', err));



// Connection URI
const uri = process.env.DATABASE_URL;
const dbName = 'test';
const collectionName = 'Ward Management';

/*
1. Create ward with basic details
* empty list of maintenance, equipments, rooms, and nurses
* and default value for all fields
* capacity=0, number_of_rooms=0,current_patients=0
2. update ward details as needed
*/

/*
what is left:
1. create a user in the user database with a role = admission
2. change below code so that only addmission guys can perform the actions
*/
wardapp.post('/v1/ward/:operation',  async (req, res) => {

    /**
     * post man for adding
     * {
            "ward_number":"W111",
            "ward_name":"maternity",
            "floor_number":"1st Floor",
            "contact":"0407878787",
            "receptionist":"Lisa Brown"
        }
     * 
     * postman for updating
     * {"fields":{
            "ward_number":"W111",
            "floor_number":"Ground Floor",
            "receptionist":"Alex Hernandes"
        }
        }
     */
    const { operation } = req.params;
    console.log(req.body);
    if (operation==='Add'){
        const newWard = new wardops({
            ward_number:req.body.ward_number,
            ward_name:req.body.ward_name,
            floor_number:req.body.floor_number,
            contact:req.body.contact,
            receptionist:req.body.receptionist
        });      
        try {
            const savedRecord = await newWard.save();  
            res.status(200).json(savedRecord);
            //res.json(savedRecord)
        } catch (err) {
            if (err.code === 11000 && err.keyPattern && err.keyPattern.pnumber) {
                res.status(400).json({ message: 'Duplicate ward number' });
            } else {
                res.status(500).json({ message: err.message });
            }
        }
    }
    else if(operation==='Update'){
        const { fields } = req.body;
        console.log("updatig")
        console.log(fields)
        const updateOperation = {};
        let wardnumber=0
        const client = new MongoClient(uri);
        // Connect to the MongoDB server
        await client.connect();
        // Select the database and collection
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        for (const field in fields) {
            console.log(field)
            if (field==="ward_number"){
                wardnumber=fields[field]
            }
            else{
                updateOperation[`${field}`] = fields[field];
            }
        }
        console.log(wardnumber)
        const result = await collection.updateOne(
            { ward_number: wardnumber}, // find equipment in ward
            { $set: updateOperation }, // update each field
        );

        //console.log({ ward_number: wardnumber})

        if (result.modifiedCount === 1) {
            res.send('ward updated successfully');
        } else {
            res.status(404).send('ward number not found');
        }
    }
    else{
        res.send("Wrong operation name, use Add or Update")
    }
});

/**
 * adding maintenance history to each ward
 */
wardapp.post('/v1/maintenance/:wardnumber/',  async (req, res) => {
    console.log("post function")
    //console.log(req.body);
    const { wardnumber } = req.params;
    /**
     postman test: 
        {"newMaintenance":{
            "last_maintenance_date":"2024-02-28T12:00:00", 
            "next_maintenance_date":"2024-03-01T12:00:00"
            }
        }
     */
    const { newMaintenance } = req.body;
    console.log(wardnumber);
    try{
        // Create a new MongoClient
        const client = new MongoClient(uri);

        // Connect to the MongoDB server
        await client.connect();

        // Select the database and collection
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const result = await collection.updateOne(
            { ward_number: wardnumber }, // Filter based on ward number
            { $addToSet: { maintenance: newMaintenance } } // Update array of maintenance object
        );
        if (result.modifiedCount === 1) {
            res.send('Maintenance added successfully');
        } else {
            res.status(404).send('Ward number not found');
        }
    }
    catch (err) {
        console.error('Error occurred:', err);
        res.status(500).send('Database or variable error');
    }
});


/**
 * assumption: add or update a single element at a time
 * recieves ward number, equipment number and operation to be performed
 * if update: updates all the fields provided with the new values
 * if add, it adds the new equipment
 */
wardapp.post('/v1/medicalequipment/:wardnumber/:equipnumber/:operation',  async (req, res) => {
    const { wardnumber, equipnumber, operation} = req.params;
    console.log(req.params);
    console.log(operation);
    /**
     postman test for add: 
           {"equipment":{
                "equipment_id": "E001",
                "equipment_name": "Defibrillator",
                "condition": "Good"
            }}
        postman test for update: 
          {
            "fields":{
            "condition": "new",
            "equipment_name": "BP Tool"
          }}
     */
    // Create a new MongoClient
    try{
        
        const client = new MongoClient(uri);
        
        // Connect to the MongoDB server
        await client.connect();

        // Select the database and collection
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        //updates a single field at a time
        if (operation === 'Update') {
            const { fields,value } = req.body;
            console.log("updatig")


            const updateOperation = {};
            for (const field in fields) {
                updateOperation[`medicalEquipment.$[elem].${field}`] = fields[field];
            }
            
 
            //console.log("Array Filters:", [{ "elem.equipment_id": equipnumber }]);
            const result = await collection.updateOne(
                { ward_number: wardnumber}, // find equipment in ward
                { $set: updateOperation }, // update each field
                { arrayFilters: [{ "elem.equipment_id": equipnumber }] }
            );

            //console.log({ ward_number: wardnumber})

            if (result.modifiedCount === 1) {
                res.send('equipment updated successfully');
            } else {
                res.status(404).send('ward number not found');
            }
        } else if (operation==='Add') { //insert
            
                //check if equipment id already exists 
                //add this part later 
                console.log("inserting")
                const { equipment } = req.body;
                //if not then add to the list
                const result = await collection.updateOne(
                    { ward_number: wardnumber, }, // Filter based on ward number
                    { $addToSet: { medicalEquipment: equipment } } // add equipment to list
                );
                if (result.modifiedCount === 1) {
                    res.send('equipment Added successfully');
                } else {
                    res.status(404).send('ward number not found');
                }
            }
        else{
                res.send("Wrong operation name, use Add or Update")
            }
        }
        catch (err) {
            console.error('Error occurred:', err);
            res.status(500).send('Syntax or variable error');
        }
    
});




/**
 * recieves ward numberm and nurse id along with operation to be perfomed
 * if update: takes field names and the new values and makes the update
 * if add, it adds the new nurse
 */
wardapp.post('/v1/nurse/:wardnumber/:nurseid/:operation',  async (req, res) => {
    const { wardnumber, nurseid, operation} = req.params;
    console.log(req.params);
    console.log(operation);
    /**
     postman test for add: 
           {"nurse":{
                "nusre_id": "N001",
                "nurse_name": "Sarah Johnson",
                "start_time": "10:00",
                "end_time": "22:00",
                "start_date":"2024-02-20",
                "end_date":"2024-02-25",
                "supervisor":"No"
                }
            }
        postman test for update: 
          {"fields":{
            "start_time": "8:00",
            "end_time": "20:00",
            "supervisor":"Yes"
          }}
     */
    // Create a new MongoClient
    try{
        
        const client = new MongoClient(uri);
        
        // Connect to the MongoDB server
        await client.connect();

        // Select the database and collection
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        //updates a single field at a time
        if (operation === 'Update') {
            const { fields,value } = req.body;
            console.log("updatig")


            const updateOperation = {};
            for (const field in fields) {
                updateOperation[`nurses.$[elem].${field}`] = fields[field];
            }
            
            //console.log("Array Filters:", [{ "elem.equipment_id": equipnumber }]);
            const result = await collection.updateOne(
                { ward_number: wardnumber}, // find equipment in ward
                { $set: updateOperation }, // update each field
                { arrayFilters: [{ "elem.nusre_id": nurseid }] }
            );

            //console.log({ ward_number: wardnumber})

            if (result.modifiedCount === 1) {
                res.send('nurse details updated successfully');
            } else {
                res.status(404).send('ward number not found');
            }
        } else if (operation==='Add'){ //insert
            
                //check if equipment id already exists 
                //add this part later 
                console.log("inserting")
                const { nurse } = req.body;
                //if not then add to the list
                const result = await collection.updateOne(
                    { ward_number: wardnumber, }, // Filter based on ward number
                    { $addToSet: { nurses: nurse } } // add equipment to list
                );
                if (result.modifiedCount === 1) {
                    res.send('nurse added successfully');
                } else {
                    res.status(404).send('ward number not found');
                }
            }
        else{
                res.send("Wrong operation name, use Add or Update")
            }
        }
        catch (err) {
            console.error('Error occurred:', err);
            res.status(500).send('Syntax or variable error');
        }
    
});




/**
 * recieves ward number and room details and adds the new room along with the 
 * bed details, furniture details and empty patient list,
 * it then updates the ward capacity based on number of beds and 
 * adds 1 to number of rooms
 */
wardapp.post('/v1/addroom/:wardnumber/',  async (req, res) => {
    const { wardnumber} = req.params;
    console.log(req.params);
    /**
     postman test for add: 
           {"room":{
            "room_number":"R001",
            "room_type":"Shared",
            "capacity":2,
            "beds":[
                {"bed_number":"B001","status":"Free"},
                {"bed_number":"B002","status":"Free"}
                ],
            "patients":[],
            "furniture":[
                    {
                        "furniture_number": "F001",
                        "furniture_name": "Fridge"
                    }
                    ]
                }
            }
     */
    
    try{
        // Create a new MongoClient
        const client = new MongoClient(uri);
        
        // Connect to the MongoDB server
        await client.connect();

        // Select the database and collection
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        console.log("inserting")
        const { room } = req.body;
        //if not then add to the list
        const result = await collection.updateOne(
            { ward_number: wardnumber, }, // Filter based on ward number
            { $addToSet: { rooms: room } } // add equipment to list
        );
        //update room count and capacity of the ward
        const updateWard = await collection.updateOne(
            { ward_number: wardnumber, }, // Filter based on ward number
            { $inc: {number_of_rooms: 1,capacity: room.capacity} } // update ward details
        );
        if (result.modifiedCount === 1) {
            res.send('room added successfully');

        } else {
            res.status(404).send('ward number not found');
        }
        
        }
        catch (err) {
            console.error('Error occurred:', err);
            res.status(500).send('Syntax or variable error');
        }
    
});

/**
 * find all beds or free/occupied beds in ward by ward number
 * prints room type, and free bed number
 */

wardapp.get('/v1/roomsearch/:wardnumber/:status', async (req, res) => {
    try {
        const { wardnumber,status} = req.params;
        const client = new MongoClient(uri);
        // Connect to the MongoDB server
        await client.connect();

        // Select the database and collection
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        let pipeline=[]

        if (status==='Free'){
            pipeline = [
                { $match: { ward_number: wardnumber,}},
                { $unwind: "$rooms" },
                { $unwind: "$rooms.beds" },
                { $match: { "rooms.beds.status":"Free",}},
            { $group: { _id: {"ward":"$ward_number","room_number":"$rooms.room_number","room_type":"$rooms.room_type"}, "beds": { $push: "$rooms.beds" } } },
                
            ];
        }
        else if (status==='Occupied'){
            pipeline = [
                { $match: { ward_number: wardnumber,}},
                { $unwind: "$rooms" },
                { $unwind: "$rooms.beds" },
                { $match: { "rooms.beds.status":"Occupied",}},
            { $group: { _id: {"ward":"$ward_number","room_number":"$rooms.room_number","room_type":"$rooms.room_type"}, "beds": { $push: "$rooms.beds" } } },
            ];
        }else{
            pipeline = [
                { $match: { ward_number: wardnumber,}},
                { $unwind: "$rooms" },
                { $unwind: "$rooms.beds" },
                { $group: { _id: {"ward":"$ward_number","room_number":"$rooms.room_number","room_type":"$rooms.room_type"}, "beds": { $push: "$rooms.beds" } } },
            ]
        }
        //console.log("Aggregation Pipeline:", JSON.stringify(pipeline));
        // Close the client
        const readRecord = await collection.aggregate(pipeline).toArray();
        await client.close();
        res.json(readRecord);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});




/**
 * recieves patient number ward number and room type
 * if there is a free bed in one of the rooms
 *      assigns one of it to the patient
 *      and adds 1 to current_patients
 * else shows erro "No Suitable room is found"
 */

wardapp.post('/v1/admission/:wardnumber/:roomtype/',  async (req, res) => {
    const { wardnumber, roomtype} = req.params;
    console.log(req.params);
    const {patientid,condition,admission_date,expected_discharge_date}=req.body
    /**
     postman test for add: 
           {
            "patientid":"P111",
            "condition":"critical",
            "admission_date":"2024-02-20",
            "expected_discharge_date":"2024-02-22"
            }
     */
    // Create a new MongoClient
    try{
        
        const client = new MongoClient(uri);
        
        // Connect to the MongoDB server
        await client.connect();

        // Select the database and collection
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        
        //add consition if capacity===num_patients then it's full
            console.log("inserting")
            const pipeline = [
                {$match:{ward_number: wardnumber}},
                { $unwind: "$rooms" }, // Unwind the rooms array
                { $match: { "rooms.room_type": roomtype}}, //find the room with the given room type
                { $unwind: "$rooms.beds" },//unwinde beds
                { $match: { "rooms.beds.status": "Free"}},//find the bed with free status
                { $limit: 1 } // Limit to the first matching
            ];
    
            // Execute aggregation pipeline
            const room = await collection.aggregate(pipeline).next();
            //console.log("Aggregation Pipeline:", JSON.stringify(room));
            if (room) {

                // If a suitable room is found
                //1. add the patient to its patients list
                const bed_number =room.rooms.beds.bed_number;
                const result = await collection.updateOne(
                    { "rooms.room_number": room.rooms.room_number,}, // Find the room
                    { $addToSet: { "rooms.$.patients":
                                {   patient_number:patientid,
                                    bed_number:bed_number,
                                    condition:condition,
                                    admission_date:admission_date,
                                    expected_discharge_date:expected_discharge_date,
                                } 
                            } } // Push the patient to the patients array of the matched room
                )   ;

                //2. update ward by adding 1 to current patients
                const updateWard = await collection.updateOne(
                    { ward_number: wardnumber }, // Match the room by its _id and the room within it by its _id
                    { $inc: { current_patients:1} } // Push the patient to the patients array of the matched room
                );

                //3. update the status of the bed assigned to the patient to Occupied
                const updateBed = await collection.updateOne(
                    { ward_number: wardnumber },
                    {'$set': {'rooms.$[r].beds.$[b].status': 'Occupied'}},
                    {arrayFilters: [
                        {'r.room_number': room.rooms.room_number},
                        {'b.bed_number': bed_number}]},
                );

                if (result.modifiedCount === 1) {
                    res.status(200).json({ message: 'Patient added successfully.' });

                } else {
                    res.status(500).json({ error: 'Failed to add patient.' });
                }
            } else {
                res.status(404).json({ error: 'No suitable room found.' });
            }
        }
        catch (err) {
            console.error('Error occurred:', err);
            res.status(500).send('Syntax or variable error');
        }
    
});




/**
 * recieves patient number
 * if not found return "wrong patient number or patient is discharged"
 * else it show ward details, room and bed details and patient admission details
 */
wardapp.get('/v1/patientsearch/:patientid',  async (req, res) => {
    const {patientid} = req.params;
    console.log(req.params);
    // Create a new MongoClient
    try{
        
        const client = new MongoClient(uri);
        
        // Connect to the MongoDB server
        await client.connect();

        // Select the database and collection
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        
        let pipeline=[]
        //add consition if capacity===num_patients then it's full
        pipeline = [
            { $unwind: "$rooms" }, // Unwind the rooms array
            { $unwind: "$rooms.patients" }, //unwind patients array
            { $match: { "rooms.patients.patient_number": patientid}},//find record with the patient
            { $project:{ward_number:1,ward_name:1,floor_number:1,
                "rooms.room_number":1,"rooms.patients":1,_id:0}}
        ];
        //console.log("Aggregation Pipeline:", JSON.stringify(pipeline));
        // Execute aggregation pipeline
        const readPatient = await collection.aggregate(pipeline).toArray();
        await client.close();
        if (readPatient.length===0){
            res.status(500).send('Patient ID is invalid or patient is discharged');
        }else{
            res.json(readPatient);
             //console.log("Aggregation Pipeline:", JSON.stringify(readPatient));
        }
    }
    catch (err) {
        console.error('Error occurred:', err);
        res.status(500).send('Syntax or variable error');
    }

});


/**
 * recieves patient number and action 
 * if not found return "wrong patient number"
 * if search it only shows patient details
 * if discharge it chec
 * saves the patient details into a log file then removes the patient from the list
 * finds wards and reduced pataient_number by 1,
 * find the bed that was assigned to him and sets status to free
 * it also updates ward room count and capacity
 */

wardapp.post('/v1/discharge/:patientid',  async (req, res) => {
    const {patientid} = req.params;
    console.log(req.params);
    // Create a new MongoClient
    try{
        
        const client = new MongoClient(uri);
        
        // Connect to the MongoDB server
        await client.connect();

        // Select the database and collection
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        
        let pipeline=[]
        //add consition if capacity===num_patients then it's full
        pipeline = [
            { $unwind: "$rooms" }, // Unwind the rooms array
            { $unwind: "$rooms.patients" }, //unwind patients array
            { $match: { "rooms.patients.patient_number": patientid}},//find record with the patient
            { $addFields:{"Room Number":"$rooms.room_number"}},
            { $project:{ward_number:1,
                "rooms.room_number":1,"rooms.patients":1}}
        ];
        //console.log("Aggregation Pipeline:", JSON.stringify(pipeline));
        const readPatient = await collection.aggregate(pipeline).toArray();
        if (readPatient.length===0){
            res.status(500).send('Patient ID is invalid or patient is discharged');
        }else{
                const bed_number=readPatient[0].rooms.patients.bed_number
                const room_number=readPatient[0].rooms.room_number
                const wardnumber=readPatient[0].ward_number
                console.log(wardnumber)
                //1. add patient to discharge log
                const newDischarge = new dischargeops({
                    ward_number:wardnumber,
                    room_number:room_number,
                    bed_number:bed_number,
                    patient_number:patientid,
                    admission_date:readPatient[0].rooms.patients.admission_date,
                    discharge_date:new Date().toISOString()
                });   
                const savedRecord = await newDischarge.save();  
                res.status(200).json(savedRecord);
                
                //2. change room status to Free
                const updateBed = await collection.updateOne(
                    { ward_number: wardnumber },
                    {'$set': {'rooms.$[r].beds.$[b].status': 'Free'}},//change bed status
                    {arrayFilters: [
                        {'r.room_number': room_number}, //find room
                        {'b.bed_number': bed_number}]}, //find bed
                );

                //3. change current_patients count
                const updateWard = await collection.updateOne(
                    { ward_number: wardnumber }, // Find Ward
                    { $inc: { current_patients:-1} } // reduce number of patients by 1
                );
                //4. remove patient from the patients list
                console.log({ward_number: wardnumber})
                const updatePatients = await collection.updateOne(
                    {ward_number: wardnumber},
                    {$pull: {'rooms.$[r].patients':{patient_number:patientid}}}, //find patient and remove
                    {arrayFilters: [
                        {'r.room_number': room_number},]},//find room
                );
                
                } 
                await client.close();   
    }
    catch (err) {
        console.error('Error occurred:', err);
        res.status(500).send('Syntax or variable error');
    }

});


wardapp.listen(8686, () => console.log('Ward Management Server running on port 8686'));