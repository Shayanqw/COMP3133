const { GraphQLScalarType, Kind } = require('graphql');
const { nanoid } = require('nanoid');

const User = require('../models/User');
const Employee = require('../models/Employee');

const { signToken, isAuthRequired } = require('../config/auth');
const { uploadEmployeePhoto } = require('../config/cloudinary');

const {
  isNonEmptyString,
  validateEmail,
  validatePassword,
  validateObjectId,
  parseDate
} = require('../utils/validators');

const { badUserInput, unauthenticated, notFound, conflict, internalError } = require('../utils/errors');

// Simple ISO Date scalar
const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type (ISO string in/out)',
  serialize(value) {
    const d = new Date(value);
    return d.toISOString();
  },
  parseValue(value) {
    const d = parseDate(value);
    if (!d) throw badUserInput('Invalid date format. Use ISO string like 2026-02-22.');
    return d;
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) throw badUserInput('Date must be a string.');
    const d = parseDate(ast.value);
    if (!d) throw badUserInput('Invalid date format. Use ISO string like 2026-02-22.');
    return d;
  }
});

function requireAuth(ctx) {
  if (!isAuthRequired()) return;
  if (!ctx.user) throw unauthenticated();
}

function normalizeGender(gender) {
  if (!gender) return 'Other';
  const g = gender.toString().trim();
  const allowed = ['Male', 'Female', 'Other'];
  const match = allowed.find((x) => x.toLowerCase() === g.toLowerCase());
  return match || null;
}

function validateEmployeeInput(input, { isUpdate = false } = {}) {
  const errors = [];

  const requiredIfCreate = (field, label = field) => {
    if (!isUpdate && !isNonEmptyString(input[field])) {
      errors.push(`${label} is required`);
    }
  };

  requiredIfCreate('first_name', 'first_name');
  requiredIfCreate('last_name', 'last_name');
  requiredIfCreate('designation', 'designation');
  requiredIfCreate('department', 'department');

  if (!isUpdate) {
    if (!validateEmail(input.email)) errors.push('Valid email is required');
  } else if (input.email !== undefined && !validateEmail(input.email)) {
    errors.push('Valid email is required');
  }

  if (!isUpdate) {
    if (typeof input.salary !== 'number') errors.push('salary is required');
    else if (input.salary < 1000) errors.push('salary must be >= 1000');
  } else if (input.salary !== undefined) {
    if (typeof input.salary !== 'number') errors.push('salary must be a number');
    else if (input.salary < 1000) errors.push('salary must be >= 1000');
  }

  if (!isUpdate) {
    if (!input.date_of_joining) errors.push('date_of_joining is required');
    else if (!parseDate(input.date_of_joining)) errors.push('date_of_joining must be a valid date');
  } else if (input.date_of_joining !== undefined && !parseDate(input.date_of_joining)) {
    errors.push('date_of_joining must be a valid date');
  }

  if (input.gender !== undefined) {
    const g = normalizeGender(input.gender);
    if (!g) errors.push('gender must be Male, Female, or Other');
  }

  return errors;
}

async function maybeUploadPhoto(employee_photo) {
  if (!employee_photo || !isNonEmptyString(employee_photo)) return null;

  // Use a short unique id; Cloudinary will store inside folder
  const publicId = `emp_${nanoid(10)}`;
  const uploaded = await uploadEmployeePhoto(employee_photo, publicId);
  return uploaded.url;
}

