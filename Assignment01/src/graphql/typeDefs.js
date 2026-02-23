const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar Date

  type User {
    _id: ID!
    username: String!
    email: String!
    created_at: Date!
    updated_at: Date!
  }

  type Employee {
    _id: ID!
    first_name: String!
    last_name: String!
    email: String!
    gender: String!
    designation: String!
    salary: Float!
    date_of_joining: Date!
    department: String!
    employee_photo: String
    created_at: Date!
    updated_at: Date!
  }

  type AuthPayload {
    success: Boolean!
    message: String!
    token: String
    user: User
  }

  type EmployeePayload {
    success: Boolean!
    message: String!
    employee: Employee
  }

  type EmployeeListPayload {
    success: Boolean!
    message: String!
    employees: [Employee!]!
    count: Int!
  }

  type DeletePayload {
    success: Boolean!
    message: String!
    deletedEmployeeId: ID
  }

  input EmployeeInput {
    first_name: String!
    last_name: String!
    email: String!
    gender: String
    designation: String!
    salary: Float!
    date_of_joining: Date!
    department: String!
    employee_photo: String
  }

  input EmployeeUpdateInput {
    first_name: String
    last_name: String
    email: String
    gender: String
    designation: String
    salary: Float
    date_of_joining: Date
    department: String
    employee_photo: String
  }

  type Query {
    login(usernameOrEmail: String!, password: String!): AuthPayload!

    getAllEmployees: EmployeeListPayload!

    searchEmployeeByEid(eid: ID!): EmployeePayload!

    searchEmployeesByDesignationOrDepartment(designation: String, department: String): EmployeeListPayload!
  }

  type Mutation {
    signup(username: String!, email: String!, password: String!): AuthPayload!

    addEmployee(employee: EmployeeInput!): EmployeePayload!

    updateEmployeeByEid(eid: ID!, updates: EmployeeUpdateInput!): EmployeePayload!

    deleteEmployeeByEid(eid: ID!): DeletePayload!
  }
`;

module.exports = typeDefs;
