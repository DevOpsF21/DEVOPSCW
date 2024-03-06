const mongoose = require('mongoose');

const inpatientSchema = mongoose.Schema({
    pnumber: {
        type: Number,
        required: true,
    },
    department: {
        type: String,
        required: true
    },
    ward_name: {
        type: String,
        required: true
    },
    room_number: {
        type: Number,
        required: true
    },
    bed_number: {
        type: Number,
        required: true
    },
    admission_date: {
        type: Date,
        required: true
    },
    expected_discharge_date: {
        type: Date,
        required: true
    },
    discharge_date: {
        type: Date,
        default:null
    },
    vital_signs:{
        bp:[{
            nurse_id:Number,
            last_checked: Date,
            systolic_pressure:Number,
            diastolic_pressure:Number,
            systolic_status:String,
            diastolic_status:String,
        }],
        cardiac:[{
            nurse_id:Number,
            last_checked: Date,
            heart_rate:Number,
            pulse:Number,
            hr_status:String,
            pulse_status:String,
        }],
        temprature:[{
            last_checked: Date,
            temprature:Number,
            measure:String,
            status:String,
        }],
    },
    medications:[{
        medication_name:String,
        dosage:Number,
        intake:[{
            last_intake: Date,
            nurse_number:Number,
        }]
    }],
    report:[{
        comment:String,
        comment_date:Date
    }],
    discharge_report:{
        doctor_id:Number ,
        diagnosis:String,
        treatmen_taken:String,
        discharge_reason:String,
        future_treatment:String,
        perscribed_medications:String,
        report_date:Date,
    },
}, { collection: 'Inpatient' }); // Specify the collection name here

module.exports = mongoose.model('Inpatient', inpatientSchema);