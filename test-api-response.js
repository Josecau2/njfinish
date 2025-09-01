const axios = require('axios');

async function testProposalsAPI() {
  try {
    console.log('Testing Proposals API response...');
    
    // First, let's try to authenticate to get an admin token
    const loginResponse = await axios.post('http://localhost:8080/api/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, got token');
    
    // Now make the API call that the frontend makes
    const proposalsResponse = await axios.get('http://localhost:8080/api/get-proposals', {
      params: {
        status: 'accepted',
        page: 1,
        limit: 10
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\nAPI Response Status:', proposalsResponse.status);
    console.log('API Response Data:', JSON.stringify(proposalsResponse.data, null, 2));
    
    // Check if we have the expected structure
    if (proposalsResponse.data && proposalsResponse.data.proposals) {
      console.log('Total Count:', proposalsResponse.data.totalCount);
      console.log('Proposals Count:', proposalsResponse.data.proposals.length);
      
      // Log the first few proposals to see their structure
      proposalsResponse.data.proposals.slice(0, 3).forEach((proposal, index) => {
        console.log(`\n--- Proposal ${index + 1} (ID: ${proposal.id}) ---`);
        console.log('Owner:', proposal.Owner);
        console.log('ownerGroup:', proposal.ownerGroup);
        console.log('Customer:', proposal.customer);
        console.log('created_by_user_id:', proposal.created_by_user_id);
        console.log('owner_group_id:', proposal.owner_group_id);
        
        // Show what the frontend logic would evaluate
        const contractor = proposal?.Owner?.group?.name || proposal?.ownerGroup?.name || proposal?.Owner?.name || 'N/A';
        const endUser = proposal?.customer?.name || 'N/A';
        console.log('Frontend would show:');
        console.log('  Contractor:', contractor);
        console.log('  End User:', endUser);
      });
    } else {
      console.log('Response structure is different than expected');
      console.log('Available keys:', Object.keys(proposalsResponse.data));
    }
    
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
    
    // If login failed, try with different credentials
    if (error.response?.status === 401) {
      console.log('\nTrying different login credentials...');
      
      try {
        // Try with different credentials
        const loginResponse2 = await axios.post('http://localhost:8080/api/login', {
          email: 'admin@example.com',
          password: 'password'
        });
        
        console.log('Alternative login successful');
        // Repeat the API call with new token...
        
      } catch (error2) {
        console.log('Alternative login also failed');
        console.log('Please check what admin credentials exist in the database');
      }
    }
  }
}

testProposalsAPI();
