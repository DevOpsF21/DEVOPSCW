const mongoose = require('mongoose');

const regSchema = mongoose.Schema({
    pnumber: {
        type: Number,
        required: true
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
    gender: 
    {
        type: String,
        required: true
    },
    through: 
    {
        type: String,
        default: "OPD"
    },
    
    knowndiseases: String,
    complains: String    
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