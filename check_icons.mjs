
import * as simpleIcons from 'simple-icons';

const keys = Object.keys(simpleIcons);
const linkedinKeys = keys.filter(k => k.toLowerCase().includes('linkedin') || k.toLowerCase().includes('linked'));
console.log('Found keys:', linkedinKeys);

if (linkedinKeys.length === 0) {
    console.log('No keys found matching "linked"');
    const index = keys.findIndex(k => k > 'siLinke');
    if (index > -1) {
        console.log('Neighbors:', keys.slice(Math.max(0, index - 5), index + 5));
    }
}
