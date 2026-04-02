'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { LoginCredentials } from '@/types';
import { makeStyles, Spinner } from '@fluentui/react-components';
import { EyeRegular, EyeOffRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  leftPanel: {
    flex: '1 1 50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: '48px 56px',
  },
  formWrapper: {
    width: '100%',
    maxWidth: '380px',
  },
  inputWrap: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
  },
  input: {
    width: '100%',
    height: '50px',
    border: '1.5px solid #dde3ef',
    borderRadius: '6px',
    padding: '0 48px 0 16px',
    fontSize: '15px',
    color: '#222',
    backgroundColor: '#fafbfd',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    appearance: 'none' as const,
  },
  toggleBtn: {
    position: 'absolute' as const,
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#aab0c0',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
  },
  checkRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '22px',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#555',
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  loginBtn: {
    width: '100%',
    height: '50px',
    backgroundColor: '#0F6CBD',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 700 as const,
    letterSpacing: '0.1em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '8px',
    boxShadow: '0 4px 16px rgba(15,108,189,0.3)',
    transition: 'background-color 0.2s, opacity 0.2s',
  },
  errorMsg: {
    color: '#c0392b',
    fontSize: '13px',
    textAlign: 'center' as const,
    background: '#fff0ef',
    borderRadius: '6px',
    padding: '8px 12px',
    marginBottom: '14px',
  },
  validationMsg: {
    color: '#c0392b',
    fontSize: '12px',
    marginTop: '-10px',
    marginBottom: '10px',
    paddingLeft: '2px',
  },
});

export default function LoginForm() {
  const styles = useStyles();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>();

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      await login(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/*  Left panel: form  */}
      <div className={styles.leftPanel}>
        <div className={styles.formWrapper}>

          {/* Title */}
          <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '32px', textAlign: 'center' }}>
            <span style={{ color: '#1a1a2e' }}>ENTRA </span>
            <span style={{ color: '#0F6CBD' }}>ORA</span>
          </h1>

          <form onSubmit={handleSubmit(onSubmit)}>

            {/* Email */}
            <div className={styles.inputWrap}>
              <input
                type="email"
                placeholder="Username o Email"
                className={styles.input}
                style={errors.email ? { borderColor: '#e74c3c', boxShadow: '0 0 0 2px rgba(231,76,60,0.15)' } : {}}
                {...register('email', {
                  required: 'Email obbligatoria',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email non valida',
                  },
                })}
              />
            </div>
            {errors.email && <p className={styles.validationMsg}>{errors.email.message}</p>}

            {/* Password */}
            <div className={styles.inputWrap}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className={styles.input}
                style={errors.password ? { borderColor: '#e74c3c', boxShadow: '0 0 0 2px rgba(231,76,60,0.15)' } : {}}
                {...register('password', { required: 'Password obbligatoria' })}
              />
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
              >
                {showPassword ? <EyeOffRegular fontSize={20} /> : <EyeRegular fontSize={20} />}
              </button>
            </div>
            {errors.password && <p className={styles.validationMsg}>{errors.password.message}</p>}

            {/* Remember me row */}
            <div className={styles.checkRow}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#0F6CBD', cursor: 'pointer' }}
                />
                Rimani connesso
              </label>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={styles.loginBtn}
              style={loading ? { opacity: 0.75 } : {}}
            >
              {loading && <Spinner size="tiny" appearance="inverted" />}
              {loading ? 'Accesso in corso...' : 'ACCEDI'}
            </button>

          </form>
        </div>
      </div>

      {/*  Right panel: blue decoration (hidden on mobile)  */}
      <div
        className="hidden md:flex"
        style={{
          flex: '1 1 50%',
          flexDirection: 'column' as const,
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #c9e8f8 0%, #0F6CBD 45%, #1a3a6b 100%)',
          position: 'relative' as const,
          overflow: 'hidden',
          padding: '40px',
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '260px', height: '260px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', top: '30%', left: '10%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        {/* Logo + tagline */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '140px', height: '140px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(4px)',
          }}>
            <img
              src="/logo.png"
              alt="LyfeUmbria"
              style={{ width: '100px', height: '100px', objectFit: 'contain' }}
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.style.display = 'none';
                const parent = img.parentElement as HTMLElement;
                parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>';
              }}
            />
          </div>
          <p style={{ color: '#ffffff', fontSize: '24px', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '10px' }}>
            LyfeUmbria
          </p>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', maxWidth: '260px', lineHeight: 1.6 }}>
            Gestione proprietà immobiliare
          </p>
        </div>
      </div>

    </div>
  );
}
