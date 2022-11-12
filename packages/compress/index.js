import compressible from 'compressible';
import { createGzip } from 'zlib';

const canDo = function canDo({ req, res }) {
  if (!res.compressPass && res.getHeader('content-encoding')) {
    return false;
  }

  const encoding = req.headers['accept-encoding'] || '';
  return encoding.indexOf('gzip') >= 0 && compressible(res.getHeader('content-type'));
};

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary
 */
const vary = function vary({ res, key }) {
  let header = res.getHeader('vary');
  if (!header) {
    res.setHeader('vary', key);
  } else if (header.trim() !== '*') {
    header = header.split(',').map((h) => h.trim());
    if (!header.includes(key)) {
      header.push(key);
      res.setHeader('vary', header.join(', '));
    }
  }
};

const press = function press({ res, zip, data, encoding }) {
  if (!res.getHeader('content-encoding')) {
    res.compressPass = true;
    const poweredBy = ['@rayo/compress', res.getHeader('x-powered-by')].filter((h) => h).join(', ');
    res.setHeader('x-powered-by', poweredBy);
    res.setHeader('content-encoding', 'gzip');
    res.removeHeader('content-length');
    vary({ res, key: 'content-encoding' });
  }

  zip.write(Buffer.from(data, encoding));
};

export default function compress(options = {}) {
  return (req, res, step) => {
    const { write, end } = res;
    const zip = createGzip(options);
    zip.on('data', write.bind(res)).on('end', end.bind(res));

    res.write = (data, encoding = 'utf8') =>
      canDo({ req, res }) ? press({ res, zip, data, encoding }) : write.call(res, data, encoding);

    res.end = (data = null, encoding = 'utf8') => {
      if (!data) {
        return zip.end();
      }

      if (canDo({ req, res })) {
        press({ res, zip, data, encoding });
        return zip.end();
      }

      res.setHeader('content-length', data.length);
      return end.call(res, data, encoding);
    };

    return step();
  };
}
