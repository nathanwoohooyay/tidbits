const { Kafka, logLevel } = require('kafkajs');
const { timedCheck } = require('../utils/healthCheck');

const brokers = String(process.env.KAFKA_BOOTSTRAP_SERVERS || '')
  .split(',')
  .map((broker) => broker.trim())
  .filter(Boolean);
const topic = process.env.KAFKA_USER_AUDIT_TOPIC || 'user-audit-events';

const kafka = brokers.length > 0
  ? new Kafka({
      clientId: 'auth-service',
      brokers,
      logLevel: logLevel.NOTHING,
    })
  : null;

let producer;
let producerConnected = false;
let connectPromise;

async function getProducer() {
  if (!kafka) {
    return null;
  }

  if (!producer) {
    producer = kafka.producer({ allowAutoTopicCreation: false });
  }

  if (producerConnected) {
    return producer;
  }

  if (!connectPromise) {
    connectPromise = producer
      .connect()
      .then(() => {
        producerConnected = true;
      })
      .catch((error) => {
        connectPromise = null;
        throw error;
      });
  }

  await connectPromise;
  return producer;
}

async function publishUserAuditEvent({ eventType, userId, username, status, ipAddress, userAgent, details }) {
  try {
    const currentProducer = await getProducer();
    if (!currentProducer) {
      return;
    }

    const event = {
      eventType,
      occurredAt: new Date().toISOString(),
      userId: Number.isInteger(userId) ? userId : null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      username: username || null,
      status: status || null,
      details: details || null,
    };

    await currentProducer.send({
      topic,
      messages: [
        {
          key: event.userId == null ? 'unknown' : String(event.userId),
          value: JSON.stringify(event),
        },
      ],
    });
  } catch (error) {
    console.error('failed to publish user audit event', error);
  }
}

// Whether the Kafka brokers answer, for the health endpoint. Uses its own admin client that doesn't retry, so an outage
// shows up within the check's time limit.
async function checkKafka() {
  if (!kafka) {
    return { status: 'down', reason: 'Kafka not configured' };
  }
  const admin = kafka.admin({ retry: { retries: 0 } });
  try {
    return await timedCheck(async () => {
      await admin.connect();
      await admin.describeCluster();
    }, 'Kafka unreachable');
  } finally {
    admin.disconnect().catch(() => undefined);
  }
}

module.exports = {
  publishUserAuditEvent,
  checkKafka,
};
