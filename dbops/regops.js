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
        enum: ["opd", "a&e", "referred"],
        default: "opd",
        lowercase: true // Converts input to lowercase before saving
    },

    knowndiseases: String,
    knownallergies: String

    //for the last two records, extra validation against injection attacks to be explored 
});

module.exports = mongoose.model('Registration', regSchema);

/* Sample record below 
{
    "pnumber": "88888888",
    "pname": "Abrar Ali",
    "dob": "12/12/1212",
    "gender": "Male"
}
*/