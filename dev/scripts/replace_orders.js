const fs = require('fs');
const file = 'services/dataService.ts';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const startIdx = 3752 - 1; // // Orders
const endIdx = 4687 - 1;   // },

console.log('Start line:', lines[startIdx]);
console.log('End line:', lines[endIdx]);

const replacement = `    // Orders
    getActiveOrdersByAssetTagId: ordersService.getActiveOrdersByAssetTagId,
    completeServiceOrder: ordersService.completeServiceOrder,
    cancelServiceOrder: ordersService.cancelServiceOrder,
    createServiceRequest: ordersService.createServiceRequest,
    getParentOrder: ordersService.getParentOrder,
    getChildOrders: ordersService.getChildOrders,
    createOrder: ordersService.createOrder,
    copyImagesFromOrderToOrder: ordersService.copyImagesFromOrderToOrder,
    uploadOrderImage: ordersService.uploadOrderImage,
    updateOrderImage: ordersService.updateOrderImage,
    updateOrder: ordersService.updateOrder,
    updateOrderFiles: ordersService.updateOrderFiles,
    updateOrderStatus: ordersService.updateOrderStatus,
    updateServiceRequestStatus: ordersService.updateServiceRequestStatus,`;

lines.splice(startIdx, endIdx - startIdx + 1, replacement);
fs.writeFileSync(file, lines.join('\n'));
console.log('Done!');
