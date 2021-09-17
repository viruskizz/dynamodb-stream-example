const AWS = require("aws-sdk");
const crypto = require("crypto");

exports.unmarshall = (marshall) => {
	return AWS.DynamoDB.Converter.unmarshall(marshall);
}

exports.logger = (data) => {
	console.log('Stream Data: ', JSON.stringify(data, null, 2));
}

exports.generateId = () => {
	const id = crypto.randomBytes(16).toString("hex");
	return id;
}

exports.httpsPost = ({body, ...options}) => {
  return new Promise((resolve,reject) => {
    const req = https.request({
        method: 'POST',
        ...options,
    }, res => {
      const chunks = [];
      res.on('data', data => chunks.push(data));
      res.on('end', () => {
        let body = Buffer.concat(chunks);
        switch(res.headers['content-type']) {
          case 'application/json':
            body = JSON.parse(body);
            break;
        }
        resolve(body);
      });
    });
    req.on('error',reject);
    if(body) {
        req.write(body);
    }
    req.end();
  });
};
