const { Proposals, User, UserGroup, Customer } = require('./models/index.js');

async function checkData() {
  try {
    const proposals = await Proposals.findAll({
      where: { status: ['accepted', 'Proposal accepted'] },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name'] },
        { 
          model: User, 
          as: 'Owner', 
          attributes: ['id', 'name'],
          include: [{ model: UserGroup, as: 'group', attributes: ['id', 'name'] }]
        },
        { model: UserGroup, as: 'ownerGroup', attributes: ['id', 'name'] }
      ],
      limit: 5
    });
    
    console.log(`Found ${proposals.length} accepted proposals:`);
    
    proposals.forEach(p => {
      console.log(`Proposal ${p.id}:`);
      console.log(`  created_by_user_id: ${p.created_by_user_id}`);
      console.log(`  owner_group_id: ${p.owner_group_id}`); 
      console.log(`  Owner: ${p.Owner ? p.Owner.name : 'null'}`);
      console.log(`  Owner.group: ${p.Owner?.group?.name || 'null'}`);
      console.log(`  ownerGroup: ${p.ownerGroup?.name || 'null'}`);
      console.log(`  Customer: ${p.customer?.name || 'null'}`);
      console.log('---');
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

checkData();
