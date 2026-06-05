import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "wealth-sync", 
  name: "WealthSync",
  // 👇 ATTACH THE SIGNING KEY TO THE CLIENT INITIALIZATION LAYER DIRECTLY
  signingKey: process.env.INNGEST_SIGNING_KEY, 
});
