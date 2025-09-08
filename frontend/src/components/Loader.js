import React from 'react';

const Loader = () => {
  return (
    <div style={styles.container} role="status" aria-live="polite" aria-busy="true">
      <div style={styles.spinner} aria-hidden="true"></div>
      <p style={styles.text}>Loading…</p>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  text: { marginTop: 8, fontSize: 14, color: '#6c757d' }
};

export default Loader;
