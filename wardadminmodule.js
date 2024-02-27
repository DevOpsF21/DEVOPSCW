/*      
* This module is hospital administrator interface to 
* admit to or discharge a patient from a ward
* department and ward name are needed to assign a patient to a free room
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
const inpatientops = require('../DEVOPSCW/dbops/inpatientops');
const dischargeops = require('../DEVOPSCW/dbops/dischargeops');

//Here connection to DB using the variables from the .env
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log('DB is connected!'))
    .catch((err) => console.error('Unable to connect to DB.', err));

const { connectToDb, getDb } = require("./db");
// Make sure to call connectToDb before starting the server
connectToDb((err) => {
    if (err) {
      console.error("Unable to connect to DB.", err);
      process.exit(1);
    }
  });

// Connection URI
const uri = process.env.DATABASE_URL;
const dbName = 'test';
const wardCollection = 'wards';
const inpatientCollection = 'inpatients';
const patients = 'registrations';


/**
 * recieves patient number, department name, ward name
 * if there is a free bed in one of the rooms
 *      assigns one of it to the patient
 *      and adds 1 to current_patients
 *      add patient to inpatient collection
 * else shows erro "All beds in this ward are occupied"
 */

/**should be accessed only by admin role */
wardapp.post('/v1/inpatient/',  async (req, res) => {
    const { adminid} = req.params;
    const { pid,dep,wname, ad, edd} = req.body;
    const pnumber=+pid
    console.log(pid,dep,wname);
    const db = getDb();
    let isError=false;
    let msg='';
    
    try {
        /**
         * check if patient exists in the registration databse
         */
        const patient = await db.collection(patients).findOne({pnumber: pnumber});
        if(patient===null){
            msg+="Invalid Patient ID";
            isError=true;
        }
        /**
         * check if department is entered correctly
         */
        const department = await db.collection(wardCollection).findOne({department:dep});
        if(department===null){
            msg+=" Invalid Department Name";
            isError=true;
        }else{
            const wardName = await db.collection(wardCollection).findOne({department:dep,ward_name: wname});
            if(wardName===null){
                msg+=" Invalid Ward Name";
                isError=true;
            }
        }
        if (!isError){
            /**
             * find a bed in any room in the ward with status=Free
             */
            const freeBedSearch = [
                {$match:{department:dep,ward_name: wname}},
                { $unwind: "$rooms" }, // Unwind the rooms array
                { $unwind: "$rooms.beds" },//unwinde beds
                { $match: { "rooms.beds.status": "free"}},//find the bed with free status
                { $limit: 1 } // Limit to the first matching
            ];
            const bedDetails = await db.collection(wardCollection).aggregate(freeBedSearch).next();
            if (bedDetails){
                /**
                 * add 1 to current_patients
                 * add patient to bed, change bed to occupied, 
                 * add patient to inpatient collection
                 */
                room=bedDetails.rooms.room_number
                bed=bedDetails.rooms.beds.bed_number
                //1. update ward by adding 1 to current_patients
                const updateWard = await db.collection(wardCollection).updateOne(
                    { department:dep,ward_name: wname }, 
                    { $inc: { current_patients:1} }
                );
                //2. update bed, set status=occupied and add patient:patientid
                const updateBed = await db.collection(wardCollection).updateOne(
                    { department:dep,ward_name: wname },
                    {'$set': {'rooms.$[r].beds.$[b].status': 'occupied',
                             'rooms.$[r].beds.$[b].patient': pnumber}
                            },
                    {arrayFilters: [
                        {'r.room_number': room},
                        {'b.bed_number': bed}]},
                );
                //3. update bed, set status=occupied and add patient:patientid
                //new Date().toISOString()
                try{
                    const newInpatient = new inpatientops({
                        department:dep,
                        ward_name:wname,
                        room_number:room,
                        bed_number:bed,
                        pnumber:pnumber,
                        admission_date:ad,
                        expected_discharge_date:edd
                    });  
                    const savedRecord = await newInpatient.save(); 
                    res.status(200).json(savedRecord);
                }catch (err) {
                    res.status(500).json({ message: err.message });
                }
                
            }
            else {
                res.status(404).json({ error: 'All beds in this ward are occupied' });
            }
        }
        else{
            res.send(msg);
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
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


wardapp.listen(9090, () => console.log('Ward Admin Server running on port 9090'));