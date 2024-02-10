const mongoose = require('mongoose');

const regSchema = mongoose.Schema({
    pnumber: {
        type: Number,
        required: true,
        unique: true
    },
    pname: 
    {
        type: String,
        required: true
    },
        dob: Date,
    regdate: 
    {
    type: Date,
    default: Date.now
    },
    blood: String,
    gender: {
        type: String,
        enum: ["male", "female"],
        required: true,
        lowercase: true // Converts input to lowercase before saving
    },
    through: 
    {
        type: String,
        enum: ["OPD", "A&E", "Referred"], 
        default: "OPD"
    },
    
    knowndiseases: String,
    knownallergies: String    
});

module.exports = mongoose.model('Registration', regSchema);

/*
{
    "pnumber": "88888888",
    "pname": "Abrar Ali",
    "dob": "12/12/1212",
    "gender": "Male"
}
*/