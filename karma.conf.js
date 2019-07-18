const fs = require("fs");

const fileNames = process.argv
  .filter(arg => arg.startsWith("-f=") || arg.startsWith("--file="))
  .map(arg => arg.split("=")[1]);

// 1 test only
if (fileNames.length !== 1) {
  console.error("Must specify 1 test file name! --file=NAME or -f=NAME");
  process.exit(1);
}

module.exports = config =>
  config.set({
    // logLevel: config.LOG_DEBUG,
    logLevel: config.LOG_WARN,
    protocol: "https",
    httpsServerOptions: {
      key: fs.readFileSync("./certs/key.pem", "utf8"),
      cert: fs.readFileSync("./certs/cert.pem", "utf8")
    },
    singleRun: true,
    reporters: ["mocha"],
    frameworks: ["jasmine"],
    files: fileNames.map(name => ({
      pattern: `__tests__/**/${name}.test.js`,
      watched: false
    })),
    preprocessors: {
      "./__tests__/**/*.test.js": ["rollup"]
    },
    rollupPreprocessor: {
      plugins: [
        require("rollup-plugin-node-builtins")(),
        require("rollup-plugin-json")(),
        require("rollup-plugin-node-resolve")({
          browser: true
        }),
        require("rollup-plugin-commonjs")()
      ],
      output: {
        format: "iife",
        sourcemap: "inline"
      }
    },
    client: {
      jasmine: {
        timeoutInterval: 10000
      }
    }
  });
