const mongoose = require('mongoose');

//to log user activtites for potenial investigations requirements
const logSchema = mongoose.Schema({
    timestamp: String,
    reglog: String,
    user: String
});

module.exports = mongoose.model('Reglog', logSchema);