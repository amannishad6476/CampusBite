import React, { useState, useEffect } from 'react';
import { Store, Clock, Phone, MapPin, Star, CheckCircle, AlertCircle, Save, Power } from 'lucide-react';
import { shopkeeperService } from '../../services/shopkeeperService';
import { Shop } from '../../types';

export default function MyCanteen() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const fetchShop = async () => {
    setIsLoading(true);
    try {
      const data = await shopkeeperService.getMyShop();
      setShop(data);
      setName(data.name || '');
      setDescription(data.description || '');
      setPhoneNumber(data.phone_number || '');
      setLogoUrl(data.logo_url || '');
      setOpeningTime(data.opening_time || '08:00');
      setClosingTime(data.closing_time || '20:00');
      setIsOpen(data.is_open);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Could not load canteen profile' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShop();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const updated = await shopkeeperService.updateMyShop({
        name: name.trim(),
        description: description.trim() || undefined,
        phone_number: phoneNumber.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
        opening_time: openingTime || undefined,
        closing_time: closingTime || undefined,
        is_open: isOpen,
      });
      setShop(updated);
      setStatusMessage({ type: 'success', text: 'Canteen settings saved successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update canteen information' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !shop) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading Canteen Profile...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Canteen Profile</h1>
          <p style={styles.subtitle}>Configure canteen details, operating hours, and live availability</p>
        </div>
      </div>

      {statusMessage && (
        <div
          style={{
            ...styles.alert,
            backgroundColor: statusMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
            borderColor: statusMessage.type === 'success' ? '#a7f3d0' : '#fecaca',
            color: statusMessage.type === 'success' ? '#065f46' : '#991b1b',
          }}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle size={18} style={{ marginRight: 8, flexShrink: 0 }} />
          ) : (
            <AlertCircle size={18} style={{ marginRight: 8, flexShrink: 0 }} />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div style={styles.contentGrid}>
        {/* Main Configuration Form */}
        <div style={styles.formCard}>
          <form onSubmit={handleSave} style={styles.form}>
            <div style={styles.formSection}>
              <h3 style={styles.sectionTitle}>General Information</h3>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Canteen Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. Campus Central Canteen"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={styles.textarea}
                  placeholder="Tell students about your specialties, meal times, and canteen atmosphere..."
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Contact Phone Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={styles.input}
                  placeholder="+919876543210"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Logo / Banner Image URL</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  style={styles.input}
                  placeholder="https://example.com/logo.jpg"
                />
              </div>
            </div>

            <div style={styles.formSection}>
              <h3 style={styles.sectionTitle}>Operating Hours</h3>
              <div style={styles.timeGrid}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Opening Time</label>
                  <input
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Closing Time</label>
                  <input
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.formSection}>
              <h3 style={styles.sectionTitle}>Live Store Status</h3>
              <div style={styles.toggleRow}>
                <div>
                  <div style={styles.toggleLabel}>Accepting New Orders</div>
                  <div style={styles.toggleSub}>
                    Turn off if your canteen is temporarily overcrowded or out of ingredients
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  style={{
                    ...styles.toggleSwitch,
                    backgroundColor: isOpen ? '#16a34a' : '#d1d5db',
                  }}
                >
                  <div
                    style={{
                      ...styles.toggleThumb,
                      transform: isOpen ? 'translateX(24px)' : 'translateX(2px)',
                    }}
                  />
                </button>
              </div>
            </div>

            <div style={styles.btnRow}>
              <button type="submit" disabled={isSaving} style={styles.saveBtn}>
                <Save size={16} style={{ marginRight: 8 }} />
                <span>{isSaving ? 'Saving Changes...' : 'Save Canteen Settings'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Canteen Snapshot / Metadata Card */}
        <div style={styles.sideCard}>
          <div style={styles.sideHeader}>
            <div style={styles.shopAvatar}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={styles.logoImg} />
              ) : (
                <Store size={32} color="#ea580c" />
              )}
            </div>
            <h3 style={styles.sideShopName}>{shop?.name}</h3>
            <div style={styles.ratingBadge}>
              <Star size={14} fill="#f59e0b" color="#f59e0b" style={{ marginRight: 4 }} />
              <span>{Number(shop?.rating || 0).toFixed(1)} rating</span>
            </div>
          </div>

          <div style={styles.sideDivider} />

          <div style={styles.sideDetails}>
            <div style={styles.sideRow}>
              <MapPin size={16} color="#6b7280" style={{ flexShrink: 0 }} />
              <div>
                <div style={styles.sideLabel}>Campus Location</div>
                <div style={styles.sideVal}>{shop?.campus_name || 'BBD Campus'}</div>
              </div>
            </div>

            <div style={styles.sideRow}>
              <Clock size={16} color="#6b7280" style={{ flexShrink: 0 }} />
              <div>
                <div style={styles.sideLabel}>Daily Schedule</div>
                <div style={styles.sideVal}>{openingTime} — {closingTime}</div>
              </div>
            </div>

            <div style={styles.sideRow}>
              <Phone size={16} color="#6b7280" style={{ flexShrink: 0 }} />
              <div>
                <div style={styles.sideLabel}>Helpline / Counter</div>
                <div style={styles.sideVal}>{phoneNumber || 'Not provided'}</div>
              </div>
            </div>

            <div style={styles.sideRow}>
              <Power size={16} color={isOpen ? '#16a34a' : '#dc2626'} style={{ flexShrink: 0 }} />
              <div>
                <div style={styles.sideLabel}>Status</div>
                <div style={{ ...styles.sideVal, color: isOpen ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                  {isOpen ? 'Open & Active' : 'Closed'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
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
  alert: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '20px',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '28px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    borderBottom: '1px solid #f3f4f6',
    paddingBottom: '20px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#1f2937',
    margin: 0,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
  },
  textarea: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  timeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: '14px 16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  toggleLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
  },
  toggleSub: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  toggleSwitch: {
    width: '48px',
    height: '26px',
    borderRadius: '13px',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
    transition: 'background-color 0.2s ease',
  },
  toggleThumb: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    transition: 'transform 0.2s ease',
  },
  btnRow: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#ea580c',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(234, 88, 12, 0.2)',
  },
  sideCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  sideHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  shopAvatar: {
    width: '72px',
    height: '72px',
    borderRadius: '16px',
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
    overflow: 'hidden',
  },
  logoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  sideShopName: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#111827',
    margin: '0 0 6px 0',
  },
  ratingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    border: '1px solid #fde68a',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#92400e',
  },
  sideDivider: {
    height: '1px',
    backgroundColor: '#f3f4f6',
    margin: '20px 0',
  },
  sideDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sideRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  sideLabel: {
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: 600,
  },
  sideVal: {
    fontSize: '13px',
    color: '#1f2937',
    fontWeight: 500,
  },
};
