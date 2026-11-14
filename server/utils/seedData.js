const bcrypt = require('bcryptjs');
const db = require('../db/jsonDb');

async function seedData(force = false) {
  // If already seeded and not force, skip
  const existingManagers = db.findAll('managers');
  if (existingManagers.length > 0 && !force) {
    return;
  }

  if (force) {
    db.reset();
  }

  // 1. Create Default Queue Manager
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);

  const manager = db.insert('managers', {
    name: 'Sarah Connor (Lead Queue Manager)',
    email: 'admin@queueflow.com',
    username: 'admin',
    passwordHash,
    role: 'manager'
  });

  const now = new Date();
  const todayAt = (hours, minutes = 0) => {
    const d = new Date(now);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  // 2. Create Sample Queues
  const queue1 = db.insert('queues', {
    managerId: manager.id,
    name: 'Doctor Consultation OPD',
    description: 'General outpatient medical consultations and checkups',
    prefix: 'DOC',
    department: 'Healthcare',
    status: 'active',
    tokenCounter: 108,
    currentServingTokenId: null
  });

  const queue2 = db.insert('queues', {
    managerId: manager.id,
    name: 'Customer Support & KYC',
    description: 'Account verification, KYC updates, and account services',
    prefix: 'SUP',
    department: 'Customer Service',
    status: 'active',
    tokenCounter: 206,
    currentServingTokenId: null
  });

  const queue3 = db.insert('queues', {
    managerId: manager.id,
    name: 'Billing & Cash Counter',
    description: 'Payments, invoice settlements, and receipts',
    prefix: 'BIL',
    department: 'Finance',
    status: 'active',
    tokenCounter: 305,
    currentServingTokenId: null
  });

  // 3. Create Sample Tokens for Queue 1 (Doctor OPD)
  // Completed tokens from earlier hours
  db.insert('tokens', {
    queueId: queue1.id,
    tokenNumber: 'DOC-101',
    personName: 'Alexander Hayes',
    personPhone: '+1 555-0192',
    serviceReason: 'Annual Health Checkup',
    priority: 'normal',
    status: 'COMPLETED',
    position: null,
    createdAt: todayAt(8, 45),
    serviceStartedAt: todayAt(9, 2),
    completedAt: todayAt(9, 18),
    createdBy: manager.email
  });

  db.insert('tokens', {
    queueId: queue1.id,
    tokenNumber: 'DOC-102',
    personName: 'Emily Watson',
    personPhone: '+1 555-0144',
    serviceReason: 'Fever & Flu Consultation',
    priority: 'vip',
    status: 'COMPLETED',
    position: null,
    createdAt: todayAt(9, 10),
    serviceStartedAt: todayAt(9, 20),
    completedAt: todayAt(9, 38),
    createdBy: manager.email
  });

  db.insert('tokens', {
    queueId: queue1.id,
    tokenNumber: 'DOC-103',
    personName: 'Marcus Brody',
    personPhone: '+1 555-0188',
    serviceReason: 'Blood Pressure Followup',
    priority: 'normal',
    status: 'COMPLETED',
    position: null,
    createdAt: todayAt(9, 25),
    serviceStartedAt: todayAt(9, 40),
    completedAt: todayAt(9, 55),
    createdBy: manager.email
  });

  // Cancelled token
  db.insert('tokens', {
    queueId: queue1.id,
    tokenNumber: 'DOC-104',
    personName: 'Robert Vance',
    personPhone: '+1 555-0131',
    serviceReason: 'Prescription Renewal',
    priority: 'normal',
    status: 'CANCELLED',
    position: null,
    createdAt: todayAt(10, 0),
    serviceStartedAt: null,
    completedAt: null,
    cancelledAt: todayAt(10, 20),
    cancellationReason: 'Patient had an emergency and rescheduled',
    createdBy: manager.email
  });

  // Token currently IN_SERVICE
  const inServiceToken = db.insert('tokens', {
    queueId: queue1.id,
    tokenNumber: 'DOC-105',
    personName: 'Sophia Chen',
    personPhone: '+1 555-0177',
    serviceReason: 'Chest X-Ray Review',
    priority: 'normal',
    status: 'IN_SERVICE',
    position: null,
    createdAt: new Date(Date.now() - 14 * 60000).toISOString(), // created 14 min ago
    serviceStartedAt: new Date(Date.now() - 4 * 60000).toISOString(), // started serving 4 min ago
    completedAt: null,
    cancelledAt: null,
    createdBy: manager.email
  });

  db.update('queues', queue1.id, { currentServingTokenId: inServiceToken.id });

  // Tokens currently WAITING (with sequential positions 1, 2, 3...)
  db.insert('tokens', {
    queueId: queue1.id,
    tokenNumber: 'DOC-106',
    personName: 'David Miller',
    personPhone: '+1 555-0165',
    serviceReason: 'ENT Consultation',
    priority: 'vip',
    status: 'WAITING',
    position: 1,
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    serviceStartedAt: null,
    completedAt: null,
    createdBy: manager.email
  });

  db.insert('tokens', {
    queueId: queue1.id,
    tokenNumber: 'DOC-107',
    personName: 'Olivia Taylor',
    personPhone: '+1 555-0153',
    serviceReason: 'Routine Blood Test Discussion',
    priority: 'normal',
    status: 'WAITING',
    position: 2,
    createdAt: new Date(Date.now() - 6 * 60000).toISOString(),
    serviceStartedAt: null,
    completedAt: null,
    createdBy: manager.email
  });

  db.insert('tokens', {
    queueId: queue1.id,
    tokenNumber: 'DOC-108',
    personName: 'Lucas Martin',
    personPhone: '+1 555-0129',
    serviceReason: 'Dermatology Assessment',
    priority: 'normal',
    status: 'WAITING',
    position: 3,
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
    serviceStartedAt: null,
    completedAt: null,
    createdBy: manager.email
  });

  // 4. Sample Tokens for Queue 2 (Customer Support)
  db.insert('tokens', {
    queueId: queue2.id,
    tokenNumber: 'SUP-201',
    personName: 'James Wilson',
    personPhone: '+1 555-0211',
    serviceReason: 'Account KYC Documentation',
    priority: 'normal',
    status: 'COMPLETED',
    position: null,
    createdAt: todayAt(9, 0),
    serviceStartedAt: todayAt(9, 12),
    completedAt: todayAt(9, 25),
    createdBy: manager.email
  });

  db.insert('tokens', {
    queueId: queue2.id,
    tokenNumber: 'SUP-202',
    personName: 'Chloe Bennett',
    personPhone: '+1 555-0222',
    serviceReason: 'Password & Token Reset',
    priority: 'normal',
    status: 'WAITING',
    position: 1,
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    serviceStartedAt: null,
    completedAt: null,
    createdBy: manager.email
  });

  db.insert('tokens', {
    queueId: queue2.id,
    tokenNumber: 'SUP-203',
    personName: 'Ethan Garcia',
    personPhone: '+1 555-0233',
    serviceReason: 'Wire Transfer Verification',
    priority: 'vip',
    status: 'WAITING',
    position: 2,
    createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
    serviceStartedAt: null,
    completedAt: null,
    createdBy: manager.email
  });

  console.log('✅ Seed data initialized successfully.');
  console.log('   Manager: admin@queueflow.com / admin123');
  console.log(`   Created 3 queues and ${db.findAll('tokens').length} sample tokens.`);
}

// Run if called directly
if (require.main === module) {
  seedData(true).then(() => {
    process.exit(0);
  });
}

module.exports = seedData;
