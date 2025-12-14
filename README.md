<img width="1366" height="768" alt="Cuplikan layar 2025-12-14 173159" src="https://github.com/user-attachments/assets/409eb523-a006-4e99-b259-bf1b21ac4ada" />
<img width="1366" height="768" alt="Cuplikan layar 2025-12-14 173106" src="https://github.com/user-attachments/assets/6ac4738e-1536-44af-a413-f52955870624" />
<img width="1366" height="768" alt="Cuplikan layar 2025-12-14 173127" src="https://github.com/user-attachments/assets/94cf1910-1fca-481b-95b7-ee82f8115b26" />
🐾 MeowtaFund

A gamified crowdfunding platform on IOTA Blockchain to help stray cats. Users donate IOTA and mint unique, randomized Cat NFTs with funny names and valuations.

📍 Contract Address

Network: IOTA Testnet

Package ID: 0xf9706e190abe57f0b1b5afc407d95111a32e2ffbcff7830db792c3691270235c
Explorer: View on IotaScan

🚀 Getting Started

Follow these steps to run the project locally on your machine.

1. Install Dependencies

npm install --legacy-peer-deps


2. Run Development Server

npm run dev


3. Open App

Open http://localhost:3000 in your browser.

📝 How to Deploy Your Own Contract

If you want to modify the logic (e.g. change Gacha rates or names), follow these steps:

1. Build & Publish

Navigate to the contract folder and deploy to IOTA Testnet:

cd contract/pizza_box
iota move build
iota client publish --gas-budget 100000000


2. Update Configuration

After publishing, you will get a transaction log in your terminal. Copy the new Object IDs and update lib/config.ts:

// Copy from "Published Objects" -> PackageID
export const TESTNET_PACKAGE_ID = "0xYOUR_NEW_PACKAGE_ID"

// Copy from "Created Objects" -> ObjectType ending in ::CharityFund (Owner: Shared)
export const CHARITY_FUND_ID = "0xYOUR_NEW_FUND_ID"

// Copy from "Created Objects" -> ObjectType ending in ::AdminCap (Owner: Your Address)
export const ADMIN_CAP_ID = "0xYOUR_NEW_ADMIN_CAP_ID"


3. Restart Server

Restart your local server (Ctrl+C -> npm run dev) to apply changes.

🌟 Key Features

Gamified Donation: Donate IOTA to get a collectible NFT.

Common (< 10 IOTA): Get a cute Pixel Cat.

Rare (≥ 10 IOTA): Get a majestic Pixel Lion.

On-Chain Randomness:

Funny Names: Generates names like "Sir Whiskers the Lasagna Lover #42".

Dynamic Valuation: Each NFT has a random value range stored on-chain.

Social Proof: Live ticker showing recent donations.

Transparency: Direct links to verify contracts and transactions on IotaScan.

📚 Tech Stack

IOTA Blockchain (Testnet)

Next.js 14 (Frontend)

Move Language (Smart Contract)

[Tailwind CSS](https://tailwindcss.
