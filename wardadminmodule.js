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



wardapp.listen(9090, () => console.log('Ward Admin Server running on port 9090'));