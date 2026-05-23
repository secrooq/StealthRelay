# Security Policy: StealthRelay Platform

## Defensive Philosophy
StealthRelay is a non-custodial, zero-trust orchestration platform. The threat model assumes that our entire back-end server architecture, database records, and edge compute workers are fully compromised. Under this assumption, stored user data MUST remain mathematically unreadable.

### Primary Directives
1.  **Passphrase Non-Ingestion**: Master passphrases MUST NEVER leave the client runtime.
2.  **Zero Retentional Artifacts**: Transient email processing nodes MUST exist purely in ephemeral RAM.
3.  **Automatic Entropy**: Every transaction generated MUST derive unique vectors (IVs) for encryption buffers.

## Supported Versions
The only supported version is the current production `HEAD` deployed to the edge. Older versions are immediately decommissioned.

## Reporting a Vulnerability
If you identify a structural cryptographic defect or operational exfiltration channel, transmit an encrypted brief immediately to the command inbox.

**Channel:** [info@stealthrelay.com](mailto:info@stealthrelay.com)

Please include:
- Forensic proof-of-concept.
- Narrative of the vector.
- Potential blast radius estimation.

Do NOT publish findings publicly until we acknowledge receipt and initialize a tactical rotation.

## Incident Retention
As specified in our manifest, persistent liability buffers are cleared every 14 days of total latency. System auditors acknowledge that historic datasets will NOT exist for long-term analysis.
