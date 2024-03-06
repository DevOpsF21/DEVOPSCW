/*      
* This module is ward nurse interface to 
* update inpatient data including
* medication
* vital signs
* report
* medication
*/

//Create the necessary libraries, dotenv is used for hiding the DB credentials while express & mangoose are used for API communicaiton
const express = require('express');
const wardapp = express();
wardapp.use(express.json())
const mongoose = require('mongoose');
const { MongoClient, ObjectId } = require("mongodb");
require('dotenv/config');
const bodyParser = require('body-parser');
const { verifyToken, verifyRoles } = require('./middleware/authMiddleware');

//Two schemas are used under the Mongo collection for storing and retreiving the records.
const inpatientops = require('./dbops/inpatientops');
const dischargeops = require('./dbops/dischargeops');
const port = 9191;

//Here connection to DB using the variables from the .env
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log('DB is connected!'))
    .catch((err) => console.error('Unable to connect to DB.', err));

const { connectToDb, getDb } = require("/app/auth/db");
// Make sure to call connectToDb before starting the server
connectToDb((err) => {
    if (err) {
        console.error("Unable to connect to DB.", err);
        process.exit(1);
    }
});
h
// Connection URI
const uri = process.env.DATABASE_URL;
const dbName = 'test';
const inpatients = 'Inpatient';
const patients = 'registrations';
const wardCollection = 'wards';
/**
 * recieves patient number, department name, ward name
 * if there is a free bed in one of the rooms
 *      assigns one of it to the patient
 *      and adds 1 to current_patients
 *      add patient to inpatient collection
 * else shows erro "All beds in this ward are occupied"
 */

