const User = require('../models/User');

function envFlagEnabled(name, defaultValue = true) {
  const value = process.env[name];
  if (value == null || value === '') return defaultValue;
  return value !== '0' && value.toLowerCase() !== 'false';
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeName(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

async function buildUniqueUsername(baseUsername, existingUserId) {
  const cleanedBase = (baseUsername || 'admin')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 24) || 'admin';

  let candidate = cleanedBase;
  let suffix = 1;

  while (true) {
    const conflict = await User.findOne({
      username: candidate,
      ...(existingUserId ? { _id: { $ne: existingUserId } } : {})
    }).select('_id');

    if (!conflict) return candidate;

    candidate = `${cleanedBase.slice(0, Math.max(1, 24 - String(suffix).length - 1))}-${suffix}`;
    suffix += 1;
  }
}

/**
 * Ensure a deploy-safe admin account exists.
 * Intended for production hosts like Render where the database may be reset.
 */
async function ensureAdminUser() {
  const enabled = envFlagEnabled('AUTO_BOOTSTRAP_ADMIN', true);
  if (!enabled) {
    console.log('Admin bootstrap: skipped (AUTO_BOOTSTRAP_ADMIN disabled).');
    return;
  }

  const email = normalizeEmail(
    process.env.ADMIN_EMAIL ||
      (process.env.NODE_ENV === 'production' ? '' : 'admin@vitacoin.com')
  );
  const password =
    process.env.ADMIN_PASSWORD ||
    (process.env.NODE_ENV === 'production' ? '' : 'admin123');

  if (!email || !password) {
    console.log('Admin bootstrap: skipped (set ADMIN_EMAIL and ADMIN_PASSWORD to enable).');
    return;
  }

  const desiredFirstName = normalizeName(process.env.ADMIN_FIRST_NAME, 'Admin');
  const desiredLastName = normalizeName(process.env.ADMIN_LAST_NAME, 'User');
  const desiredUsername = await buildUniqueUsername(
    process.env.ADMIN_USERNAME || email.split('@')[0] || 'admin'
  );

  const existingAdmin = await User.findOne({ email }).select('+password');

  if (existingAdmin) {
    existingAdmin.username = await buildUniqueUsername(desiredUsername, existingAdmin._id);
    existingAdmin.password = password;
    existingAdmin.firstName = desiredFirstName;
    existingAdmin.lastName = desiredLastName;
    existingAdmin.role = 'admin';
    existingAdmin.isActive = true;
    existingAdmin.lastLogin = existingAdmin.lastLogin || new Date();
    await existingAdmin.save();
    console.log(`Admin bootstrap: verified admin user ${email}.`);
    return;
  }

  const adminUser = new User({
    username: desiredUsername,
    email,
    password,
    firstName: desiredFirstName,
    lastName: desiredLastName,
    role: 'admin',
    isActive: true
  });

  await adminUser.save();
  console.log(`Admin bootstrap: created admin user ${email}.`);
}

module.exports = { ensureAdminUser };
