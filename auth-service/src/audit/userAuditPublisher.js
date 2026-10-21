const { Kafka, logLevel } = require('kafkajs');

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

function resolveIpAddress(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return req.ip || null;
}

async function publishUserAuditEvent({ eventType, userId, username, status, ipAddress, details }) {
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

module.exports = {
  publishUserAuditEvent,
  resolveIpAddress,
};
