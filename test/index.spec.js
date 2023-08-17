const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../src/app');
const Promise = require('bluebird');
const should = chai.should();

chai.use(chaiHttp);

describe('express_basics', () => {

    it('Should return 200 for /repos', (done) => {
        chai.request(server)
            .get('/repos')
            .then(response => {
                response.status.should.eql(200);
                response.body.should.not.eql([]);
                done()
            })
    });

});
