const {generateId, unmarshall, logger, httpsPost} = require("./utility");
const AWS = require("aws-sdk");
const documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event) => {
	try {
		for(let record of event.Records) {
			logger(record);
			verifyBody(record.dynamodb);
			await Promise.all([
				saveLog(record.eventName, record.dynamodb),
				saveReport(record)
			])
		}
		return `Successfully processed ${event.Records.length} records.`;
	} catch(e) {
		await postDiscord(e);
		throw Error(e);
	}
};

function verifyBody(record) {
	const data = unmarshall(record.dynamodb.NewImage);
	if (data.total < 0) {
		throw new Error('Total value cannot be lowwer than 0');
	}
}

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
		value -= unmarshall(record.dynamodb.OldImage).total || 0;
	} else {
		value += unmarshall(record.dynamodb.NewImage).total || 0;
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

async function postDiscord(data) {
	return httpsPost({
		hostname: 'discord.com',
		path: 'api/webhooks/' + process.env.DISCORD_HOOK_PATH,
		headers: {
				'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			 content: 'AWS Community Speaker Error testing\n' +
			 '```\n' +
			 JSON.stringify(data)+
			 '```',
		})
	});
}

