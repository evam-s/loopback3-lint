const { Op } = require('sequelize');

const resizeObserver = new ResizeObserver(() => {});
resizeObserver.observe(document.body);

async function findRecent(User) {
  return User.findAll({
    attributes: ['id', 'name'],
    where: { createdAt: { [Op.gt]: new Date() } },
    order: [['name', 'DESC']],
  });
}

module.exports = { findRecent };
