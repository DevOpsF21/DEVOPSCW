const mongoose = require('mongoose');
const sanitize = require('mongo-sanitize');

const regSchema = mongoose.Schema({
    pnumber: {
        type: Number,
        required: true,
        unique: true
    },
    pname: {
        type: String,
        required: true
    },
    dob: Date,
    regdate: {
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