import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createTestRequest(userId, index) {
  const { data, error } = await supabase
    .from('help_requests')
    .insert({
      user_id: userId,
      title: `Test Request #${index + 1}`,
      question: `This is test help request #${index + 1} for admin monitoring. Testing realtime updates.`,
      status: 'pending',
      admin_notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*, profiles(*)')
    .single();

  if (error) throw error;
  console.log(`Created request #${index + 1} with ID: ${data.id}`);
  return data;
}

async function generateAIResponse(requestId) {
  const { data, error } = await supabase
    .from('ai_responses')
    .insert({
      request_id: requestId,
      response_text: 'This is a test AI response generated at ' + new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateRequestStatus(requestId, status) {
  const { error } = await supabase
    .from('help_requests')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) throw error;
}

async function main() {
  try {
    console.log('Admin Testing Script');
    console.log('===================');

    const userId = await question('Enter the test user ID: ');
    
    console.log('\nTest 1: Creating multiple help requests sequentially for realtime testing...');
    const requests = [];
    for (let i = 0; i < 3; i++) {
      const request = await createTestRequest(userId, i);
      requests.push(request);
      // Wait a bit between requests to make realtime updates more visible
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('All requests created successfully');

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\nTest 2: Generating AI responses...');
    for (const request of requests) {
      const response = await generateAIResponse(request.id);
      console.log(`Generated response for request ${request.id}:`, response);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\nTest 3: Testing status transitions...');
    // Test different status transitions
    await updateRequestStatus(requests[0].id, 'approved');
    console.log('Request 1 approved');
    
    await updateRequestStatus(requests[1].id, 'denied');
    console.log('Request 2 denied');
    
    // This should automatically transition to answered due to AI response
    await updateRequestStatus(requests[2].id, 'approved');
    console.log('Request 3 approved (should transition to answered)');

    console.log('\nTest 4: Verifying final states...');
    for (const request of requests) {
      const { data } = await supabase
        .from('help_requests')
        .select('*, ai_responses(*)')
        .eq('id', request.id)
        .single();
      
      console.log(`Request ${request.id}:`, {
        status: data.status,
        hasAiResponse: data.ai_responses.length > 0
      });
    }

    console.log('\nTests completed successfully! 🎉');
    console.log('\nNow you can verify the realtime updates in the browser.');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

main();