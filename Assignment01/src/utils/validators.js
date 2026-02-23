const validator = require('validator');
const mongoose = require('mongoose');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateEmail(email) {
  return typeof email === 'string' && validator.isEmail(email);
}

function validatePassword(pw) {
  return typeof pw === 'string' && pw.length >= 6;
}

function validateObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function parseDate(dateValue) {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

module.exports = {
  isNonEmptyString,
  validateEmail,
  validatePassword,
  validateObjectId,
  parseDate
};
