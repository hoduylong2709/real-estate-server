const compareView = (listing1, listing2) => {
  let comparison = 0;

  if (listing1.views > listing2.views) {
    comparison = 1;
  }
  if (listing1.views < listing2.views) {
    comparison = -1;
  }

  return comparison * -1;
};

module.exports = { compareView };