const faker = require("faker");

function createStocks(number) {
  const stocks = [];
  for (let i = 0; i < number; i++) {
    stocks.push({
      code: String(i),
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(),
      price: faker.finance.amount(),
      createdAt: new Date(faker.date.past(100)).toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  return stocks;
}

function updateStock(stock) {
  stock.price = faker.finance.amount();
  stock.updatedAt = new Date().toISOString();
}

function autoUpdateStocks(stocks, listener) {
  const interval = 1000;
  for (const stock of stocks) {
    setInterval(() => {
      updateStock(stock);
      listener(stock);
    }, interval);
  }
}

module.exports = {
  createStocks,
  autoUpdateStocks
};
