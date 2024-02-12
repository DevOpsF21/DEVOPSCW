const mongoose = require('mongoose');

//to log user activtites for potenial investigations requirements
const logSchema = new mongoose.Schema({
    timestamp: String,
    reglog: String,
    user: String
}, { collection: 'Reglog' }); // Specify the collection name here

module.exports = mongoose.model('Reglog', logSchema);