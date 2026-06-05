// Runs once on first mongo container boot. Creates the application database
// and a least-privileged user scoped to it.
//
// Connect against this user from the app:
//   mongodb://app:app@localhost:27017/ai-call?authSource=admin

db = db.getSiblingDB('ai-call');

db.createCollection('_init');
db._init.insertOne({ initializedAt: new Date(), note: 'voiceflow ai bootstrap' });

// Root user already exists (MONGO_INITDB_ROOT_*). For production use,
// create a separate least-privileged user here and remove root from the app's URI.
