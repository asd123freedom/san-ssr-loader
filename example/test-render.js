
const { render } = require('./dist/bundle.js');

const result = render({
  title: 'Welcome to San SSR',
  content: 'This is a server-side rendered component using San SSR'
});

console.log('Render result:', result);
