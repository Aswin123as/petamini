import React from 'react';
import { Page } from '@/components/Page';

export const LinkersPage: React.FC = () => {
  return (
    <Page back={true}>
      <div
        style={{
          padding: '20px',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#fff',
          }}
        >
          Linkers
        </h1>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              marginBottom: '10px',
              color: '#fff',
            }}
          >
            User Information
          </h2>
          <p style={{ color: '#ccc', marginBottom: '8px' }}>Name: User</p>
          <p style={{ color: '#ccc', marginBottom: '8px' }}>Status: Active</p>
          <p style={{ color: '#ccc' }}>Member since: 2025</p>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              marginBottom: '10px',
              color: '#fff',
            }}
          >
            Statistics
          </h2>
          <p style={{ color: '#ccc', marginBottom: '8px' }}>Total Cards: 0</p>
          <p style={{ color: '#ccc', marginBottom: '8px' }}>
            Total Spent: 0 ⭐
          </p>
          <p style={{ color: '#ccc' }}>Rank: Beginner</p>
        </div>
      </div>
    </Page>
  );
};

export default LinkersPage;
