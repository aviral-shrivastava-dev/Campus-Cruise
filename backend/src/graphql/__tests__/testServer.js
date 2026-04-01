const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('../typeDefs');
const resolvers = require('../resolvers');
const context = require('../context');

let apolloServer;
let app;

const initializeTestServer = async () => {
  if (app) {
    return app;
  }

  app = express();
  app.use(express.json());

  apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context,
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return error;
    }
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/graphql' });

  return app;
};

const closeTestServer = async () => {
  if (apolloServer) {
    await apolloServer.stop();
    apolloServer = null;
    app = null;
  }
};

module.exports = {
  initializeTestServer,
  closeTestServer
};
