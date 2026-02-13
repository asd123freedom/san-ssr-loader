import { compiler } from './test/helpers/compiler';

async function printOutput() {
    try {
        const result = await compiler('styles.san');
        console.log('=== Actual compiled output for styles.san ===');
        console.log(result.outputContent);
        console.log('=== End of compiled output ===');
        console.log('');
        console.log('=== Has style in output ===');
        console.log(`Contains \$style: ${result.outputContent.includes('$style')}`);
        console.log(`Contains \$tools: ${result.outputContent.includes('$tools')}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

printOutput();
