const { Proposals, User, UserGroup, Customer } = require('./models');

async function testAssociations() {
  try {
    console.log('Testing Proposals associations...');
    
    // Get one proposal with all associations
    const proposal = await Proposals.findOne({
      where: { status: 'accepted' },
      include: [
        {
          model: User,
          as: 'Owner',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: UserGroup,
              as: 'group',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: UserGroup,
          as: 'ownerGroup',
          attributes: ['id', 'name']
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (proposal) {
      console.log('\nProposal found:');
      console.log('ID:', proposal.id);
      console.log('Description:', proposal.description);
      console.log('created_by_user_id:', proposal.created_by_user_id);
      console.log('owner_group_id:', proposal.owner_group_id);
      console.log('Owner:', proposal.Owner ? {
        id: proposal.Owner.id,
        name: proposal.Owner.name,
        email: proposal.Owner.email,
        group: proposal.Owner.group
      } : null);
      console.log('ownerGroup:', proposal.ownerGroup ? {
        id: proposal.ownerGroup.id,
        name: proposal.ownerGroup.name
      } : null);
      console.log('Customer:', proposal.customer ? {
        id: proposal.customer.id,
        name: proposal.customer.name
      } : null);
      
      // Test the frontend logic
      const contractor = proposal?.Owner?.group?.name || proposal?.ownerGroup?.name || proposal?.Owner?.name || 'N/A';
      console.log('\nFrontend logic result:');
      console.log('Contractor:', contractor);
    } else {
      console.log('No accepted proposals found');
    }
  } catch (error) {
    console.error('Error testing associations:', error.message);
    console.error('Full error:', error);
  }
}

testAssociations();
