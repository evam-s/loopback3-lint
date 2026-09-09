const { useEffect, useRef } = require('react');

function Card({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    const io = new IntersectionObserver(() => {});
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return children;
}

module.exports = Card;
