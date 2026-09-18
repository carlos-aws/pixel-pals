// Lambda handler behind API Gateway (HTTP API + Cognito JWT authorizer).
// The AWS SDK v3 is bundled in the Node.js 22 Lambda runtime; no npm install needed.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { createService, route } from './logic.mjs';

const TABLE = process.env.TABLE_NAME;
const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions: { removeUndefinedValues: true } });

const db = {
  async get(PK, SK) { const r = await doc.send(new GetCommand({ TableName: TABLE, Key: { PK, SK } })); return r.Item || null; },
  async query(PK) {
    const out = [];
    let ExclusiveStartKey;
    do {
      const r = await doc.send(new QueryCommand({ TableName: TABLE, KeyConditionExpression: 'PK = :p', ExpressionAttributeValues: { ':p': PK }, ExclusiveStartKey }));
      out.push(...(r.Items || []));
      ExclusiveStartKey = r.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return out;
  },
  async put(item, cond) {
    const params = { TableName: TABLE, Item: item };
    if (cond?.ifNotExists) params.ConditionExpression = 'attribute_not_exists(PK)';
    else if (cond?.ifVersion !== undefined) { params.ConditionExpression = 'version = :v'; params.ExpressionAttributeValues = { ':v': cond.ifVersion }; }
    try { await doc.send(new PutCommand(params)); return true; }
    catch (e) { if (e.name === 'ConditionalCheckFailedException') return false; throw e; }
  },
  async delete(PK, SK) { await doc.send(new DeleteCommand({ TableName: TABLE, Key: { PK, SK } })); },
};

const service = createService(db);

export const handler = async (event) => {
  const sub = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!sub) return respond(401, { error: 'unauthorized' });
  let body = {};
  if (event.body) {
    try { body = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body); }
    catch { return respond(400, { error: 'invalid JSON' }); }
  }
  try {
    const res = await route(service, {
      method: event.requestContext.http.method,
      path: event.rawPath.replace(/^\/[^/]+\/?/, (m) => (m.startsWith('/profiles') ? m : '/')), // tolerate a stage prefix
      sub,
      query: event.queryStringParameters || {},
      body,
    });
    return respond(res.status, res.body);
  } catch (e) {
    console.error(e);
    return respond(500, { error: 'server error' });
  }
};

function respond(statusCode, body) {
  return { statusCode, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(body) };
}
