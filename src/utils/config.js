module.exports = function configFunction(config) {
  // NOTE: this return value will replace the module in the bundle (val-loader)
  return { code: `module.exports = ${JSON.stringify(config)}` };
};
