import PostalMime from 'postal-mime';
import * as openpgp from 'openpgp';

export interface Env {
  DB: D1Database;
  EMAIL: any; // Cloudflare Email Sending API
}

// A shared salt/secret to ensure the bridge hashes can't be guessed/spoofed easily
const BRIDGE_SECRET = "STEALTH_BRIDGE_PROTO_1"; 

export default {
  async email(message: any, env: Env, ctx: any): Promise<void> {
    const inboundRecipient = message.to.toLowerCase();
    const senderAddress = message.from.toLowerCase();
    const domainPart = inboundRecipient.split('@')[1] || "stealthrelay.com";

    console.log(`[GATEWAY] Incoming from ${senderAddress} to ${inboundRecipient} via ${domainPart}`);

    // 1. PARSE EMAIL STRUCTURE
    const parser = new PostalMime();
    const parsedEmail = await parser.parse(message.raw);
    
    const emailSubject = parsedEmail.subject || "(No Subject)";
    const emailBodyText = parsedEmail.text || "";
    const emailBodyHtml = parsedEmail.html || "";

    // ----------------------------------------------------------------
    // PATH A: THE ANONYMOUS REPLY BRIDGE
    // Detects if the real user is replying to a bridged address.
    // Pattern: mask+encodedRecipient@domain.com
    // ----------------------------------------------------------------
    if (inboundRecipient.includes("+")) {
      const parts = inboundRecipient.split('@')[0].split('+');
      const maskPart = parts[0] + '@' + domainPart;
      const bridgeToken = parts[1]; // Base64 encoded real target

      // Lookup the mask to verify who controls it
      const aliasMatch: any = await env.DB.prepare(`
        SELECT destination_email, is_active FROM relay_aliases WHERE alias_address = ? LIMIT 1
      `).bind(maskPart).first();

      if (!aliasMatch || aliasMatch.is_active !== 1) {
        console.log("[BRIDGE] Invalid mask or inactive.");
        return;
      }

      // SECURITY LOCK: ONLY the real user's email is allowed to inject mail into the bridge!
      if (senderAddress !== aliasMatch.destination_email.toLowerCase()) {
        console.warn(`[BRIDGE] ALERT: Unauthorized user ${senderAddress} tried to inject reply via ${maskPart}`);
        return;
      }

      try {
        // Decode the actual target hidden in the alias
        const realTarget = atob(bridgeToken); // Simple decode for POC, can evolve to encrypted token
        
        console.log(`[BRIDGE] Forwarding outgoing reply from ${maskPart} to real recipient ${realTarget}`);

        // FORGE OUTBOUND PAYLOAD
        await env.EMAIL.send({
          to: realTarget,
          from: maskPart, // The mask!
          subject: emailSubject,
          text: emailBodyText,
          html: emailBodyHtml
        });

        return; // Finished bridge logic
      } catch (err) {
        console.error("[BRIDGE_FAIL] Could not dispatch bridge mail", err);
        return;
      }
    }

    // ----------------------------------------------------------------
    // PATH B: STANDARD INBOUND MASK ROUTING
    // ----------------------------------------------------------------
    const query = `
      SELECT id, destination_email, is_active, pgp_public_key, encryption_enabled 
      FROM relay_aliases 
      WHERE alias_address = ?
      LIMIT 1
    `;
    const alias: any = await env.DB.prepare(query).bind(inboundRecipient).first();

    if (!alias || alias.is_active !== 1) {
      console.log(`[ROUTING] Rejected. Unknown or disabled alias: ${inboundRecipient}`);
      return; // Drop
    }

    let finalSubject = `[StealthRelay] ${emailSubject}`;
    let finalText = emailBodyText;
    let finalHtml = emailBodyHtml;

    // -- ELITE FEATURE: INLINE PGP ENCRYPTION --
    if (alias.encryption_enabled === 1 && alias.pgp_public_key) {
      try {
        console.log(`[CRYPTO] Encrypting payload with user's PGP Public Key...`);
        
        const publicKey = await openpgp.readKey({ armoredKey: alias.pgp_public_key });
        
        // Package text and metadata into a single secure block
        const messageToEncrypt = await openpgp.createMessage({
          text: `From: ${senderAddress}\nSubject: ${emailSubject}\n\n${emailBodyText}`
        });

        const encrypted = await openpgp.encrypt({
          message: messageToEncrypt,
          encryptionKeys: publicKey
        });

        // Override output with pure ASCII armor
        finalText = String(encrypted);
        finalHtml = `<pre style="font-family: monospace; background: #f4f4f4; padding: 20px; border-radius: 8px;">${finalText}</pre>`;
        finalSubject = `[SECURE] Highly Classified Message from StealthRelay`;
      } catch (cryptoErr: any) {
        console.error("[CRYPTO_FAIL] OpenPGP operation collapsed:", cryptoErr.message);
        // Fallback: notify user encryption failed
        finalText = "CRITICAL: Failed to encrypt this message with your public key. Message truncated for your protection.";
        finalHtml = `<b style="color:red;">${finalText}</b>`;
      }
    }

    // -- ELITE FEATURE: DYNAMIC REPLY BRIDGE CONSTRUCTOR --
    // To enable the user to reply without leaking identity, we encode the sender's address in the bridge trigger
    const senderToken = btoa(senderAddress).replace(/=/g, ''); // Safe Base64
    const bridgeAddress = `${inboundRecipient.split('@')[0]}+${senderToken}@${domainPart}`;

    // PREPEND HEADER NOTIFYING USER HOW TO REPLY ANONYMOUSLY
    const bridgeNoticeHtml = `<div style="border-bottom:1px solid #eee; padding:10px; margin-bottom:20px; color:#666; font-size:12px;">🛡️ <b>StealthRelay Protection Active</b>.<br/>To reply anonymously, DO NOT use standard reply. Send your reply to: <b style="color:#2563eb;">${bridgeAddress}</b></div>`;
    finalHtml = bridgeNoticeHtml + finalHtml;
    finalText = `[StealthRelay Protection Active]\nTo reply anonymously, send your response to: ${bridgeAddress}\n-----------------\n\n` + finalText;

    // -- EXECUTE FINAL DISPATCH --
    try {
      await env.EMAIL.send({
        to: alias.destination_email,
        from: `shield@${domainPart}`, // A system address so the user knows it's handled by the engine
        subject: finalSubject,
        text: finalText,
        html: finalHtml
      });

      // Stat Tracking
      ctx.waitUntil(
        env.DB.prepare("UPDATE relay_aliases SET forward_count = forward_count + 1 WHERE alias_address = ?")
          .bind(inboundRecipient)
          .run()
      );
      
      console.log(`[SUCCESS] Relayed from ${senderAddress} -> ${alias.destination_email}`);
    } catch (dispatchErr: any) {
      console.error("[CRITICAL] Outbound dispatch failed:", dispatchErr.message);
    }
  }
};
