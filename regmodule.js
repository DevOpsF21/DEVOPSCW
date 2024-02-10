const express = require('express');
const regapp = express();
const mongoose = require('mongoose');
require('dotenv/config');
const bodyParser = require('body-parser');
const DBwrite = require('../DEVOPSCW/dbwriter/dbwriter');

mongoose.connect(process.env.DB_CONNECTION, () => console.log('connected to DB'));

regapp.use(bodyParser.json());

// Middleware to validate inputs before creating a new record
function validateInputs(req, res, next) {
    const { pnumber, pname, dob, blood, gender, through } = req.body;

    // Validation for pnumber
    if (!/^\d{8}$/.test(pnumber)) {
        return res.status(400).json({ message: 'pnumber should be 8 digits only' });
    }

    // Validation for pname
    if (!/^[a-zA-Z\s]+$/.test(pname)) {
        return res.status(400).json({ message: 'name should only include alphabets' });
    }

    // Validation for dob
    const dobDate = new Date(dob);
    const currentDate = new Date();
    const maxAgeDate = new Date(currentDate.getFullYear() - 120, currentDate.getMonth(), currentDate.getDate());
    if (isNaN(dobDate) || dobDate < maxAgeDate || dobDate > currentDate) {
        return res.status(400).json({ message: 'dob should be a valid date and between 120 years and today' });
    }

    // Validation for blood if it's not empty
    if (blood && !/^(A|B|AB|O)[+-]$/.test(blood)) {
        return res.status(400).json({ message: 'blood should be limited to accept blood group letters/combinations with + or -' });
    }

    // Validation for gender
    if (!['male', 'female'].includes(gender.toLowerCase())) {
        return res.status(400).json({ message: 'gender should be either "male" or "female"' });
    }

    // Validation for through
    if (!['OPD', 'A&E', 'Referred'].includes(through)) {
        return res.status(400).json({ message: 'through should be either "OPD", "A&E", or "Referred"' });
    }

    next(); // Move to the next middleware
}

regapp.get('/v1/list', async (req, res) => {
    try {
        const readRecord = await DBwrite.find();
        res.json(readRecord);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

regapp.get('/v1/pnumber/:pnumber', async (req, res) => {
    try {
        const readRecord = await DBwrite.find({ pnumber: req.params.pnumber });
        res.json(readRecord);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

regapp.get('/v1/pname/:pname', async (req, res) => {
    try {
        const partialName = req.params.pname;
        const regex = new RegExp(partialName, 'i');
        const readRecord = await DBwrite.find({ pname: { $regex: regex } });
        res.json(readRecord);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

regapp.post('/v1/reg/', validateInputs, async (req, res) => {
    console.log(req.body);
    const createRecord = new DBwrite(req.body);

    try {
        const savedRecord = await createRecord.save();
        res.status(200).json(savedRecord);
    } catch (err) {
        if (err.code === 11000 && err.keyPattern && err.keyPattern.pnumber) {
            res.status(400).json({ message: 'Duplicate pnumber found' });
        } else {
            res.status(500).json({ message: err.message });
        }
    }
});

// DELETE route to delete records based on pnumber
regapp.delete('/v1/delete/:pnumber', async (req, res) => {
    try {
        const deletedRecord = await DBwrite.findOneAndDelete({ pnumber: req.params.pnumber });
        if (!deletedRecord) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.status(200).json({ message: 'Record deleted successfully', deletedRecord });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

regapp.listen(8080);




/*
const express = require('express');

const regapp = express();

const mongoose = require('mongoose');
// npm install mongoose@6.10.0 were used since the current version is giving an error

require('dotenv/config');
const bodyParser = require('body-parser')
const DBwrite = require('../DEVOPSCW/dbwriter/dbwriter');

mongoose.connect(process.env.DB_CONNECTION, () => console.log('connected to DB')); //move the credetnials to env file for extra secruity 

regapp.use(bodyParser.json());

//regapp.get('/v1/auth',(req,res) => { res.send("Bye");} );

regapp.get('/v1/list', async (req, res) => {
try{
const readRecord = await DBwrite.find(); 
res.json(readRecord);
}catch{
res.json({message:err});
}
});


regapp.get('/v1/pnumber/:pnumber', async (req, res) => {
    try{
    const readRecord = await DBwrite.find({pnumber: req.params.pnumber}); 
    res.json(readRecord);
    }catch{
    res.json({message:err});
    }
    });

    regapp.get('/v1/pname/:pname', async (req, res) => {
        try{
            const partialName = req.params.pname;
            const regex = new RegExp(partialName, 'i'); // 'i' makes the regex case-insensitive
            const readRecord = await DBwrite.find({ pname: { $regex: regex } }); 
            res.json(readRecord);
        }catch{
        res.json({message:err});
        }
        });
    

regapp.post('/v1/reg/',async (req,res) => { 
    
    console.log(req.body);
    const createRecord = new DBwrite({


        pnumber: req.body.pnumber,
        pname: req.body.pname,
        dob: req.body.dob,
        regdate: req.body.regdate,
        blood: req.body.regdate,
        gender: req.body.gender,
        through: req.body.through,
        knowndiseases: req.body.knowndiseases,
        knownallergies: req.body.knownallergies
    });
    try {
        const savedRecord = await createRecord.save();
        res.status(200).json(savedRecord);
    } catch (err) {
        if (err.code === 11000 && err.keyPattern && err.keyPattern.pnumber) {
            res.status(400).json({ message: 'Duplicate pnumber found' });
        } else {
            res.status(500).json({ message: err.message });
        }
    } 
} );

regapp.listen(8080);

*/