const mongoose = require('mongoose');

//to log user activtites for potenial investigations requirements
<<<<<<< HEAD
const logSchema = mongoose.Schema({
    timestamp: String,
    reglog: String,
    user: String
});

module.exports = mongoose.model('Reglog', logSchema);

=======
const logSchema = new mongoose.Schema({
    timestamp: String,
    reglog: String,
    user: String
}, { collection: 'Reglog' }); // Specify the collection name here

module.exports = mongoose.model('Reglog', logSchema);
>>>>>>> origin/main
