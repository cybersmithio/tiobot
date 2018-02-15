var express=require('express');
var app=express();

//So we can read configuration files, load the file module
var fs=require('fs');

//Load the https module so we can generate queries to Tenable.io
// and so we can run a secure server
var https=require('https');
//Define the location of the certificate and private key
var httpsServerOptions = {
	key: fs.readFileSync(__dirname + '/ssl/key.pem'),
	cert: fs.readFileSync(__dirname + '/ssl/cert.crt'),
}
app.set('httpsServerPort', process.env.PORT || 443);

var errorLog = require('./lib/errorLog.js');
var debugLog = require('./lib/debugLog.js');
debugLogFlag=true;

//Load the q module that will allow us to gather the data from
// Tenable.io in an asynchronous manner and then display.
var Q = require('q');

//Read in the configuration file
var configuration = require('./configuration/config.js');

//Setup mongo DB
var mongoose = require('mongoose');
var opts = {
	server: {
		socketOptions: { keepAlive: 1 }
	}
};


switch(app.get('env')){
  case 'development':
    mongoose.connect(configuration.mongo.development.connectionString, opts);
    break;
  case 'production':
    mongoose.connect(configuration.mongo.production.connectionString, opts);
    break;
  default:
    throw new Error('Unknown execution environment: ' + app.get('env'));

}

//Add the Mongodb schema for customer entries
var Customer = require('./models/customerschema.js');


var handlebars=require('express-handlebars').create({
	defaultLayout:'tiobot',
});

app.engine('handlebars',handlebars.engine);
app.set('view engine','handlebars');

app.use(express.static(__dirname + '/public'));

app.use(require('body-parser').urlencoded({extended: true}));

//Declare home page route
app.get('/',function(req,res) {
	//Start the initialization of all the cache data
	debugLog('Showing home page');

	options={sort: {name: 1}};
	//Query the database for all the customers
	Customer.find(null,null,options,function(err, customers) {
		if(err) return console.error(err);
		debugLog('No errors so far');
		debugLog('Setting the context variable');
		debugLog('Rendering dashboard',customers);
		//Query the database for the summary of the vulnerabilities

 		res.render('home', {customers: customers, layout: 'tiobot'});
	});
});

//Adding form to add new customers
app.get('/addcust',function(req,res) {
  res.render('addcust',{csrf: 'CSRF token goes here later'});
});

app.post('/addcust',function(req,res) {
	debugLog('Form (from querystring): '+req.query.form);
	debugLog('CSRF token (from hidden form field): '+req.body._csrf);
	new Customer({
		name: req.body.custname,
		_id: req.body.accesskey,
		secretkey: req.body.secretkey,
		cvssalertthreshold: req.body.cvssalertthreshold,
		alertemail: req.body.alertemail,
		syslogserver: req.body.syslogserver,
		lastrefresh: 0
	}).save(function(err) {
		if(err) {
			errorLog('There was an error creating the new customer',err);
		}
	});

	debugLog('New customer should be saved, redirecting (303) now');
	res.redirect(303,'/custlist');
});

app.post('/delcust',function(req,res) {
	//todo: scrub the req variables for SQL injection
	debugLog('Form (from querystring): '+req.query.form);
	debugLog('CSRF token (from hidden form field): '+req.body._csrf);
	Customer.remove({ name: req.body.custname}, function(err,obj) {
		if(err) {
			errorLog('Error removing customer',req.body.custname,':',err);
		} else {
			//console.log(obj.result.n + ' document(s) deleted')
			console.log('Deleted customer',req.body.custname,req.body.custid)
		}
		
	})

	debugLog('Deleted customer',req.body.custname,' redirecting (303) now');

	res.redirect(303,'/custlist');
});

app.get('/custlist',function(req,res) {
	debugLog('Showing list of existing customers');

	options={sort: {name: 1}};
	Customer.find(null,null,options,function(err, customers) {
		if(err) { 
			return debugLog(err);
		} else {
			debugLog('No errors so far');

			debugLog('Setting the context variable');
			var context = {
				customers: customers.map(function(customer) {
					debugLog('found customer',customer);
					return {
						name: customer.name,
						accesskey: customer._id,
						secretkey: customer.secretkey,
					}
				})
			};
			debugLog('Context variable:',context);
			res.render('custlist', context);
		}
	});
});





app.post('/editcust',function(req,res) {
	Customer.find({name: req.body.custname},function(err, customers) {
		if(err) {
			res.status(500);
			res.render('500');
			return console.error(err);
		} else {
			debugLog('No errors so far');

			debugLog('Setting the context variable');
			var context = {
				customers: customers.map(function(customer) {
					//debugLog('found customer',customer);
					return {
						name: customer.name,
						accesskey: customer._id,
						secretkey: customer.secretkey,
						cvssalertthreshold: customer.cvssalertthreshold,
						alertemail: customer.alertemail,
						syslogserver: customer.syslogserver
					}
				})
			};
			res.render('editcust', context);
		}
	});
});

app.post('/updatecust',function(req,res) {
	debugLog('/updatecust: Form (from querystring): '+req.query.form);
	debugLog('CSRF token (from hidden form field): '+req.body._csrf);
	debugLog('Updating',req.body.name,'with',req.body.accesskey);
	Customer.update({ name: req.body.name}, {_id: req.body.accesskey, secretkey: req.body.secretkey, alertemail: req.body.alertemail, syslogserver: req.body.syslogserver, cvssalertthreshold: req.body.cvssalertthreshold}, function(err) {
		debugLog('Error updating customer',req.body.custname,':',err);
	})

	debugLog('Updated customer',req.body.custname,' redirecting (303) now');

	res.redirect(303,'/custlist');
});


function mongoRetrieveSingleCustomerPromise(cid) {
	var deferred = Q.defer();
	debugLog("Making Promise to download customer name from Mongo")

	Customer.findOne({_id: cid},function(err, customer) {
		if(err) {
			debugLog("Error download customer from mongoDB",err);
			deferred.reject(err);
		} else {
			debugLog("Retrieved customer name",customer.name)
			deferred.resolve(customer);
		}
	});

	console.log('Returning deferred promise for downloading customer name from Mongo');
	return deferred.promise;
}



//Error handling
app.use(function(req,res,next) {
  res.status(404);
  res.render('404');
});

app.use(function(err,req,res,next) {
  console.error(err.stack);
  res.status(500);
  res.render('500');
});

https.createServer(httpsServerOptions, app).listen(app.get('httpsServerPort'), function () {
	console.log('Express started in '+app.get('env') + ' mode on port ' + app.get('httpsServerPort') + ' using HTTPS. ;press CTRL-C to terminate.');
});
