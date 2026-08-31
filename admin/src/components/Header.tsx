import { useAuth } from '../context/AuthContext';
import { UserCheck } from 'lucide-react';

export default function Header() {
  const { user } = useAuth();

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <h2 style={styles.title}>System Control Center</h2>
      </div>

      <div style={styles.right}>
        <div style={styles.profileBadge}>
          <UserCheck size={16} color="#10b981" style={{ marginRight: 8 }} />
          <div style={styles.profileInfo}>
            <span style={styles.name}>{user?.name || 'Administrator'}</span>
            <span style={styles.email}>{user?.email || 'admin@bbd.ac.in'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: '64px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
  },
  left: {},
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#374151',
    margin: 0,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
  },
  profileBadge: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: '6px 12px',
    borderRadius: '20px',
    border: '1px solid #e5e7eb',
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
  },
  name: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  email: {
    fontSize: '9px',
    color: '#6b7280',
  },
};
