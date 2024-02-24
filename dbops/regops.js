const mongoose = require('mongoose');
<<<<<<< HEAD
=======
const sanitize = require('mongo-sanitize');
>>>>>>> origin/main

const regSchema = mongoose.Schema({
    pnumber: {
        type: Number,
        required: true,
        unique: true
    },
<<<<<<< HEAD
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
=======
    pname: {
        type: String,
        required: true
    },
    dob: Date,
    regdate: {
        type: Date,
        default: Date.now
>>>>>>> origin/main
    },
    blood: String,
    gender: {
        type: String,
        enum: ["male", "female"],
        required: true,
        lowercase: true // Converts input to lowercase before saving
    },
<<<<<<< HEAD
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
=======
    through: {
        type: String,
        enum: ["opd", "a&e", "referred"],
        default: "opd",
        lowercase: true // Converts input to lowercase before saving
    },
    knowndiseases: {
        type: [String],
        validate: {
            validator: function (v) {
                // Ensure each string in the array is sanitized
                return v.every(disease => typeof disease === 'string' && sanitize(disease) === disease);
            },
            message: props => `${props.value} is not a valid disease list`
        }
    },
    knownallergies: {
        type: [String],
        validate: {
            validator: function (v) {
                // Ensure each string in the array is sanitized
                return v.every(allergy => typeof allergy === 'string' && sanitize(allergy) === allergy);
            },
            message: props => `${props.value} is not a valid allergy list`
        }
    }
}, { collection: 'Registration' }); // Specify the collection name here

module.exports = mongoose.model('Registration', regSchema);
>>>>>>> origin/main
