const { User, UserGroup } = require('./models/index');

async function checkUserGroup() {
  try {
    console.log('Checking user group information...');

    const user = await User.findOne({
      where: { email: 'joseca@symmetricalwolf.com' },
      include: [{
        model: UserGroup,
        as: 'group',
        required: false
      }]
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('User info:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      group_id: user.group_id,
      hasGroup: !!user.group
    });

    if (user.group) {
      console.log('Group info:', {
        id: user.group.id,
        name: user.group.name,
        group_type: user.group.group_type,
        modules: user.group.modules
      });
    } else {
      console.log('⚠️  User has no group assigned');
    }

    // Check if group_id exists but group is null
    if (user.group_id && !user.group) {
      console.log('🔍 Checking if group exists in database...');
      const group = await UserGroup.findByPk(user.group_id);
      if (group) {
        console.log('✅ Group exists but association might be broken');
        console.log('Group details:', group.toJSON());
      } else {
        console.log('❌ Referenced group does not exist');
      }
    }

  } catch (error) {
    console.error('Error checking user group:', error);
  }
}

checkUserGroup();
