const { Proposals, User, UserGroup, Customer, Location } = require('./models');
const { Op } = require('sequelize');

async function testApiQuery() {
  try {
    console.log('Testing exact API query...');
    
    // Recreate the exact query from proposalsController.js
    const statusFilter = 'accepted';
    const page = 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    
    // Apply status filter if provided (supports comma-separated list)
    if (statusFilter) {
        let statuses = statusFilter.split(',').map(s => decodeURIComponent(s.trim())).filter(Boolean);
        // Backward compatibility: if 'accepted' requested, also include legacy 'Proposal accepted'
        if (statuses.includes('accepted') && !statuses.includes('Proposal accepted')) {
            statuses.push('Proposal accepted');
        }
        whereClause.status = { [Op.in]: statuses };
    }

    const { count, rows } = await Proposals.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: Customer,
                as: 'customer',
                attributes: ['id', 'name', 'email', 'mobile', 'address']
            },
            {
                model: User,
                as: 'designerData',
                attributes: ['id', 'name', 'email']
            },
            {
                model: Location,
                as: 'locationData',
                attributes: ['id', 'locationName', 'email', 'phone']
            },
            // Include contractor (owner) minimal info for admin list display
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
            // Also include ownerGroup directly (contractor group) for legacy rows where created_by_user_id is null
            {
                model: UserGroup,
                as: 'ownerGroup',
                attributes: ['id', 'name']
            }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
    });

    console.log('Query executed successfully');
    console.log('Count:', count);
    console.log('Rows:', rows.length);
    
    if (rows.length > 0) {
      console.log('\nFirst proposal:');
      const proposal = rows[0];
      console.log('ID:', proposal.id);
      console.log('Description:', proposal.description);
      console.log('created_by_user_id:', proposal.created_by_user_id);
      console.log('owner_group_id:', proposal.owner_group_id);
      console.log('Has Owner?', !!proposal.Owner);
      console.log('Has ownerGroup?', !!proposal.ownerGroup);
      
      if (proposal.Owner) {
        console.log('Owner:', {
          id: proposal.Owner.id,
          name: proposal.Owner.name,
          email: proposal.Owner.email,
          hasGroup: !!proposal.Owner.group
        });
        if (proposal.Owner.group) {
          console.log('Owner.group:', {
            id: proposal.Owner.group.id,
            name: proposal.Owner.group.name
          });
        }
      }
      
      if (proposal.ownerGroup) {
        console.log('ownerGroup:', {
          id: proposal.ownerGroup.id,
          name: proposal.ownerGroup.name
        });
      }
      
      // Test frontend logic
      const contractor = proposal?.Owner?.group?.name || proposal?.ownerGroup?.name || proposal?.Owner?.name || 'N/A';
      console.log('\nFrontend would show contractor:', contractor);
      
      // Show raw JSON structure
      console.log('\nRaw JSON structure:');
      console.log(JSON.stringify({
        id: proposal.id,
        Owner: proposal.Owner,
        ownerGroup: proposal.ownerGroup,
        customer: proposal.customer
      }, null, 2));
    }
    
  } catch (error) {
    console.error('Error testing API query:', error.message);
    console.error('Full error:', error);
  }
}

testApiQuery();
