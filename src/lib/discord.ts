
export async function sendErrorToDiscord(error: unknown, context: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL not set. Skipping Discord notification.');
    return;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = (error instanceof Error ? error.stack : undefined) || 'No stack trace';

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [
          {
            title: `🚨 Error in ${context}`,
            description: `**Error:** ${errorMessage}\n\n**Stack:**\n\`\`\`\n${errorStack.slice(0, 1000)}\n\`\`\``,
            color: 15158332, // Red
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch (discordError) {
    console.error('Failed to send error to Discord:', discordError);
  }
}
