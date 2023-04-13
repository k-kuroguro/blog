MathJax = {
   loader: { load: ['a11y/complexity'] },
   tex: {
      inlineMath: [['$', '$']],
      tags: 'ams',
      macros: {
         x: '{\\times}',
         bm: ['{\\boldsymbol{#1}}', 1],
         dd: ['{\\frac{\\partial #1}{\\partial #2}}', 2],
      },
   },
};
