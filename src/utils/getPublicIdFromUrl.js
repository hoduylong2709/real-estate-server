const getPublicId = url => {
  const elements = url.split('/');
  return elements[7] + '/' + elements[8].slice(0, -4);
};

module.exports = { getPublicId };