/**should be accessed only by admin role */
wardapp.post('/v1/inpatient/', verifyToken, verifyRoles(['admin']), async (req, res) => {
    /**
     * link body sample:
     * {
            "pid":77778888,
            "dep":"Medicine",
            "wname":"Medicine A",
            "ad":"2024-02-20T13:30:45",
            "edd":"2024-02-20"
        }
     */
    const { pid, dep, wname, ad, edd } = req.body;
    const pnumber = +pid
    console.log(pid, dep, wname);
    const db = getDb();
    let isError = false;
    let msg = '';

    try {
        /**
         * check if patient exists in the registration databse
         */
        const patient = await db.collection(patients).findOne({ pnumber: pnumber });
        if (patient === null) {
            msg += "Invalid Patient ID";
            isError = true;
        }
        const inpatient = await db.collection(inpatients).findOne({ pnumber: pnumber });
        if (inpatient != null) {
            msg += "Patient is already admited";
            isError = true;
        }
        /**
         * check if department is entered correctly
         */
        const department = await db.collection(wardCollection).findOne({ department: dep });
        if (department === null) {
            msg += " Invalid Department Name";
            isError = true;
        } else {
            const wardName = await db.collection(wardCollection).findOne({ department: dep, ward_name: wname });
            if (wardName === null) {
                msg += " Invalid Ward Name";
                isError = true;
            }
        }
        if (!isError) {
            /**
             * find a bed in any room in the ward with status=Free
             */
            const freeBedSearch = [
                { $match: { department: dep, ward_name: wname } },
                { $unwind: "$rooms" }, // Unwind the rooms array
                { $unwind: "$rooms.beds" },//unwinde beds
                { $match: { "rooms.beds.status": "free" } },//find the bed with free status
                { $limit: 1 } // Limit to the first matching
            ];
            const bedDetails = await db.collection(wardCollection).aggregate(freeBedSearch).next();
            if (bedDetails) {
                /**
                 * add 1 to current_patients
                 * add patient to bed, change bed to occupied, 
                 * add patient to inpatient collection
                 */
                room = bedDetails.rooms.room_number
                bed = bedDetails.rooms.beds.bed_number
                //1. update ward by adding 1 to current_patients
                const updateWard = await db.collection(wardCollection).updateOne(
                    { department: dep, ward_name: wname },
                    { $inc: { current_patients: 1 } }
                );
                //2. update bed, set status=occupied and add patient:patientid
                const updateBed = await db.collection(wardCollection).updateOne(
                    { department: dep, ward_name: wname },
                    {
                        '$set': {
                            'rooms.$[r].beds.$[b].status': 'occupied',
                            'rooms.$[r].beds.$[b].patient': pnumber
                        }
                    },
                    {
                        arrayFilters: [
                            { 'r.room_number': room },
                            { 'b.bed_number': bed }]
                    },
                );
                //3. update bed, set status=occupied and add patient:patientid
                //new Date().toISOString()
                try {
                    const newInpatient = new inpatientops({
                        department: dep,
                        ward_name: wname,
                        room_number: room,
                        bed_number: bed,
                        pnumber: pnumber,
                        admission_date: ad,
                        expected_discharge_date: edd
                    });
                    const savedRecord = await newInpatient.save();
                    res.status(200).json(savedRecord);
                } catch (err) {
                    res.status(500).json({ message: err.message });
                }

            }
            else {
                res.status(404).json({ error: 'All beds in this ward are occupied' });
            }
        }
        else {
            res.send(msg);
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }

});

/**
 * view all patients that has discharge form ready
 */
wardapp.get('/v1/discharge/', verifyToken, verifyRoles(['admin']), async (req, res) => {
    const db = getDb();
    let isError = false;
    let links = [];

    try {
        const discharge = await db.collection(inpatients)
            .aggregate([{ $match: { discharge_form: { $exists: 1 }, discharge_date: null } }]).toArray();
        if (discharge === null) {
            res.status(500).json("No discharge request");
        }
        else {
            for (const inpatient of discharge) {
                let link = {
                    pnumber: inpatient.pnumber,
                    view_discharge_form: "localhost:" + port + "/v1/discharge/" + inpatient.pnumber,
                }
                links.push(link);
            }
            res.status(500).json(links);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }

});
wardapp.get('/v1/discharge/:pid', verifyToken, verifyRoles(['admin']), async (req, res) => {
    const db = getDb();
    const { pid } = req.params
    const pnumber = +pid
    try {
        const discharge = await db.collection(inpatients).aggregate(
            [
                { $match: { pnumber: pnumber } },
                { $project: { pnumber: 1, discharge_form: 1, "_id": 0 } },

            ]).toArray();

        res.status(200).json(discharge);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }

});
wardapp.post('/v1/discharge/:pid', verifyToken, verifyRoles(['admin']), async (req, res) => {
    const db = getDb();
    const { pid } = req.params
    const pnumber = +pid
    try {
        const discharge = await db.collection(inpatients).aggregate(
            [{ $match: { pnumber: pnumber } }
            ]).toArray();
        console.log(discharge);
        //1. set discharge date
        const update = await db.collection(inpatients).updateOne(
            { pnumber: pnumber },
            { $set: { discharge_date: new Date().toISOString() } }
        )

        //2. update ward by decrementing 1 to current_patients
        const updateWard = await db.collection(wardCollection).updateOne(
            { department: discharge[0].department, ward_name: discharge[0].ward_name },
            { $inc: { current_patients: -1 } }
        );

        //3. update bed, set status=free and remove patient:patientid
        const updateBed = await db.collection(wardCollection).updateOne(
            { department: discharge[0].department, ward_name: discharge[0].ward_name },
            {
                $set: { 'rooms.$[r].beds.$[b].status': 'free' },
                $unset: { 'rooms.$[r].beds.$[b].patient': '' }
            },
            {
                arrayFilters: [
                    { 'r.room_number': discharge[0].room_number },
                    { 'b.bed_number': discharge[0].bed_number },
                ]
            },
        );
        if (update.modifiedCount === 1) {
            res.status(500).json("Pationet is discharged");

        } else {
            res.status(500).json({ error: 'Failed to discharge patient' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }

});





/**should be accessed only by nurse or doctor only
 * recieves type of vital sign to be added to the list
 * type:  bp, cardiac, temperature
 * for test i amnot checking nurse id
*/
wardapp.get('/v1/inpatient/:pid/', verifyToken, verifyRoles(['nurse', 'doctor']), async (req, res) => {
    const { pid } = req.params;
    const pnumber = +pid
    const db = getDb();
    let isError = false;
    let msg = '';
    //localhost:9191/v1/inpatient/77778888
    try {
        const patient = await db.collection(inpatients).findOne({ pnumber: pnumber });
        console.log(patient)
        if (patient === null) {
            res.json("Invalid Patient ID");
        }
        else {
            let links = {
                department: patient.department,
                ward_name: patient.ward_name,
                room_number: patient.room_number,
                bed_number: patient.bed_number,
                admission: patient.admission_date,
                bp: "localhost:" + port + "/v1/inpatient/" + pnumber + "/vitalsigns/bp",
                cardiact: "localhost:" + port + "/v1/inpatient/" + pnumber + "/vitalsigns/cardiac",
                temprature: "localhost:" + port + "/v1/inpatient/" + pnumber + "/vitalsigns/temprature",
                report: "localhost:" + port + "/v1/inpatient/" + pnumber + "/report",
                medication: "localhost:" + port + "/v1/inpatient/" + pnumber + "/medication",
            };
            res.json(links);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }

});

wardapp.get('/v1/inpatient/:pid/vitalsigns/:type', verifyToken, verifyRoles(['nurse', 'doctor']), async (req, res) => {

    const { pid, type } = req.params;
    const pnumber = +pid
    const db = getDb();
    let isError = false;
    let msg = '';

    try {
        if (type === 'bp') {
            const Pipline = [
                { $match: { pnumber: pnumber } },
                { $project: { "vital_signs.bp": 1, "_id": 0 } }
            ]
            const data = await db.collection(inpatients).aggregate(Pipline).toArray();
            if (data[0].vital_signs.bp.length === 0) {
                res.status(500).send('No Blood Pressure details has been added yet');
            } else {
                res.json(data);
            }

        }
        else if (type === 'cardiac') {
            const Pipline = [
                { $match: { pnumber: pnumber } },
                { $project: { "vital_signs.cardiac": 1, "_id": 0 } }
            ]
            const data = await db.collection(inpatients).aggregate(Pipline).toArray();
            console.log(data[0].vital_signs.cardiac)
            if (data[0].vital_signs.cardiac.length === 0) {
                res.status(500).send('No Heart fitness details has been added yet');
            } else {
                res.json(data);
            }
        }
        else {
            const Pipline = [
                { $match: { pnumber: pnumber } },
                { $project: { "vital_signs.temprature": 1, "_id": 0 } }
            ]
            const data = await db.collection(inpatients).aggregate(Pipline).toArray();
            if (data[0].vital_signs.temprature.length === 0) {
                res.status(500).send('No Temprature details has been added yet');
            } else {
                res.json(data);
            }
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }

});
wardapp.get('/v1/inpatient/:pid/report', verifyToken, verifyRoles(['nurse', 'doctor']), async (req, res) => {

    const { pid } = req.params;
    const pnumber = +pid
    const db = getDb();
    let isError = false;
    let msg = '';

    try {
        const Pipline = [
            { $match: { pnumber: pnumber } },
            { $project: { "report": 1, "_id": 0 } }
        ]
        const data = await db.collection(inpatients).aggregate(Pipline).toArray();
        if (data[0].report.length === 0) {
            res.status(500).send('No report has been added yet');
        } else {
            res.json(data);
        }

    }

    catch (err) {
        res.status(500).json({ message: err.message });
    }

});

wardapp.get('/v1/inpatient/:pid/medication', verifyToken, verifyRoles(['nurse', 'doctor']), async (req, res) => {

    const { pid } = req.params;
    const pnumber = +pid
    const db = getDb();
    let isError = false;
    let msg = '';

    try {
        const Pipline = [
            { $match: { pnumber: pnumber } },
            { $project: { "medications": 1, "_id": 0 } }
        ]
        const data = await db.collection(inpatients).aggregate(Pipline).toArray();
        if (data[0].medications.length === 0) {
            res.status(500).send('No medications has been added yet');
        } else {
            res.json(data);
        }

    }

    catch (err) {
        res.status(500).json({ message: err.message });
    }

});

wardapp.get('/v1/inpatient/:pid/discharge_form', verifyToken, verifyRoles(['doctor']), async (req, res) => {

    const { pid } = req.params;
    const pnumber = +pid
    const db = getDb();

    try {
        const Pipline = [
            { $match: { pnumber: pnumber, discharge_form: { $exists: 1 } } },
            { $project: { "discharge_form": 1, "_id": 0 } }
        ]
        const data = await db.collection(inpatients).aggregate(Pipline).toArray();
        console.log(data.length)
        if (data.length === 0) {
            res.status(500).send('No discharge from has been added yet');
        } else {
            res.json(data);
        }

    }

    catch (err) {
        res.status(500).json({ message: err.message });
    }

});

wardapp.post('/v1/inpatient/:pid/vitalsigns/:type', verifyToken, verifyRoles(['nurse', 'doctor']), async (req, res) => {
    const nurse_id = 1234
    const last_checked = new Date().toISOString()
    /**
     * if type=bp:
     * {  
            "systolic_pressure":80,
            "diastolic_pressure":110
        }
     * if type=cardiac:
     * {  
            "heart_rate":90,
            "pulse":15
        }
     * if type=temprature:
     * {  
            "temprature":36,
        }
     */
    const { pid, type } = req.params;
    const pnumber = +pid
    const db = getDb();
    let isError = false;
    let msg = '';

    try {
        if (type === 'bp') {
            const { systolic_pressure, diastolic_pressure } = req.body;
            let status = '';

            /* * Normal: Systolic less than 120 mmHg and diastolic less than 80 mmHg (120/80 mmHg).
                 Elevated: Systolic between 120-129 mmHg and diastolic less than 80 mmHg.
                 Hypertension Stage 1: Systolic between 130-139 mmHg or diastolic between 80-89 mmHg.
                 Hypertension Stage 2: Systolic 140 mmHg or higher or diastolic 90 mmHg or higher.
                 Hypertensive Crisis: Systolic higher than 180 mmHg and/or diastolic higher than 120 mmHg.*/
            if (systolic_pressure < 120 && diastolic_pressure < 80) {
                status = 'Normal';
            }
            else if (systolic_pressure >= 120 && systolic_pressure <= 129 && diastolic_pressure < 80) {
                status = 'Elevated';
            }
            else if ((systolic_pressure >= 130 && systolic_pressure <= 139) || (diastolic_pressure >= 80 && diastolic_pressure <= 89)) {
                status = 'Hypertension Stage 1';
            }
            else if ((systolic_pressure >= 140 && systolic_pressure <= 179) || (diastolic_pressure >= 90 && diastolic_pressure <= 119)) {
                status = 'Hypertension Stage 2';
            }
            else if (systolic_pressure <= 180 && diastolic_pressure >= 120) {
                status = 'Hypertensive Crisis';
            }
            if (status != "") {
                const bpDetails = {
                    nurse_id: nurse_id,
                    systolic_pressure: systolic_pressure,
                    diastolic_pressure: diastolic_pressure,
                    status: status,
                    last_checked: last_checked
                }
                const updateBP = await db.collection(inpatients).updateOne(
                    { pnumber: pnumber },
                    { $push: { 'vital_signs.bp': bpDetails } }
                );
                if (updateBP.modifiedCount === 1) {
                    res.status(500).json("Blood Pressure Details Added");

                } else {
                    res.status(500).json({ error: 'Failed to add Blood Pressure Details' });
                }
            }
            else {
                res.status(500).json("Invalid Input");
            }

        }
        else if (type === 'cardiac') {
            const { heart_rate, pulse } = req.body;

            let hr_status = '';
            let pulse_status = '';
            /**HR 60 to 100 beats per minute (bpm).  */
            if (heart_rate >= 60 && heart_rate <= 120) {
                hr_status = 'Normal';
            }
            else {
                hr_status = 'Abnormal';
            }
            /**Normal Range: between 12 to 20  */
            if (pulse >= 12 && pulse <= 20) {
                pulse_status = 'Normal';
            }
            else {
                pulse_status = 'Abnormal';
            }
            const details = {
                nurse_id: nurse_id,
                heart_rate: heart_rate,
                pulse: pulse,
                hr_status: hr_status,
                pulse_status: pulse_status,
                last_checked: last_checked
            }
            const update = await db.collection(inpatients).updateOne(
                { pnumber: pnumber },
                { $push: { 'vital_signs.cardiac': details } }
            );
            if (update.modifiedCount === 1) {
                res.status(500).json("Heart Fitness Details Added");

            } else {
                res.status(500).json({ error: 'Failed to add Heart fitness Details' });
            }
        }
        else {
            const { temprature, measure } = req.body;

            let status = '';
            /**Normal 36.5°C to 37.5°C (97.7°F to 99.5°F) when measured orally.*/
            if (measure === 'C') {
                if (temprature >= 36.5 && temprature <= 37.5) {
                    status = 'Normal';
                }
                else {
                    status = 'Abnormal';
                }
            }
            else if (measure === 'F') {
                if (temprature >= 97.7 && temprature <= 99.5) {
                    status = 'Normal';
                }
                else {
                    status = 'Abnormal';
                }
            }

            const details = {
                nurse_id: nurse_id,
                temprature: temprature,
                measure: measure,
                status: status,
                last_checked: last_checked
            }
            const update = await db.collection(inpatients).updateOne(
                { pnumber: pnumber },
                { $push: { 'vital_signs.temprature': details } }
            );
            if (update.modifiedCount === 1) {
                res.status(500).json("Temprature Details Added");

            } else {
                res.status(500).json({ error: 'Failed to add temprature Details' });
            }
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }

});

wardapp.post('/v1/inpatient/:pid/report', verifyToken, verifyRoles(['nurse', 'doctor']), async (req, res) => {
    const nurse_id = 1234
    const last_checked = new Date().toISOString()
    /**
     * {  
            "comment":"Requires a visit by doctor",
        }
     */
    const { pid } = req.params;
    const pnumber = +pid
    const db = getDb();

    try {
        const { comment } = req.body

        const details = {
            nurse_id: nurse_id,
            comment: comment,
            date: last_checked
        }
        const update = await db.collection(inpatients).updateOne(
            { pnumber: pnumber },
            { $push: { 'report': details } }
        );
        if (update.modifiedCount === 1) {
            res.status(500).json("Report Added");

        } else {
            res.status(500).json({ error: 'Failed to add new report' });
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }

});

wardapp.post('/v1/inpatient/:pid/medication', verifyToken, verifyRoles(['nurse', 'doctor']), async (req, res) => {
    const nurse_id = 1234
    const last_checked = new Date().toISOString()
    /**
     * {  
            "medication_name":"ponstant",
            "dosage":500,
        }
     */
    const { pid } = req.params;
    const pnumber = +pid
    const db = getDb();

    try {
        const { medication_name, dosage } = req.body

        const details = {
            nurse_id: nurse_id,
            medication_name: medication_name,
            dosage: dosage,
            last_intake: last_checked
        }
        const update = await db.collection(inpatients).updateOne(
            { pnumber: pnumber },
            { $push: { 'medications': details } }
        );
        if (update.modifiedCount === 1) {
            res.status(500).json("Medication Added");

        } else {
            res.status(500).json({ error: 'Failed to add new medication' });
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }

});

wardapp.post('/v1/inpatient/:pid/discharge_form', verifyToken, verifyRoles(['doctor']), async (req, res) => {
    const doctor_id = 1234
    const last_checked = new Date().toISOString()
    /**
     * {  
        "diagnosis":"Severe Flu",
        "treatmen_taken":"we killed her",
        "discharge_reason":"Death",
        "future_treatment":"not needed",
        "perscribed_medications":"not needed"
        }
     */
    const { pid } = req.params;
    const pnumber = +pid
    const db = getDb();

    try {
        const { diagnosis, treatmen_taken, discharge_reason, future_treatment, perscribed_medications } = req.body

        const details = {
            doctor_id: doctor_id,
            diagnosis: diagnosis,
            treatmen_taken: treatmen_taken,
            report_date: last_checked,
            discharge_reason: discharge_reason,
            future_treatment: future_treatment,
            perscribed_medications: perscribed_medications

        }
        const update = await db.collection(inpatients).updateOne(
            { pnumber: pnumber },
            { $set: { 'discharge_form': details } }
        );
        if (update.modifiedCount === 1) {
            res.status(500).json("Discharge Form Added");

        } else {
            res.status(500).json({ error: 'Failed to add new Discharge Form' });
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }

});

wardapp.listen(9191, () => console.log('Ward Nurse Server running on port 9191'));