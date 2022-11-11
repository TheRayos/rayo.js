import should from 'should';
import { createServer, request } from 'http';

const helpers = {
  header:
    (key = null, value = null) =>
    (res) => {
      should(res).be.an.Object();
      should(res.headers).be.an.Object();

      if (value) {
        should(res.headers).with.property(key);
        should(res.headers[key]).be.a.String().and.equal(value);
      } else {
        should.not.exist(res.headers[key]);
      }
    },

  size: (size) => (res) => {
    should(res.text.length).be.a.Number().and.equal(size);
  },

  wrap: (module, handler, options) =>
    createServer((req, res) =>
      module(options)(req, res, (error) => (error ? res.end(error.message) : handler(req, res)))
    ),

  request: (options) => {
    return new Promise((yes) => {
      const req = request(options, (response) => {
        const data = [];
        if (response.statusCode === 404) {
          // return no();
        }

        response.on('data', (chunk) => data.push(chunk));
        response.on('end', () => {
          return yes(data.join(''));
        });
      });

      req.end();
    });
  }
};

export default helpers;
