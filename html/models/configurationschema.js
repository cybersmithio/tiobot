var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var customerSchema = mongoose.Schema({
	_id: String,   //This is  the tenable.io Access Key, which should be unique among all customers
	name: String,
	secretkey: String,
});

var Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
