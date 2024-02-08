const mongoose = require('mongoose');
const validator = require('validator'); // npm install validator

const patientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required'],
        // Custom validator to check if the date of birth is realistic
        validate: {
            validator: function (value) {
                return value < new Date();
            },
            message: 'Date of birth must be in the past'
        }
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        enum: {
            values: ['patient', 'doctor', 'nurse', 'admin'],
            message: 'Role `{VALUE}` is not supported'
        }
    },
    contactDetails: {
        phone: {
            type: String,
            required: [false, 'Phone number is optional'],
            validate: {
                validator: function (value) {
                    return validator.isMobilePhone(value);
                },
                message: 'Invalid phone number'
            }
        },
        email: {
            type: String,
            required: [false, 'Email is optional'],
            validate: {
                validator: function (value) {
                    return validator.isEmail(value);
                },
                message: 'Invalid email'
            }
        }
    },
    knownDiseases: [{
        type: String,
        required: false
    }]
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
