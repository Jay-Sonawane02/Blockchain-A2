module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",    // Localhost
      port: 7545,           // Ganache GUI default port
      network_id: "5777",      // Match any network id
      gas: 8000000,
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
        },
        // 💡 FIX: The 'viaIR' flag must be inside the 'settings' object.
        viaIR: true,
        evmVersion: "london"
      }
    }
  },

  mocha: {
    // timeout: 100000
  }
};