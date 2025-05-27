# Contributing
## Dev Environment Setup
We use node.js for developer tooling. Install node [here](https://nodejs.org/en).

Clone or symlink your fork of this repository into your foundry modules folder. We recommend using a seperate foundry environment from the foundry instance you use for running live games.

Run the following command to install development dependencies:
```
npm clean-insall
```

To build the module once, run the following:
```
npm run inject-shaders && tsc
```

For a continuous build, run the following command:
```
gulp
```
This will initiate both a watch of all typescript files that will cause them to be recompiled upon changes, as well as open an instance of BrowserSync that will proxy your local port 30001 (the default foundry port), giving you a browser tab that will load your foundry page and will refresh any time the module is recompiled (saving you a lot of hitting F5).

## Pull Requests
We currently don't have any special requirements for pull requests, beyond basic etiquette!