const resolvers = {
  Date: DateScalar,

  Query: {
    async login(_, { usernameOrEmail, password }) {
      if (!isNonEmptyString(usernameOrEmail)) throw badUserInput('usernameOrEmail is required');
      if (!isNonEmptyString(password)) throw badUserInput('password is required');

      const isEmail = validateEmail(usernameOrEmail);
      const user = await User.findOne(isEmail ? { email: usernameOrEmail.toLowerCase() } : { username: usernameOrEmail });

      if (!user) {
        throw badUserInput('Invalid credentials');
      }

      const ok = await user.comparePassword(password);
      if (!ok) {
        throw badUserInput('Invalid credentials');
      }

      const token = signToken({ userId: user._id.toString(), username: user.username });

      return {
        success: true,
        message: 'Login successful',
        token,
        user
      };
    },

    async getAllEmployees(_, __, ctx) {
      requireAuth(ctx);

      const employees = await Employee.find({}).sort({ created_at: -1 });
      return {
        success: true,
        message: 'Employees fetched successfully',
        employees,
        count: employees.length
      };
    },

    async searchEmployeeByEid(_, { eid }, ctx) {
      requireAuth(ctx);

      if (!validateObjectId(eid)) throw badUserInput('Invalid employee id (eid).');

      const employee = await Employee.findById(eid);
      if (!employee) throw notFound('Employee not found');

      return {
        success: true,
        message: 'Employee fetched successfully',
        employee
      };
    },

    async searchEmployeesByDesignationOrDepartment(_, { designation, department }, ctx) {
      requireAuth(ctx);

      if (!designation && !department) {
        throw badUserInput('Provide designation or department (at least one).');
      }

      const filter = {};
      if (designation) filter.designation = { $regex: designation, $options: 'i' };
      if (department) filter.department = { $regex: department, $options: 'i' };

      const employees = await Employee.find(filter).sort({ created_at: -1 });
      return {
        success: true,
        message: 'Employees fetched successfully',
        employees,
        count: employees.length
      };
    }
  },

  Mutation: {
    async signup(_, { username, email, password }) {
      const errs = [];
      if (!isNonEmptyString(username)) errs.push('username is required');
      if (!validateEmail(email)) errs.push('Valid email is required');
      if (!validatePassword(password)) errs.push('password must be at least 6 characters');
      if (errs.length) throw badUserInput('Validation failed', errs);

      const existing = await User.findOne({ $or: [{ username }, { email: email.toLowerCase() }] });
      if (existing) {
        throw conflict('Username or email already exists');
      }

      const user = new User({
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password
      });

      await user.save();
      const token = signToken({ userId: user._id.toString(), username: user.username });

      return {
        success: true,
        message: 'Signup successful',
        token,
        user
      };
    },

    async addEmployee(_, { employee }, ctx) {
      requireAuth(ctx);

      const errors = validateEmployeeInput(employee, { isUpdate: false });
      if (errors.length) throw badUserInput('Validation failed', errors);

      const gender = normalizeGender(employee.gender) || 'Other';

      let photoUrl = '';
      try {
        const uploaded = await maybeUploadPhoto(employee.employee_photo);
        if (uploaded) photoUrl = uploaded;
      } catch (e) {
        throw badUserInput(`Photo upload failed: ${e.message}`);
      }

      try {
        const doc = await Employee.create({
          first_name: employee.first_name.trim(),
          last_name: employee.last_name.trim(),
          email: employee.email.toLowerCase().trim(),
          gender,
          designation: employee.designation.trim(),
          salary: employee.salary,
          date_of_joining: parseDate(employee.date_of_joining),
          department: employee.department.trim(),
          employee_photo: photoUrl
        });

        return {
          success: true,
          message: 'Employee created successfully',
          employee: doc
        };
      } catch (e) {
        if (e && e.code === 11000) {
          throw conflict('Employee email already exists');
        }
        throw internalError(e.message);
      }
    },

    async updateEmployeeByEid(_, { eid, updates }, ctx) {
      requireAuth(ctx);

      if (!validateObjectId(eid)) throw badUserInput('Invalid employee id (eid).');

      const errors = validateEmployeeInput(updates, { isUpdate: true });
      if (errors.length) throw badUserInput('Validation failed', errors);

      const updateDoc = { ...updates };

      if (updateDoc.gender !== undefined) {
        const g = normalizeGender(updateDoc.gender);
        if (!g) throw badUserInput('gender must be Male, Female, or Other');
        updateDoc.gender = g;
      }

      if (updateDoc.email !== undefined) {
        updateDoc.email = updateDoc.email.toLowerCase().trim();
      }

      if (updateDoc.first_name !== undefined) updateDoc.first_name = updateDoc.first_name.trim();
      if (updateDoc.last_name !== undefined) updateDoc.last_name = updateDoc.last_name.trim();
      if (updateDoc.designation !== undefined) updateDoc.designation = updateDoc.designation.trim();
      if (updateDoc.department !== undefined) updateDoc.department = updateDoc.department.trim();

      if (updateDoc.date_of_joining !== undefined) {
        updateDoc.date_of_joining = parseDate(updateDoc.date_of_joining);
      }

      if (updateDoc.employee_photo !== undefined) {
        try {
          const uploaded = await maybeUploadPhoto(updateDoc.employee_photo);
          updateDoc.employee_photo = uploaded || '';
        } catch (e) {
          throw badUserInput(`Photo upload failed: ${e.message}`);
        }
      }

      try {
        const employee = await Employee.findByIdAndUpdate(eid, updateDoc, {
          new: true,
          runValidators: true
        });

        if (!employee) throw notFound('Employee not found');

        return {
          success: true,
          message: 'Employee updated successfully',
          employee
        };
      } catch (e) {
        if (e && e.code === 11000) {
          throw conflict('Employee email already exists');
        }
        if (e.extensions) throw e;
        throw internalError(e.message);
      }
    },

    async deleteEmployeeByEid(_, { eid }, ctx) {
      requireAuth(ctx);

      if (!validateObjectId(eid)) throw badUserInput('Invalid employee id (eid).');

      const employee = await Employee.findByIdAndDelete(eid);
      if (!employee) throw notFound('Employee not found');

      return {
        success: true,
        message: 'Employee deleted successfully',
        deletedEmployeeId: eid
      };
    }
  }
};

module.exports = resolvers;
