console.log('Loaded config.js');
module.exports = {
	updateFrequency: {
	    //10000ms = Every 10 seconds
	    //300000ms = Every 5 minutes
		development: {
    		vulnerabilities: 10000,
		},
		production: {
    		vulnerabilities: 300000,
		}
	},
	mongo: {
		development: {
			connectionString: 'mongodb://tiovulndb/tiovulndb',
		},
		production: {
			connectionString: 'mongodb://tiovulndb/tiovulndb',
		}
	},
	smtp: {
        development: {
            server: 'localhost',
            username: '',
            password: '',
            secure: true
        },
        production: {
            server: 'localhost',
            username: '',
            password: '',
            secure: true
        }
	}
}
