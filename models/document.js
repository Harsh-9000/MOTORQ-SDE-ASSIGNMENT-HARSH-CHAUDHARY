const mongoose = require('mongoose');

const documentSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    shared: {
        type: [String],
        default: [],
    }
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;