# **GoodBuilders Application - ChainDrop**

**DRAFT - Ready for review before submission**

## 1\. Project

### 1.1 Admin

#### Project Name *

ChainDrop

#### Manager Addresses *

[Address 1: 0x... ] ← _Fill in your Celo wallet address_

[Address 2: 0x... ] ← _Optional second manager_

#### Manager Emails *

[Email 1] ← _Fill in your email_

#### Default Funding Address *

[0x... ] ← _Fill in your Celo EOA or Safe address_



### 1.2 Basics

#### Description * _(Markdown supported - 1,000 character minimum, 5,000 maximum)_

**ChainDrop** is a crypto payment platform that lets you send tokens to anyone using just their email address — no wallet required. Recipients claim funds by simply signing in with their email, at which point an embedded wallet is created automatically.

Our core innovation is **Ghost Vaults**: deterministic smart contract addresses derived from a recipient's identity (email, phone, or social handle) using CREATE2. Funds are sent to this pre-computed address immediately, and the recipient deploys and claims whenever they're ready — with gas fees paid from the vault itself.

**How Ghost Vaults work with G$:**
1. Sender types "Send 50 G$ to alice@email.com"
2. ChainDrop computes a Ghost Vault address from alice's email
3. G$ tokens are transferred to this address on Celo
4. Alice receives an email notification with a claim link
5. Alice signs in with her email — an embedded wallet is created via Privy
6. The Ghost Vault deploys, G$ transfers to Alice's wallet, gas is sponsored
7. Alice now has a Celo wallet with G$ — onboarded into the GoodDollar ecosystem

**Key features:**
- **AI-powered payments**: Natural language interface ("Send $5 in G$ to bob@startup.com") powered by Claude AI
- **Gasless claiming**: Paymaster contract sponsors gas so recipients pay nothing
- **USD-first UX**: Users think in dollars; live conversion to G$/CELO shown automatically
- **Programmable agents**: Autonomous payment bots for recurring G$ distributions (payroll, allowances, rewards)
- **Scheduled payments**: Recurring G$ payments on daily/weekly/monthly schedules
- **Non-custodial**: ChainDrop never holds private keys; Privy manages secure embedded wallets

**Built with:** React, Vite, Node.js, Express, Solidity (ERC-4337 Account Abstraction), Privy, ethers.js

ChainDrop removes the #1 barrier to crypto adoption — the wallet requirement — and makes G$ distribution as simple as sending an email. Every Ghost Vault created is a new user onboarded into GoodDollar.

#### Logo *

[File: ____________] ← _Upload 1:1 PNG/JPEG, max 256KB_

#### Banner *

[File: ____________] ← _Upload 3:1 PNG/JPEG, max 1MB_

#### Website *

