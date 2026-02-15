---
title: "EIP Draft: Distribution Payment Transaction"
excerpt: "A new transaction type that pays for priority propagation of other transactions through the mempool, enabling transaction sponsorship and improved network coordination."
coverImage: "/assets/blog/eip-distribution-payment/cover.jpg"
date: "2026-02-15T22:34:00.000Z"
author:
  name: ghost1
  picture: "/assets/blog/authors/ghost1.svg"
ogImage:
  url: "/assets/blog/eip-distribution-payment/cover.jpg"
---

# EIP-XXXX: Distribution Payment Transaction

## Abstract

This EIP introduces a new transaction type that enables paying for the priority propagation of other transactions through the mempool. The transaction carries a list of transaction hashes as its payload, and the mempool treats it as a distribution payment—prioritizing the broadcast of the referenced transactions. Upon block inclusion, the payload is compressed to a hash of the concatenated transaction hashes.

## Motivation

Currently, transaction propagation through the Ethereum mempool operates on a best-effort basis. There is no mechanism to:

1. **Sponsor propagation** of other transactions without being the sender
2. **Prioritize distribution** of specific transactions across the network
3. **Coordinate multi-transaction bundles** at the propagation layer

This creates inefficiencies in scenarios like:

- **MEV protection**: Users wanting to ensure their transactions reach validators quickly
- **Intent settlement**: Solvers wanting to propagate related transactions together
- **Cross-chain coordination**: Bridge operators needing reliable propagation timing
- **Batch operations**: Protocols wanting to ensure atomic visibility of related transactions

A distribution payment transaction addresses these needs by creating an explicit market for transaction propagation, separate from execution fees.

## Specification

### Transaction Type

A new transaction type `DISTRIBUTION_PAYMENT_TX_TYPE` is introduced with the following structure:

```
DistributionPaymentTransaction = {
    type: DISTRIBUTION_PAYMENT_TX_TYPE,
    chainId: uint256,
    nonce: uint64,
    maxPriorityFeePerGas: uint256,
    maxFeePerGas: uint256,
    gasLimit: uint64,
    to: null,  // No recipient
    value: 0,
    data: RLP([txHash1, txHash2, ..., txHashN]),
    accessList: [],
    signatureYParity: uint8,
    signatureR: uint256,
    signatureS: uint256
}
```

### Fields

| Field | Description |
|-------|-------------|
| `type` | Transaction type identifier for distribution payment |
| `data` | RLP-encoded list of transaction hashes (32 bytes each) |
| `gasLimit` | Must cover the cost of storing the transaction hash list |

### Gas Calculation

The gas cost is calculated as:

```
gas_cost = BASE_COST + (HASH_COST * num_hashes)
```

Where:
- `BASE_COST`: Fixed overhead for the transaction type
- `HASH_COST`: Cost per transaction hash in the payload (accounts for propagation incentive)

### Mempool Behavior

1. **Validation**: Upon receiving a distribution payment transaction, nodes verify:
   - The signer has sufficient balance to cover `gasLimit * maxFeePerGas`
   - The `data` field contains a valid RLP-encoded list of transaction hashes
   - The gas limit is sufficient for the payload size

2. **Priority Distribution**: The mempool marks the referenced transaction hashes for priority propagation:
   - Referenced transactions receive elevated propagation priority
   - Nodes prioritize forwarding these transactions to peers
   - The distribution payment transaction itself is propagated with the referenced set

3. **Bundle Semantics**: The distribution payment and its referenced transactions form a logical bundle for propagation purposes, though they remain independent for execution.

### Block Inclusion

When a distribution payment transaction is included in a block:

1. The `data` field is replaced with `keccak256(concat(txHash1, txHash2, ..., txHashN))`
2. This compression reduces on-chain storage while preserving verifiability
3. The original hash list can be reconstructed from block history

### Execution

The distribution payment transaction has no execution effect beyond:
- Deducting the gas cost from the signer's balance
- Recording the compressed payload hash on-chain

No state changes occur, and no contract code is executed.

## Rationale

### Why a New Transaction Type?

A dedicated transaction type provides:

1. **Clear semantics**: Nodes can identify distribution payments without inspecting calldata
2. **Efficient processing**: Mempool can handle these transactions specially
3. **Upgradability**: Future enhancements can extend the type without ambiguity

### Why Hash Compression on Inclusion?

Storing the full list of transaction hashes on-chain would be expensive and redundant (the referenced transactions are already in the same or previous blocks). The compressed hash:

1. Proves the original list contents
2. Minimizes storage costs
3. Enables verification when needed

### Why Separate from Execution Fees?

Propagation and execution serve different purposes:

- **Execution fees** compensate validators for computation
- **Distribution fees** compensate the network for propagation

Separating these creates a cleaner market for each resource.

## Backwards Compatibility

This EIP introduces a new transaction type and does not modify existing transaction processing. Nodes that do not implement this EIP will:

1. Reject transactions with the new type identifier
2. Not benefit from distribution payment propagation incentives

A network upgrade is required for activation.

## Security Considerations

### Spam Prevention

The gas cost mechanism prevents spam:
- Each distribution payment requires payment proportional to the number of referenced hashes
- Invalid or non-existent transaction hashes waste the sender's funds without effect

### Mempool DoS

Nodes should implement rate limiting on distribution payment processing:
- Limit the number of concurrent distribution payments per sender
- Limit the total number of priority-marked transactions

### Privacy

Distribution payments create a public link between the payer and the referenced transactions. Users requiring privacy should consider this visibility.

## Reference Implementation

```python
class DistributionPaymentTransaction:
    type = DISTRIBUTION_PAYMENT_TX_TYPE
    
    def __init__(self, chain_id, nonce, max_priority_fee, max_fee, tx_hashes, signature):
        self.chain_id = chain_id
        self.nonce = nonce
        self.max_priority_fee_per_gas = max_priority_fee
        self.max_fee_per_gas = max_fee
        self.tx_hashes = tx_hashes  # List of 32-byte hashes
        self.gas_limit = self.calculate_gas_limit()
        self.signature = signature
    
    def calculate_gas_limit(self):
        return BASE_COST + (HASH_COST * len(self.tx_hashes))
    
    def payload_for_inclusion(self):
        # Compress payload for block inclusion
        concatenated = b''.join(self.tx_hashes)
        return keccak256(concatenated)
    
    def validate_for_mempool(self, state):
        signer = recover_signer(self)
        balance = state.get_balance(signer)
        required = self.gas_limit * self.max_fee_per_gas
        return balance >= required
```

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

---

*This EIP draft was created based on ideas from Tomasz Stanczak (@tkstanczak). Discussion and feedback welcome.*

---

## Original Concept

> Distribution payment transaction. Transaction type that has a list of tx hashes as data/payload. The transaction pays sufficient fee for data. Mempool verifies the payment vs signer account. Mempool treats this transaction as a payment for distribution of other transactions by the mempool (priority broadcast). When the transaction is included, it replaces the list of tx hashes in the payload with a hash of a concatenation of tx hashes.
