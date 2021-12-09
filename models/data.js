const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    payment: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Data', dataSchema);