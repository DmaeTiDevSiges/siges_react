
import { parseFlowContent } from './utils/flowConverter.js';
import { readFileSync } from 'fs';

const content = readFileSync('flows/servicesRequests/create-service-request.flow', 'utf-8');
const flow = parseFlowContent(content);
console.log('Metadata:', JSON.stringify(flow.metadata, null, 2));
