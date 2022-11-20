const mongoose = require('mongoose');
const dotenv = require('dotenv');

if (!process.env.LINK) {
    console.log('note');
    dotenv.config();
}

const link = process.env.LINK;
const conn = mongoose.createConnection(link);

const Schema = mongoose.Schema;
const note = new Schema({
    title: String,
    author: String,
    data: String,
    date: Date
});

const Note = conn.model('notes', note);
module.exports = Note;