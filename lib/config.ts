import { getFullnodeUrl } from "@iota/iota-sdk/client"
import { createNetworkConfig } from "@iota/dapp-kit"

// ============================================================================
// ⚠️ ID DARI LOG TRANSAKSI (Digest: DN5y...Jkev)
// ============================================================================

// Package ID (Dari log: Published Objects)
export const TESTNET_PACKAGE_ID = "0xf9706e190abe57f0b1b5afc407d95111a32e2ffbcff7830db792c3691270235c"

// Charity Fund ID (Dari log: Created Objects -> Owner: Shared)
export const CHARITY_FUND_ID = "0x3df62b6a415e4668ef5b35a71e78c4c75a08a1cc40f6da4453a56a60e3f32a71"

// Admin Cap ID (Dari log: Created Objects -> Owner: Address Kamu)
export const ADMIN_CAP_ID = "0xab4b00500fdabae88ff66e9f33f91b3ece7368918372d34951ee8bdd9f01942c"

export const MAINNET_PACKAGE_ID = "" 

// Network configuration
const { networkConfig, useNetworkVariable, useNetworkVariables } = createNetworkConfig({
  devnet: {
    url: getFullnodeUrl("devnet"),
    variables: {
      packageId: TESTNET_PACKAGE_ID,
      fundId: CHARITY_FUND_ID,
      adminCapId: ADMIN_CAP_ID,
    },
  },
  testnet: {
    url: getFullnodeUrl("testnet"),
    variables: {
      packageId: TESTNET_PACKAGE_ID,
      fundId: CHARITY_FUND_ID,
      adminCapId: ADMIN_CAP_ID,
    },
  },
  mainnet: {
    url: getFullnodeUrl("mainnet"),
    variables: {
      packageId: MAINNET_PACKAGE_ID,
      fundId: "", 
      adminCapId: "",
    },
  },
})

export { useNetworkVariable, useNetworkVariables, networkConfig }