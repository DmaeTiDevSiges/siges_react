import fs from 'fs';
const data = JSON.parse(fs.readFileSync('vps_users_check.json', 'utf8'));
const superAdmins = data.filter(u => u.is_admin_super === true);
console.log('Super Admins:', JSON.stringify(superAdmins, null, 2));
