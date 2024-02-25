const mongoose = require('mongoose');

//defining schema to store maintenance date/time details
const maintenanceSchema=mongoose.Schema({
    last_maintenance_date: {
        type: Date,
        default: Date.now
    },
    next_maintenance_date: {
        type: Date,
        default: () => new Date(+new Date() + 7*24*60*60*1000) //in 7 days
    }
})

//defining nurses schema to have a list of nurses on each shift
//and indicate who is the shift supervisor
const nurseSchema=mongoose.Schema({
    nusre_id: {
        type: String,
        required: true,
    },
    nurse_name: {
        type: String,
        required: true,
    },
    start_time: {
        type: String,
        required: true,
    },
    end_time: {
        type: String,
        required: true,
    },
    start_date: {
        type: Date,
        required: true,
    },
    end_date: {
        type: Date,
        required: true,
    },
    supervisor:{
        type: String,
        enum: ["yes", "no"],
        required: true,
        lowercase: true
    }
})

//defining medical equipment schema to track medical equipment in each ward
const medicalEquipmentSchema=mongoose.Schema({
    equipment_id: {
        type: String,
        required: true,
    },
    equipment_name: {
        type: String,
        required: true,
    },
    condition:{
        type: String,
        enum: ["new","good", "broken"],
        required: true,
        lowercase: true,
        default:"good"
    },
})

//defining bed schema to be used in rooms
const bedSchema=mongoose.Schema({
    bed_number: {
        type: String,
        required: true,
    },
    status:{
        type: String,
        enum: ["free", "occupied"],
        required: true,
        lowercase: true,
        default:"free"
    },

})

//defining furniture schema to be used in room
const furnitureSchema=mongoose.Schema({
    furniture_number: {
        type: String,
        required: true,
    },
    furniture_name: {
        type: String,
        enum: ["tv", "sofa","chair","fridge","medical bin","general bin"],
        required: true,
        lowercase: true,
    },
})
//defining patient schema to save details on patient admission and discharge
const patientSchema=mongoose.Schema({
    patient_number: {
        type: String,
        required: true,
    },
    bed_number:{
        type: String,
        required: true,
    },
    condition:{
        type:String,
        enum:["critical","serious","fair","good","undetermined"],
        default:"undetermined",
        required: true,
    },
    admission_date:{
        type:Date,
        default: Date.now,
        required: true,
    },
    expected_discharge_date:{
        type:Date,
        default: () => new Date(+new Date() + 1*24*60*60*1000), //in one day
        required: true,
    },

})
//defining room schema to save each room details in a ward including beds and patients
const roomSchema=mongoose.Schema({
    room_number:{
        type:String,
        required:true
    },
    room_type:{
        type:String,
        enum:['vip','standard','shared'],
        required:true,
        lowercase: true,
    },
    capacity:{
        type:Number,
        default:2
    },
    beds:[bedSchema],
    patients:[patientSchema],
    furniture:[furnitureSchema]
})

//Ward schema
const wardSchema = mongoose.Schema({
    ward_number: {
        type: String,
        required: true,
        unique: true
    },
    ward_name: {
        type: String,
        enum:['surgical','maternity','general','intensive care unit','pediatrics','emergency'],
        required: true,
        unique: true
    },
    floor_number: {
        type: String,
        required: true,
    },
    number_of_rooms: {
        type: Number,
        required: true,
        default:0
    },
    capacity: { //total number of beds
        type: Number,
        required: true, 
        default:0
    },
    current_patients: { //ocuupied beds
        type: Number,
        required: true,
        default:0
    },
    contact: { //ocuupied beds
        type: String,
        required: true,
        default:0
    },
    receptionist: { //ocuupied beds
        type: String,
        required: true,
        default:0
    },
    maintenance: [maintenanceSchema],
    medicalEquipment: [medicalEquipmentSchema],
    rooms:[roomSchema],
    nurses:[nurseSchema]
}, { collection: 'Ward Management' }); // Specify the collection name here

module.exports = mongoose.model('Ward Management', wardSchema);