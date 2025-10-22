module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",    // Localhost
      port: 7545,           // Ganache GUI default port
      network_id: "*",      // Match any network id
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.21",     // Solidity version to match your contracts
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },

  mocha: {
    // timeout: 100000
  }
};
