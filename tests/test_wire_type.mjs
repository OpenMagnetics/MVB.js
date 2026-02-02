import { WireType, WireDescription } from "../src/types.js";

console.log("Test 1 - using wireType:");
const w1 = new WireDescription({ wireType: WireType.RECTANGULAR });
console.log("  wireType:", w1.wireType);
console.log("  type:", w1.type);

console.log("\nTest 2 - using type:");
const w2 = new WireDescription({ type: WireType.RECTANGULAR });
console.log("  wireType:", w2.wireType);
console.log("  type:", w2.type);
