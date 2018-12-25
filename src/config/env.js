module.exports = function envFunction(env) {
  // NOTE: this return value will replace the module in the bundle (val-loader)
  return { code: `module.exports = ${JSON.stringify(env)}` };
};
