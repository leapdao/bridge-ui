console.log(process.env);

if (!process.env.BRIDGE_ADDR) {
  console.error(
    'Missing Bridge contract address. Please rebuild with BRIDGE_ADDR env variable set'
  );
}
if (!process.env.TOKEN_ADDR) {
  console.error(
    'Missing token contract address. Please rebuild with TOKEN_ADDR env variable set'
  );
}
export const bridgeAddress = process.env.BRIDGE_ADDR;
export const tokenAddress = process.env.TOKEN_ADDR;
