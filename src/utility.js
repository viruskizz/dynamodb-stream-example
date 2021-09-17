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