import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CookingPot, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Brand Header */}
        <div style={styles.header}>
          <div style={styles.logoBadge}>
            <CookingPot size={28} color="#ffffff" />
          </div>
          <h1 style={styles.title}>CampusBite</h1>
          <p style={styles.subtitle}>Canteen & Shopkeeper Management Portal</p>
          <div style={styles.roleTag}>Shopkeeper Access Only</div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} color="#ef4444" style={{ marginRight: 8, flexShrink: 0 }} />
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Canteen Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} color="#9ca3af" style={styles.inputIcon} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="canteen@campus.ac.in"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} color="#9ca3af" style={styles.inputIcon} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={styles.input}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.submitBtn,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            <span>{isSubmitting ? 'Signing in...' : 'Sign In to Canteen'}</span>
            <ArrowRight size={18} style={{ marginLeft: 8 }} />
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Authorized Canteen Owners & Vendors only. Students and delivery partners must use their respective apps.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    padding: '20px',
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '36px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
    border: '1px solid #e5e7eb',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logoBadge: {
    width: '54px',
    height: '54px',
    borderRadius: '14px',
    backgroundColor: '#ea580c',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
    boxShadow: '0 4px 10px rgba(234, 88, 12, 0.3)',
  },
  title: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#111827',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: '#6b7280',
    margin: 0,
  },
  roleTag: {
    display: 'inline-block',
    marginTop: '10px',
    padding: '3px 12px',
    backgroundColor: '#fff7ed',
    border: '1px solid #ffedd5',
    color: '#c2410c',
    fontSize: '11px',
    fontWeight: 700,
    borderRadius: '20px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    padding: '12px 14px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  errorText: {
    fontSize: '13px',
    color: '#b91c1c',
    fontWeight: 500,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
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
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
  },
  input: {
    width: '100%',
    padding: '10px 12px 10px 38px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#111827',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 16px',
    backgroundColor: '#ea580c',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 700,
    marginTop: '8px',
    boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.25)',
  },
  footer: {
    marginTop: '24px',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '16px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '11px',
    color: '#9ca3af',
    margin: 0,
    lineHeight: '1.4',
  },
};
