import React from 'react';
import styles from '../../styles/utils/loading.module.scss';

const Loading: React.FC = () => {
    // loading component that renders if any value or response is loading 
  return (
    <div>
      <div className={styles.spinnerContainer}>
        <div className={styles.spinner}></div>
      </div>
    </div>
  );
};

export default Loading;