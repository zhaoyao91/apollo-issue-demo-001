const { ApolloServer, gql, PubSub, withFilter } = require("apollo-server");
const runMain = require("@bucuo/run-main");
const { logger } = require("@bucuo/json-logger");

const { createStocks, autoUpdateStocks } = require("./mock_stock");

const PORT = process.env.PORT || 3000;
const STOCK_UPDATED = "STOCK_UPDATED";

const typeDefs = gql`
  type Query {
    stock(code: ID!): Stock
  }

  type Subscription {
    stockUpdated(code: ID!): Stock
  }

  type Stock {
    code: ID!
    name: String
    description: String
    price: String
    createdAt: String
    updatedAt: String
  }
`;

const resolvers = {
  Query: {
    stock(root, { code }, { stocks }) {
      return stocks.find(stock => stock.code === code);
    }
  },

  Subscription: {
    stockUpdated: {
      subscribe: withFilter(
        (root, args, { pubsub }) => pubsub.asyncIterator(STOCK_UPDATED),
        (payload, args) => payload.code === args.code
      ),
      // 可能是个 bug
      // 按理，payload 不需要转换时可以不定义这个函数，但是不定时返回数据为 null
      resolve: payload => payload
    }
  }
};

async function main() {
  const pubsub = new PubSub();
  const stocks = createStocks(10000);

  // standalone ApolloServer 自带基于 websocket 的 subscription 能力，很好
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: () => {
      return {
        pubsub,
        stocks
      };
    },
    subscriptions: {
      path: "/subscriptions"
    },
    cors: true
  });

  autoUpdateStocks(stocks, stock => {
    pubsub.publish(STOCK_UPDATED, stock).catch(logger.error);
  });

  const { url, subscriptionsPath } = await apolloServer.listen(PORT);

  logger.info("Server started", { url, subscriptionsPath });
}

runMain(main, { logError: logger.error });
