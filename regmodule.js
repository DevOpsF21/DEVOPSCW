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

regapp.post('/',(req,res) => { 
    
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
        complains: req.body.complains
    });
    createRecord.save().then(data => {res.status(200).json(data)}).catch(err => {res.status(404)}); 
} );



regapp.listen(8080);

