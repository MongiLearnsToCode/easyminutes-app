## Revised Pricing Structure for MVP / Soft Launch (Version 4)

To align with the direct app access model and new user conversion strategy, the pricing model is further refined with the following constraints:

**Recap of API Cost per Meeting:**

*   Based on previous calculations (Gemini 2.5 Flash, estimated average tokens):
    *   **Total API Cost per Meeting: $0.0275**
*   **Target Price per Meeting (with 300% Profit Margin): $0.11**

**User-Facing Pricing Model: Trial with a Single Paid Tier**

This model allows users to experience the app directly, with key functionalities and usage gated to drive conversion.

1.  **Trial Experience (No explicit 'Free Tier'):**
    *   **Access:** New users can directly access and use the app without immediate sign-up or subscription.
    *   **Features:** Users can input meeting data via text or file upload, generate AI summaries, and edit the generated minutes.
    *   **Limitations:**
        *   **No Audio Transcription:** Audio transcription is not available in this trial experience. Users will be prompted to upgrade to the Pro Tier for this feature.
        *   **Saving, Sharing, and Exporting are locked.** Users cannot save their work to their account, share it with others, or export it in any format.
        *   **No Auto-Save:** Auto-save functionality is disabled. Users will be periodically, subtly, and kindly alerted that their work is not being saved unless they sign up (if not signed up) and subscribe to the Pro Tier.
        *   **Compulsory Session-Based Usage Limits:** AI generation is subject to compulsory session-based usage limits. After a certain amount of usage (e.g., 3-5 AI generations or a set duration of active use), the user will be prompted to pay to continue using the app. Reminders will be offered before cutting a user off, prompting them to subscribe to the Pro Tier.
    *   **Rationale:** This trial provides immediate value and a hands-on experience, allowing users to see the power of the AI summarization. By restricting saving, sharing, exporting, and audio transcription, the core utility of the generated minutes is limited, creating a strong incentive to upgrade for full functionality. Compulsory session-based usage limits manage costs and drive conversion for users who find value in the app.

2.  **Pro Tier (Single Paid Tier):**
    *   **Price:** $9.99 per month
    *   **Features:**
        *   **Full access to all core features**, including unlimited meeting import, AI summarization (with higher limits/speeds), editing, saving to user account, advanced cataloging, and full access to share/export functionalities.
        *   **Audio Transcription:** Full access to audio transcription capabilities.
        *   **Auto-Save:** Auto-save functionality is enabled.
        *   **Higher AI Generation Limits:** Up to 100 meetings per month with standard processing speeds and higher input limits (e.g., up to 2 hours of audio or 20,000 words of text input per meeting).
    *   **Rationale:** This single paid tier offers comprehensive functionality and ample usage limits for regular users, providing a clear and valuable upgrade path.

**User Flow for Conversion:**

*   **Direct App Access:** New users land directly on the app interface and can immediately start using the core AI summarization and editing features (without audio transcription).
*   **Trial Status after Sign-up:** If a user signs up without subscribing, they remain in the trial experience with all its limitations until they subscribe to the Pro Tier. This means even signed-up users on the trial will not have access to audio transcription, auto-save, saving, sharing, or exporting.
*   **Prompts for Subscription:**
    *   **On Share/Export Attempt:** When a user attempts to use any saving, sharing, or exporting functionality, a clear, persistent prompt will appear, explaining that these features require a Pro subscription. The prompt will offer a direct path to subscribe.
    *   **On Audio Transcription Attempt:** When a user attempts to use the audio transcription feature, a clear, persistent prompt will appear, explaining that this feature requires a Pro subscription. The prompt will offer a direct path to subscribe.
    *   **On Auto-Save Alert:** Periodic, subtle, and kind alerts will inform users that auto-save is not active and that a Pro subscription is required for this feature. These alerts will not be intrusive but will serve as consistent reminders.
    *   **On Compulsory Session Limit:** When a user reaches the compulsory session-based usage limit for AI generations, a prominent, blocking prompt will appear. This prompt will clearly state that usage has been exhausted and will offer a direct path to subscribe to the Pro Tier to continue using the app. Users will not be able to proceed without subscribing or waiting for the next session (if applicable).

**Why this revised approach?**

*   **Immediate Value (Limited):** Users can experience a core part of the app's value without friction, reducing bounce rates.
*   **Strong Conversion Triggers:** Gating essential features (saving, sharing, exporting, audio transcription) and implementing compulsory usage limits creates clear and immediate reasons for users to subscribe.
*   **Cost Management:** Limits on AI generation and the absence of audio transcription in the trial help control API costs.
*   **Simplicity Maintained:** The pricing structure remains simple with a clear trial experience and a single Pro Tier.

This revised structure optimizes the user journey for conversion while maintaining a minimalist and profitable approach for the MVP and soft launch.

