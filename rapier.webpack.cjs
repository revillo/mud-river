
const path = require("path");
const dist = path.resolve(__dirname, "lib/rapier");

module.exports = {


    entry: "./lib/export_rapier.js",

    optimization : {
        minimize: true
    },

    resolve: {
        extensions: [".js", ".wasm"]
    },

    mode: "production",

    experiments: {
        outputModule: false,
        syncWebAssembly: true
    },

    output: {
        path: dist,
        filename: "rapier.js"
    }
};
    