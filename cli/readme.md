To use the cli, please run `npm install` and `npm run build`. Once the cli has been built, you will be able to run it by using node. The command is `node ./dist/index.js`. 

This cli has two modes, command mode and file mode. For command mode, you run the program as such: `node ./dist/injex.js run <command>`.

If you would to load a file instead, use `node ./dist/injex.js load-file <file-path>` where `<file-path>` is either a full directory path or is relative to the dist directory (if it is not relative to the dist directory, it will not find the file correctly).