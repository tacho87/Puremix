// Webhook endpoint for various services
// Test: POST /api/webhook/stripe, POST /api/webhook/github, POST /api/webhook/discord

export default async function handler(request, response) {
  const { service } = request.params;
  const method = request.method.toLowerCase();
  
  console.log(`🪝 Webhook Request: ${method.toUpperCase()} /api/webhook/${service}`);
  console.log('   Headers:', Object.keys(request.headers));
  console.log('   Content-Type:', request.headers['content-type']);
  
  if (method !== 'post') {
    return response.status(405).json({
      error: 'Method not allowed',
      message: 'Webhooks only accept POST requests',
      allowed: ['POST'],
      received: request.method
    });
  }
  
  try {
    switch (service.toLowerCase()) {
      case 'stripe':
        return await handleStripeWebhook(request, response);
      case 'github':
        return await handleGitHubWebhook(request, response);
      case 'discord':
        return await handleDiscordWebhook(request, response);
      case 'slack':
        return await handleSlackWebhook(request, response);
      default:
        return response.status(404).json({
          error: 'Webhook service not supported',
          service: service,
          supported: ['stripe', 'github', 'discord', 'slack'],
          message: `Webhook endpoint for '${service}' is not configured`
        });
    }
  } catch (error) {
    console.error(`Webhook Error (${service}):`, error);
    return response.status(500).json({
      error: 'Webhook processing failed',
      service: service,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function handleStripeWebhook(request, response) {
  const payload = request.body;
  const signature = request.headers['stripe-signature'];
  
  console.log('🔷 Processing Stripe webhook');
  console.log('   Event Type:', payload?.type);
  console.log('   Has Signature:', !!signature);
  
  // Simulate signature verification
  if (!signature) {
    return response.status(400).json({
      error: 'Missing Stripe signature',
      message: 'stripe-signature header is required'
    });
  }
  
  // Process different Stripe event types
  const eventType = payload?.type || 'unknown';
  let processed = false;
  let result = {};
  
  switch (eventType) {
    case 'payment_intent.succeeded':
      result = {
        action: 'Payment processed successfully',
        amount: payload.data?.object?.amount || 0,
        currency: payload.data?.object?.currency || 'usd',
        customer: payload.data?.object?.customer || 'unknown'
      };
      processed = true;
      break;
      
    case 'customer.subscription.created':
      result = {
        action: 'New subscription created',
        customerId: payload.data?.object?.customer,
        planId: payload.data?.object?.items?.data?.[0]?.price?.id,
        status: payload.data?.object?.status
      };
      processed = true;
      break;
      
    case 'invoice.payment_failed':
      result = {
        action: 'Payment failed - send notification',
        invoiceId: payload.data?.object?.id,
        customerId: payload.data?.object?.customer,
        amountDue: payload.data?.object?.amount_due
      };
      processed = true;
      break;
      
    default:
      result = {
        action: 'Event logged but not processed',
        eventType: eventType,
        supported: ['payment_intent.succeeded', 'customer.subscription.created', 'invoice.payment_failed']
      };
      break;
  }
  
  return response.status(200).json({
    received: true,
    service: 'stripe',
    eventType: eventType,
    processed: processed,
    result: result,
    timestamp: new Date().toISOString()
  });
}

async function handleGitHubWebhook(request, response) {
  const payload = request.body;
  const signature = request.headers['x-hub-signature-256'];
  const githubEvent = request.headers['x-github-event'];
  
  console.log('🐙 Processing GitHub webhook');
  console.log('   Event:', githubEvent);
  console.log('   Repository:', payload?.repository?.full_name);
  console.log('   Has Signature:', !!signature);
  
  if (!signature) {
    return response.status(401).json({
      error: 'Missing GitHub signature',
      message: 'x-hub-signature-256 header is required'
    });
  }
  
  let processed = false;
  let result = {};
  
  switch (githubEvent) {
    case 'push':
      const commits = payload?.commits || [];
      result = {
        action: 'Process push event',
        repository: payload?.repository?.full_name,
        branch: payload?.ref?.replace('refs/heads/', ''),
        commitCount: commits.length,
        pusher: payload?.pusher?.name,
        commits: commits.map(c => ({
          id: c.id,
          message: c.message,
          author: c.author?.name
        }))
      };
      processed = true;
      break;
      
    case 'pull_request':
      result = {
        action: `Pull request ${payload?.action}`,
        repository: payload?.repository?.full_name,
        prNumber: payload?.pull_request?.number,
        title: payload?.pull_request?.title,
        author: payload?.pull_request?.user?.login,
        state: payload?.pull_request?.state
      };
      processed = true;
      break;
      
    case 'issues':
      result = {
        action: `Issue ${payload?.action}`,
        repository: payload?.repository?.full_name,
        issueNumber: payload?.issue?.number,
        title: payload?.issue?.title,
        author: payload?.issue?.user?.login,
        labels: payload?.issue?.labels?.map(l => l.name) || []
      };
      processed = true;
      break;
      
    default:
      result = {
        action: 'Event received but not processed',
        event: githubEvent,
        supported: ['push', 'pull_request', 'issues']
      };
      break;
  }
  
  return response.status(200).json({
    received: true,
    service: 'github',
    event: githubEvent,
    processed: processed,
    result: result,
    timestamp: new Date().toISOString()
  });
}

async function handleDiscordWebhook(request, response) {
  const payload = request.body;
  
  console.log('💬 Processing Discord webhook');
  console.log('   Type:', payload?.type);
  console.log('   Guild ID:', payload?.guild_id);
  
  // Discord webhook verification
  if (payload?.type === 1) {
    // Ping - respond with pong
    return response.status(200).json({
      type: 1 // PONG
    });
  }
  
  let result = {};
  let processed = false;
  
  if (payload?.type === 2) {
    // Application command
    const commandName = payload?.data?.name;
    const user = payload?.member?.user || payload?.user;
    
    switch (commandName) {
      case 'hello':
        result = {
          action: 'Respond to hello command',
          user: user?.username,
          response: `Hello ${user?.username}! 👋`
        };
        processed = true;
        break;
        
      case 'status':
        result = {
          action: 'Show server status',
          response: 'All systems operational! ✅'
        };
        processed = true;
        break;
        
      default:
        result = {
          action: 'Unknown command',
          command: commandName,
          response: 'Command not recognized'
        };
        break;
    }
  }
  
  return response.status(200).json({
    received: true,
    service: 'discord',
    type: payload?.type,
    processed: processed,
    result: result,
    timestamp: new Date().toISOString()
  });
}

async function handleSlackWebhook(request, response) {
  const payload = request.body;
  
  console.log('📱 Processing Slack webhook');
  console.log('   Type:', payload?.type);
  console.log('   Team:', payload?.team_id);
  
  // Handle Slack URL verification challenge
  if (payload?.type === 'url_verification') {
    return response.status(200).json({
      challenge: payload.challenge
    });
  }
  
  let result = {};
  let processed = false;
  
  switch (payload?.type) {
    case 'event_callback':
      const event = payload?.event;
      
      if (event?.type === 'message' && !event?.bot_id) {
        result = {
          action: 'Process user message',
          user: event?.user,
          channel: event?.channel,
          text: event?.text,
          timestamp: event?.ts
        };
        processed = true;
      } else if (event?.type === 'app_mention') {
        result = {
          action: 'Respond to app mention',
          user: event?.user,
          channel: event?.channel,
          text: event?.text
        };
        processed = true;
      }
      break;
      
    default:
      result = {
        action: 'Event received but not processed',
        type: payload?.type,
        supported: ['url_verification', 'event_callback']
      };
      break;
  }
  
  return response.status(200).json({
    received: true,
    service: 'slack',
    eventType: payload?.type,
    processed: processed,
    result: result,
    timestamp: new Date().toISOString()
  });
}