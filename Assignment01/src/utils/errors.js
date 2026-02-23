const { GraphQLError } = require('graphql');

function badUserInput(message, details = null) {
  return new GraphQLError(message, {
    extensions: {
      code: 'BAD_USER_INPUT',
      details
    }
  });
}

function unauthenticated(message = 'Authentication required.') {
  return new GraphQLError(message, {
    extensions: {
      code: 'UNAUTHENTICATED'
    }
  });
}

function notFound(message = 'Not found.') {
  return new GraphQLError(message, {
    extensions: {
      code: 'NOT_FOUND'
    }
  });
}

function conflict(message = 'Conflict.') {
  return new GraphQLError(message, {
    extensions: {
      code: 'CONFLICT'
    }
  });
}

function internalError(message = 'Internal server error.') {
  return new GraphQLError(message, {
    extensions: {
      code: 'INTERNAL_SERVER_ERROR'
    }
  });
}

module.exports = { badUserInput, unauthenticated, notFound, conflict, internalError };
