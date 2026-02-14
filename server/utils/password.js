import bcrypt from "bcryptjs";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? "10", 10);

export function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