[https://chaindrop.xyz] ← _Update with actual URL_

#### Demo/Application Link

[https://chaindrop.xyz/demo] ← _Update with actual URL_



### 1.3 Social

#### X/Twitter

[@ChainDropPay] ← _Update with actual handle_

#### Farcaster

[@chaindrop] ← _Update if applicable_

#### Telegram Group

[https://t.me/chaindrop] ← _Update if applicable_

#### Discord Channel

[https://discord.gg/chaindrop] ← _Update if applicable_

#### Karma Profile

[https://karmahq.xyz/project/chaindrop] ← _Create and update_



### 1.4 Technical

#### Github Repositories *

[Repo 1: https://github.com/Jeremicarose/chaindrop-mvp]

#### Smart Contracts

| **Type** | **Network** | **Address** |
| --- | --- | --- |
| Project Address (AccountFactory) | Celo | 0x... ← _Deploy to Celo_ |
| Project Address (Paymaster) | Celo | 0x... ← _Deploy to Celo_ |
| GoodCollective Pool | Celo | 0x... ← _Create after approval_ |

### 1.5 Additional

#### Other Links

| **Description** | **URL** |
| --- | --- |
| Comprehensive Project Overview | https://github.com/Jeremicarose/chaindrop-mvp/blob/main/CHAINDROP_COMPREHENSIVE.md |
| Architecture Documentation | https://github.com/Jeremicarose/chaindrop-mvp/blob/main/docs/ARCHITECTURE.md |
| Smart Contract Documentation | https://github.com/Jeremicarose/chaindrop-mvp/blob/main/docs/CONTRACTS.md |

## 2\. Round

### 2.1 Previous Participation

#### Have you participated in GoodBuilders before? *

- No

### 2.2 Maturity & Usage

#### Project Stage *

- Early stage

#### Lifetime Users *

0

_ChainDrop has a working MVP deployed on Cronos Testnet with full smart contract infrastructure (EntryPoint, AccountFactory, Paymaster, ClaimVerifier). We are expanding to Celo for G$ integration._

#### Active Users *

0

#### Active Users Frequency *

- Monthly Active Users

#### Other relevant usage data (if available)

- 4 smart contracts deployed and tested on Cronos Testnet
- Full frontend application (React + Vite) with AI chat, send/claim flows, and agent management
- Working ERC-4337 Account Abstraction infrastructure
- AI-powered natural language payment parsing operational
- Embedded wallet integration via Privy functional



### 2.3 Integration

#### G$ Integration Status *

- Planned

#### Integration Type * _(Select all that apply)_

- ✅ Payments/rewards using G$
- ✅ Claim flow
- ✅ GoodCollective pools
- ✅ G$ Supertoken/streaming
- Other: Ghost Vaults — deterministic pre-wallet addresses for G$ distribution to non-crypto users

#### Describe your G$ integration & why it matters * _(1-3 sentences)_

ChainDrop enables G$ distribution to anyone via email — recipients don't need a wallet. Ghost Vaults hold G$ at deterministic addresses derived from email/phone identities, and recipients claim by simply signing in, creating a new GoodDollar wallet holder with zero friction. This turns every G$ payment into a new user onboarded into the GoodDollar ecosystem.



### 2.4 What You'll Build

#### Primary Build Goal * _(1 sentence)_

Deploy ChainDrop's Ghost Vault infrastructure on Celo with native G$ token support, enabling walletless G$ distribution via email that onboards new users into the GoodDollar ecosystem.

#### Build Milestone 1 *

**Title ***

Ghost Vaults Live on Celo with G$ Support

**Description * (500 character minimum, 5,000 maximum)**

Deploy ChainDrop's core smart contract infrastructure on Celo mainnet with native G$ token integration. This milestone represents the foundational technical work required to enable walletless G$ distribution.

**What we'll build:**

1. **Celo Smart Contract Deployment**: Port and deploy all four core contracts (AccountFactory, SimpleAccount, ChainDropPaymaster, ClaimVerifier) to Celo mainnet. The contracts already support ERC-20 tokens, so G$ integration requires configuring the G$ token address and testing the full claim flow with G$ transfers.

2. **G$ Token Integration in Frontend**: Update the send/claim UI to support G$ as a payment token alongside native CELO. Add G$ balance display, G$ amount input with USD conversion using GoodDollar's price feed, and G$ selection in the token picker. The USD-first UX will show live G$ conversion ("$5 = ~X G$").

3. **Ghost Vault G$ Claim Flow**: Implement the complete claim flow for G$ tokens held in Ghost Vaults. When a recipient clicks their claim link and signs in with email, the system deploys the Ghost Vault contract, transfers G$ to their new embedded wallet, with gas sponsored by the Paymaster. The recipient goes from zero crypto knowledge to holding G$ in under 30 seconds.

4. **AI Chat G$ Support**: Update the AI intent parser to understand G$ commands: "Send 100 G$ to alice@email.com" or "Pay $5 in GoodDollars to bob@startup.com". The AI will handle G$/USD conversion and route payments through Ghost Vaults on Celo.

**Target KPIs:**
- 4 smart contracts deployed on Celo mainnet
- G$ send and claim flow working end-to-end
- AI chat supporting G$ payment commands
- Average claim time under 60 seconds
- Gas cost per claim under $0.01 (Celo's low fees)

**Deliverables ***

Deliverable 1: All 4 ChainDrop contracts deployed on Celo mainnet with verified source code

Deliverable 2: Frontend updated with G$ token support (send, claim, balance display, USD conversion)

Deliverable 3: End-to-end demo video: sending G$ via email and recipient claiming with zero setup

#### Build Milestone 2 _(Optional)_

**Title**

G$ Streaming Payments & GoodCollective Pool

**Description (500 character minimum, 5,000 maximum)**

Integrate Superfluid streaming for continuous G$ distribution and create a GoodCollective pool for community-funded Ghost Vault distributions.

**What we'll build:**

1. **Superfluid G$ Streaming**: Integrate Superfluid's Super Token framework to enable continuous G$ streaming to Ghost Vaults. Use cases include: streaming G$ allowances to family members who don't have wallets yet, continuous contributor payments for DAOs, and drip-funding community reward pools. The sender sets up a stream ("Stream 10 G$/day to alice@email.com"), and G$ accumulates in Alice's Ghost Vault until she claims.

2. **GoodCollective Pool Integration**: Create a ChainDrop GoodCollective pool where community members can fund Ghost Vault distributions. The pool collects G$ contributions and distributes them to specified email recipients via Ghost Vaults. This enables community-funded UBI distribution, bounty programs, and collective giving — all to recipients who don't need wallets.

3. **Scheduled G$ Payments**: Extend the existing scheduled payments feature to support G$ on Celo. Users can set up recurring G$ payments ("Send 50 G$ to team@dao.com every Monday") that automatically execute through Ghost Vaults. This serves DAO contributor payments, allowance distributions, and automated reward systems.

**Target KPIs:**
- Superfluid G$ streaming functional with Ghost Vaults
- 1 GoodCollective pool created and funded
- Scheduled G$ payments executing reliably
- 5+ active G$ streams during the round

**Deliverables**

Deliverable 1: Superfluid integration enabling G$ streaming to Ghost Vault addresses

Deliverable 2: GoodCollective pool created with funding and distribution mechanism through Ghost Vaults

#### Ecosystem Impact (4,000 character maximum)

ChainDrop's Ghost Vault infrastructure solves the biggest barrier to G$ adoption: **recipients need a wallet before they can receive G$**. This chicken-and-egg problem means G$ distribution is limited to people already in crypto — exactly the opposite of UBI's mission to reach everyone.

**How ChainDrop changes this for GoodDollar:**

1. **Every G$ payment = a new wallet holder.** When someone sends G$ through ChainDrop to an email address, the recipient gets onboarded into the GoodDollar ecosystem the moment they claim. No app downloads, no seed phrases, no prior crypto knowledge. They click a link, sign in with email, and they're a G$ holder. This is the most frictionless path from "never heard of crypto" to "holding G$."

2. **Ghost Vaults enable pre-wallet UBI distribution.** Organizations, DAOs, and communities can distribute G$ to lists of email addresses — employees, students, community members — without requiring any of them to set up wallets first. The G$ sits securely in Ghost Vaults until recipients are ready to claim, whether that's minutes or months later.

3. **AI makes G$ accessible to non-technical users.** ChainDrop's natural language interface means sending G$ is as simple as typing "Send 50 G$ to alice@email.com for groceries." No need to understand token addresses, gas fees, or blockchain transactions. This dramatically lowers the barrier for organizations wanting to distribute G$.

4. **Streaming G$ creates ongoing engagement.** With Superfluid integration, G$ streams continuously to Ghost Vaults, giving recipients a reason to return regularly and engage with the GoodDollar ecosystem. A parent streaming G$ allowance to their child creates a recurring touchpoint with G$.

5. **GoodCollective pools enable community-funded G$ distribution.** Communities can pool G$ and collectively distribute it to non-crypto-native recipients via email. This aligns perfectly with GoodDollar's mission of community-driven UBI.

6. **Activity fees flow back to UBI.** Every Ghost Vault deployment and claim generates transaction activity on Celo. By routing activity fees to the GoodDollar UBI pool, ChainDrop creates a virtuous cycle: more Ghost Vaults → more activity → more UBI funding → more G$ to distribute.

ChainDrop doesn't just integrate G$ — it creates a new distribution channel that reaches people who can't be reached by existing crypto tools. Every Ghost Vault is a bridge between the crypto and non-crypto worlds, and G$ is the perfect token to cross that bridge because UBI should be for everyone, not just wallet holders.



### 2.5 How You'll Grow

#### Primary Growth Goal * _(1 sentence)_

Onboard 200+ new GoodDollar wallet holders by distributing G$ through Ghost Vaults to non-crypto-native users across African tech communities and DAO contributor networks.

#### Target Users, Communities, and/or Partners *

1. **African Tech Communities**: Developers, freelancers, and students in Nigeria, Kenya, and South Africa who are active online but not yet in crypto. They have email addresses and smartphones but no crypto wallets. G$ distributed via Ghost Vaults gives them a reason to onboard.

2. **DAO Contributors**: Open-source contributors, bounty hunters, and community moderators who do work for DAOs but haven't set up crypto wallets yet. Their DAOs can pay them in G$ via email.

3. **GoodDollar Existing Community**: Current G$ holders who want to share G$ with friends and family who aren't in crypto yet. ChainDrop gives them a tool to send G$ to anyone via email.

4. **Micro-task & Gig Platforms**: Platforms that want to pay workers in G$ but face the wallet onboarding friction. ChainDrop's API enables programmatic G$ distribution to email addresses.

#### Growth Milestone 1 *

**Title ***

First 100 Ghost Vaults Created & Claimed on Celo

**Description * (500 character minimum, 5,000 maximum)**

Achieve 100 Ghost Vaults created on Celo with G$ deposits, with at least 50% claimed by recipients, resulting in 50+ new GoodDollar wallet holders. This milestone validates that Ghost Vaults effectively onboard non-crypto users into the GoodDollar ecosystem.

**How we'll get there:**

1. **Community Onboarding Campaign**: Partner with 2-3 African tech communities (e.g., Web3 Lagos, Nairobi Blockchain, Cape Town Crypto) to run "Send G$ to a Friend" campaigns. Each community leader sends G$ to 20-30 members who don't have wallets. We provide the G$ from GoodDollar incentives and track claim rates.

2. **DAO Bounty Distribution Pilot**: Partner with 1-2 DAOs to distribute contributor bounties in G$ via ChainDrop. Contributors receive email notifications and claim their G$ rewards, onboarding them into GoodDollar.

3. **Referral Loop**: Each new G$ holder who claims through a Ghost Vault gets a prompt to "Send G$ to someone you know." This creates organic growth as newly onboarded users send G$ to their own contacts.

4. **Content & Education**: Create tutorial content showing how easy it is to send and claim G$ via email. Share across Twitter, Farcaster, and Telegram communities focused on GoodDollar and Celo.

**Target KPIs:**
- 100+ Ghost Vaults created with G$ deposits
- 50%+ claim rate (50+ new wallets)
- Average claim time under 2 minutes
- 20%+ of new claimants send G$ to someone else (referral loop)
- 3+ community partnerships activated

**Activations ***

Activation 1: Partner with Web3 Lagos and 2 other African tech communities for "Send G$ to a Friend" campaigns

Activation 2: Launch DAO bounty distribution pilot with 1-2 DAOs paying contributors in G$ via email

Activation 3: Deploy referral loop prompting new G$ claimants to send G$ to their contacts

#### Growth Milestone 2 _(Optional)_

**Title**

Scale to 200+ New Wallet Holders with Streaming G$

**Description (500 character minimum, 5,000 maximum)**

Scale Ghost Vault usage to 200+ new GoodDollar wallet holders by introducing G$ streaming and expanding community partnerships. This milestone proves ChainDrop can be a sustainable growth channel for the GoodDollar ecosystem.

**Expansion strategy:**

1. **G$ Streaming for Ongoing Engagement**: Launch Superfluid G$ streams to Ghost Vaults, enabling continuous G$ distribution. This creates recurring engagement — recipients return to claim accumulated G$ regularly, increasing retention.

2. **Expanded Community Partnerships**: Grow from 3 to 6+ community partnerships across Africa and Southeast Asia. Each community runs its own G$ distribution campaign using ChainDrop's tools.

3. **GoodCollective-Funded Distributions**: Launch the ChainDrop GoodCollective pool where community members fund Ghost Vault distributions. This creates community-owned growth that doesn't depend on a single funding source.

4. **API for Platforms**: Release ChainDrop's API so other platforms can distribute G$ to email addresses programmatically. Target micro-task platforms and community management tools.

**Target KPIs:**
- 200+ cumulative new GoodDollar wallet holders
- 10+ active G$ streams
- 6+ community partnerships
- 1 GoodCollective pool with $500+ in G$
- 30%+ monthly retention of new G$ holders

**Activations**

Activation 1: Launch G$ streaming feature and onboard 5+ users to stream G$ to contacts

Activation 2: Expand to 6+ community partnerships across Africa and Southeast Asia

#### Ecosystem Impact (4,000 character maximum)

ChainDrop's growth directly translates to GoodDollar ecosystem growth in measurable ways:

**1. New Wallet Holders at Scale**
Every Ghost Vault claimed = one new person holding G$ for the first time. Our target of 200+ new wallet holders represents 200+ people who went from zero crypto exposure to active G$ holders. These aren't people who would have found GoodDollar on their own — they're people reached through email by friends, colleagues, and community leaders. This is net-new growth for the ecosystem.

**2. Network Effects Through Referral Loops**
When Alice claims G$ from a Ghost Vault, she's prompted to send G$ to someone she knows. If 20% of new holders do this, each wave of onboarding seeds the next wave. 200 new holders → 40 send to friends → 20+ more new holders → and so on. ChainDrop turns G$ recipients into G$ distributors.

**3. Geographic Expansion**
By targeting African tech communities (Nigeria, Kenya, South Africa) and Southeast Asia, ChainDrop brings GoodDollar to regions where UBI has the most impact. These are populations with high smartphone penetration, active online communities, and significant need for accessible financial tools. Ghost Vaults remove the technical barrier that has limited G$ adoption in these regions.

**4. Organizational G$ Adoption**
When a DAO uses ChainDrop to pay contributors in G$, it doesn't just onboard individuals — it establishes G$ as a payment token within that organization. This creates institutional demand for G$ and habitual usage patterns that persist beyond any single campaign.

**5. Streaming Creates Retention**
One-time airdrops have poor retention. But G$ streams to Ghost Vaults create ongoing engagement — recipients return to claim their accumulated G$ regularly. A parent streaming G$ allowance to their child creates weekly engagement with GoodDollar. A DAO streaming contributor payments creates monthly engagement. This transforms G$ from a one-time discovery into an ongoing relationship.

**6. Activity Feeds UBI**
Every Ghost Vault creation, G$ transfer, and claim generates transaction activity on Celo. With activity fees routed to the UBI pool, ChainDrop's growth directly increases the UBI pool's funding. More users → more transactions → more UBI funding → more G$ available → more users. This creates a self-reinforcing growth cycle for the entire GoodDollar ecosystem.

**7. Infrastructure for Future Growth**
Ghost Vaults are reusable infrastructure. Once deployed on Celo for G$, any project in the GoodDollar ecosystem can use ChainDrop's API to distribute G$ to email addresses. This turns ChainDrop into shared infrastructure that multiplies the impact of every future GoodDollar initiative.

Our growth isn't just about ChainDrop's metrics — it's about building a new distribution channel that makes G$ accessible to anyone with an email address. That's the growth that matters for universal basic income.



### 2.6 Team

#### Primary Contact *

| **Field** | **Value** |
| --- | --- |
| **Name** * | ← _Fill in your name_ |
| **Role & Description** * | Founder & Full-Stack Developer — Built ChainDrop's smart contracts, frontend, backend, and AI integration. Experience in Solidity, React, Node.js, and ERC-4337 Account Abstraction. |
| **Telegram** | ← _Fill in_ |
| **Github/LinkedIn Profile** | https://github.com/Jeremicarose |

#### Additional Team Members _(Optional)_

← _Add team members if applicable_

### 2.7 Additional

#### Additional Comments

ChainDrop was originally built for the Cronos x402 Hackathon (Agentic Finance track) and has a fully working MVP with 4 deployed smart contracts, AI-powered payments, and embedded wallet integration. The core Ghost Vault architecture is chain-agnostic — our Solidity contracts work on any EVM chain, making Celo deployment straightforward.

We're applying to GoodBuilders because Ghost Vaults are the perfect distribution mechanism for G$. UBI should reach everyone, especially people who don't have crypto wallets. ChainDrop makes that possible by turning an email address into a G$ receiving address.

We're committed to open-sourcing our Celo deployment so other GoodDollar projects can leverage Ghost Vault infrastructure for their own G$ distribution needs.



## 3\. Attestation

### 3.1 Commitment

#### Agree to Commitments *

- ✅ I agree to all commitments listed above

### 3.2 Identity & KYC

#### Recipient Type *

- Individual

#### Legal Name / Company Name *

← _Fill in your legal name_

#### Country of Residence / Registration *

← _Fill in your country_

#### Address *

← _Fill in your address_

#### Contact Email *

← _Fill in your email_

#### Wallet to Receive Funding *

← _Fill in your Celo wallet address: 0x..._

#### Confirm Wallet Ownership *

- ✅ I confirm the wallet belongs to the named individual or organization.

### 3.3 Data Acknowledgement

#### GDPR Consent *

- ✅ I consent to the collection and use of my data for the purposes of participating in the GoodBuilders Round 3 and receiving a grant via the Flow State platform.

- ✅ I also agree to be contacted by the GoodDollar team with relevant updates.
