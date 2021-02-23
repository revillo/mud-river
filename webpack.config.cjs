
const path = require("path");
const dist = path.resolve(__dirname, "build");

module.exports = {


    entry: "./src/client-main.js",

    optimization : {
        minimize: false
    },

    resolve: {
        extensions: [".js"]
    },

    mode: "production",

    experiments: {
        outputModule: false,
        syncWebAssembly: true
    },

    output: {
        path: dist,
        filename: "client-main.js"
    }
};
    