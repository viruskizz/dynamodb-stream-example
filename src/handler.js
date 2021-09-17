const {generateId, unmarshall, logger} = require("./utility");
const AWS = require("aws-sdk");
const documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event) => {
	// throw new Error('TEST Throw Error');
	for(let record of event.Records) {
		logger(record);
		await Promise.all([
			saveLog(record.eventName, record.dynamodb),
			saveReport(record)
		]);
	}
	return `Successfully processed ${event.Records.length} records.`;
};

function saveLog(event, dynamodb) {
	return documentClient.put({
		TableName: process.env.LOGGING_TABLE,
		Item: {
			id: generateId(),
			event,
			newItems: dynamodb.NewImage ? unmarshall(dynamodb.NewImage) : undefined,
			oldItems: dynamodb.OldImage ? unmarshall(dynamodb.OldImage) : undefined,
		}
	}).promise();
}

async function saveReport(record) {
	const key = 'Invoice';
	const type = 'Total';
	const {eventName, dynamodb} = record;
	const report = await documentClient.get({
		TableName: process.env.REPORT_TABLE,
		Key: {key, type},
	}).promise();
	let value = report.Item && report.Item.value ? report.Item.value : 0;
	if (eventName === 'REMOVE') {
		value -= unmarshall(record.dynamodb.OldImage).total;
	} else {
		value += unmarshall(record.dynamodb.NewImage).total;
	}
	return documentClient.put({
		TableName: process.env.REPORT_TABLE,
		Item: {
			key,
			type,
			value,
		}
	}).promise();
}