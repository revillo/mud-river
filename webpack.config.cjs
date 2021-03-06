const path = require("path");
const dist = path.resolve(__dirname, "build");

module.exports = {


    entry: "./tests/js/game-fps.js",

    optimization : {
        minimize: true
    },
    mode: "production",

    resolve: {
        extensions: [".js"]
    },


    experiments: {
        outputModule: false,
        syncWebAssembly: true
    },

    output: {
        path: dist,
        filename: "game-fps.js"
    }
};
    