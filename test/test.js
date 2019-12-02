const chai = require("chai");
const chaiHttp = require("chai-http");
const app = "localhost:8080";
const { expect } = chai;
const should = chai.should();
chai.use(chaiHttp);
describe("App", function() {
  it("should list give a login form on /login", done => {
    chai
      .request(app)
      .get("/login")
      .end(function(err, res) {
        res.should.have.status(200);
        done();
      });
  });
});
