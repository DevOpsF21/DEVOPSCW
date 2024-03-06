const mongoose = require('mongoose');

//to log user activtites for potenial investigations requirements
const discargeSchema = new mongoose.Schema({
    patient_number: {
        type: String,
        required: true,
    },
    ward_number:{
        type: String,
        required: true,
    },
    room_number:{
        type: String,
        required: true,
    },
    bed_number:{
        type: String,
        required: true,
    },
    admission_date:{
        type:Date,
        required: true,
    },
    discharge_date:{
        type:Date,
        required: true,
    },

}, { collection: 'Discarge Log' }); // Specify the collection name here

module.exports = mongoose.model('Discarge Log', discargeSchema);