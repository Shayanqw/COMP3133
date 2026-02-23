require('dotenv').config();

const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Employee = require('../src/models/Employee');

async function run() {
  await connectDB(process.env.MONGO_URI);

  const demo = {
    username: 'demo_user',
    email: 'demo_user@example.com',
    password: 'Password123!'
  };

  let user = await User.findOne({ $or: [{ username: demo.username }, { email: demo.email }] });
  if (!user) {
    user = await User.create(demo);
    console.log('Created demo user:', { username: demo.username, email: demo.email, password: demo.password });
  } else {
    console.log('Demo user already exists:', { username: user.username, email: user.email });
  }

  const existingEmployees = await Employee.countDocuments();
  if (existingEmployees === 0) {
    await Employee.insertMany([
      {
        first_name: 'Ava',
        last_name: 'Singh',
        email: 'ava.singh@example.com',
        gender: 'Female',
        designation: 'Software Engineer',
        salary: 65000,
        date_of_joining: new Date('2025-09-03'),
        department: 'Engineering',
        employee_photo: ''
      },
      {
        first_name: 'Noah',
        last_name: 'Kim',
        email: 'noah.kim@example.com',
        gender: 'Male',
        designation: 'QA Analyst',
        salary: 52000,
        date_of_joining: new Date('2024-11-15'),
        department: 'Quality Assurance',
        employee_photo: ''
      }
    ]);
    console.log('Inserted 2 demo employees');
  } else {
    console.log('Employees already exist. Skipping employee seeding.');
  }

  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
