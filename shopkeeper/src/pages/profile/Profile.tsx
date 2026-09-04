import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Store, MapPin, CheckCircle, Clock } from 'lucide-react';
import { shopkeeperService } from '../../services/shopkeeperService';
import { ShopkeeperProfile } from '../../types';

export default function Profile() {
  const [profile, setProfile] = useState<ShopkeeperProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await shopkeeperService.getMyProfile();
        setProfile(data);
      } catch (err) {
        console.warn('Could not load profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading Profile...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Shopkeeper Account & Profile</h1>
        <p style={styles.subtitle}>Account credentials, assigned canteen ownership, and platform roles</p>
      </div>

      <div style={styles.grid}>
        {/* Personal / Account Info */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.avatar}>
              <User size={30} color="#ea580c" />
            </div>
            <div>
              <h2 style={styles.cardTitle}>{profile?.name || 'Shopkeeper'}</h2>
              <span style={styles.roleBadge}>Role: SHOPKEEPER</span>
            </div>
          </div>

          <div style={styles.cardBody}>
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>
                <Mail size={16} color="#6b7280" />
                <span>Email Address</span>
              </div>
              <div style={styles.infoVal}>{profile?.email}</div>
            </div>

            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>
                <Phone size={16} color="#6b7280" />
                <span>Registered Phone</span>
              </div>
              <div style={styles.infoVal}>{profile?.phone || 'Not provided'}</div>
            </div>

            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>
                <Shield size={16} color="#6b7280" />
                <span>Account Status</span>
              </div>
              <div style={styles.statusVal}>
                <CheckCircle size={15} color="#059669" style={{ marginRight: 6 }} />
                <span>{profile?.is_active ? 'Active & Verified' : 'Inactive'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Canteen Details */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ ...styles.avatar, backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
              <Store size={30} color="#2563eb" />
            </div>
            <div>
              <h2 style={styles.cardTitle}>{profile?.shop_name || 'Assigned Canteen'}</h2>
              <span style={{ ...styles.roleBadge, backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#dbeafe' }}>
                Canteen Facility
              </span>
            </div>
          </div>

          <div style={styles.cardBody}>
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>
                <MapPin size={16} color="#6b7280" />
                <span>Campus Location</span>
              </div>
              <div style={styles.infoVal}>{profile?.campus_name || 'BBD Campus'}</div>
            </div>

            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>
                <Store size={16} color="#6b7280" />
                <span>Shop ID</span>
              </div>
              <div style={{ ...styles.infoVal, fontFamily: 'monospace', fontSize: '12px' }}>
                {profile?.shop_id || 'N/A'}
              </div>
            </div>

            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>
                <Clock size={16} color="#6b7280" />
                <span>Ownership Isolation</span>
              </div>
              <div style={styles.infoVal}>Secured (Self-Canteen Only)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice Card */}
      <div style={styles.noticeCard}>
        <Shield size={20} color="#ea580c" style={{ marginRight: 12, flexShrink: 0 }} />
        <div>
          <div style={styles.noticeTitle}>Strict Canteen Ownership Policy</div>
          <div style={styles.noticeText}>
            Your shopkeeper account is securely bound to your assigned canteen only.
            Access to other vendors' menus, customer orders, or financial revenues is strictly isolated and forbidden.
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '960px',
    margin: '0 auto',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '40vh',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #ea580c',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '12px',
    fontSize: '14px',
    color: '#6b7280',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#111827',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    padding: '24px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
    borderBottom: '1px solid #f3f4f6',
    paddingBottom: '16px',
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 4px 0',
  },
  roleBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    color: '#c2410c',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
  },
  infoLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#6b7280',
  },
  infoVal: {
    fontWeight: 600,
    color: '#111827',
  },
  statusVal: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: 600,
    color: '#059669',
  },
  noticeCard: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    border: '1px solid #ffedd5',
    padding: '16px 20px',
    borderRadius: '12px',
  },
  noticeTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#9a3412',
  },
  noticeText: {
    fontSize: '12px',
    color: '#c2410c',
    marginTop: '2px',
    lineHeight: '1.4',
  },
};
