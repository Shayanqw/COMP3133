// src/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { ApolloServer } = require("apollo-server-express");

const {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
} = require("apollo-server-core");

const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");

const { connectDB } = require("./config/db");
const { initCloudinary } = require("./config/cloudinary");
const { getUserFromAuthHeader } = require("./config/auth");

async function start() {
  const app = express();

  // CORS (Playground + Postman friendly)
  app.use(
      cors({
        origin: true,
        credentials: true,
      })
  );

  // ✅ Helmet with CSP disabled (CSP breaks GraphQL Playground "Loading..." issue)
  app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      })
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(morgan("dev"));

  app.get("/health", (req, res) => res.json({ status: "ok" }));

  // Init Cloudinary (won't crash unless upload is used and vars are missing)
  initCloudinary();

  const server = new ApolloServer({
    typeDefs,
    resolvers,

    // Required so Playground can introspect schema
    introspection: true,

    // ✅ Force Playground (offline) instead of Sandbox
    plugins: [
      ApolloServerPluginLandingPageDisabled(),
      ApolloServerPluginLandingPageGraphQLPlayground({
        endpoint: "/graphql",
        settings: {
          "request.credentials": "same-origin",
        },
      }),
    ],

    context: ({ req }) => {
      const user = getUserFromAuthHeader(req.headers.authorization);
      return { user };
    },

    formatError: (formattedError) => ({
      message: formattedError.message,
      locations: formattedError.locations,
      path: formattedError.path,
      extensions: formattedError.extensions,
    }),
  });

  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  await connectDB(process.env.MONGO_URI);
  console.log("MongoDB Connected");

  const port = process.env.PORT || 8081;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(
        `GraphQL endpoint: http://localhost:${port}${server.graphqlPath}`
    );
  });
}

start().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});