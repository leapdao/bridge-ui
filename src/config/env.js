module.exports = function envFunction(env) {
  const isSet = !!Object.values(env).filter(v => !!v).length;
  // NOTE: this return value will replace the module in the bundle (val-loader)
  return { code: `module.exports = ${isSet ? JSON.stringify(env) : null}` };
};
