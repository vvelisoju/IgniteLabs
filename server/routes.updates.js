// Replace line 866-873
// OLD:
// Get organization settings (hardcoded for now)
// const organization = {
//   name: 'Ignite Labs',
//   address: '123 Main St, Tech Hub, Bangalore - 560001',
//   phone: '+91 9876543210',
//   email: 'info@ignitelabs.edu',
//   website: 'www.ignitelabs.edu'
// };

// NEW:
// Get organization settings from storage
const organization = await storage.getOrganizationDetails();

// Replace line 921-928
// OLD:
// Get organization settings (hardcoded for now)
// const organization = {
//   name: 'Ignite Labs',
//   address: '123 Main St, Tech Hub, Bangalore - 560001',
//   phone: '+91 9876543210',
//   email: 'info@ignitelabs.edu',
//   website: 'www.ignitelabs.edu'
// };

// NEW:
// Get organization settings from storage
const organization = await storage.getOrganizationDetails();